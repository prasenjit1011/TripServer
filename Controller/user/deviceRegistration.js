
const mongoose = require("mongoose");
const ResponseCode = require("../../service/responseCode");
const { DBerror, InputError } = require("../../service/errorHandeler");
const deviceRegistrationModel = require("../../Models/deviceRegistration");
const cron = require("node-cron");
const request = require("request");

    const SecretKey =
    "key=AAAA6-brgqU:APA91bFVDR2FmnNTPjzcWCCF6KtFWVUJx_gak-G9_BRnEzBWPNTCTMUfTd5MW7KaDUNvM6gI3qF0VEhXZpDC_j35batDjqsgURZ_bRkQ4HeQk5qqbUxHazXplO3jQSUfrJoBg3deeu0P";
  
    // Function to send FCM notification
    const sendNotification = (deviceToken) => {
        const options = {
            method: "POST",
            url: "https://fcm.googleapis.com/fcm/send",
            headers: {
                "content-type": "application/json",
                Authorization: SecretKey,
            },
            body: JSON.stringify({
                registration_ids: [deviceToken],
                priority: "high",
                data: {},
                notification: {
                    title: "Registration Incomplete",
                    body: "You have not completed your registration. Please complete your registration!",
                    vibrate: 1,
                    sound: 1,
                    show_in_foreground: true,
                    priority: "high",
                    content_available: true,
                },
            }),
        };

        // Send FCM notification
        request(options, function (error, response) {
            if (error) {
                console.error("Error sending FCM notification:", error);
            } else {
                console.log("FCM notification sent successfully:", response.body);
            }
        });
    };


// Function to send FCM notification to all devices
const allDeviceSendNotification = async () => {
    try {
        // Fetch all devices from the database
        const allDevices = await deviceRegistrationModel.find({}, 'deviceToken');

        // Send notifications to each device
        allDevices.forEach((device) => {
            sendNotification(device.deviceToken);
        });
    } catch (error) {
        console.error("Error sending notifications to all devices:", error);
    }
};


const scheduleNotification = () => {
    // Schedule the cron job to run every 24 hours
    cron.schedule("0 0 */1 * *", () => {
        // Call the function to send FCM notification to all devices
        allDeviceSendNotification();
    });
};


// const scheduleNotification = () => {
//     // Schedule the cron job to run every five minutes 
//     cron.schedule("*/5 * * * *", () => {
//         // Call the function to send FCM notification to all devices
//         allDeviceSendNotification();
//     });
// };

const deviceRegistrationAlert = async (req, res) => {
    const { deviceId, deviceToken } = req.body;;
    try {
        if (!deviceId || !deviceToken) {
            return res.status(ResponseCode.errorCode.requiredError).json({
                status: false,
                message: "Missing deviceId or deviceToken in the request",
            });
        }

        // Check if a device with the given ID or Token already exists
        const existingDevice = await deviceRegistrationModel.findOne({
            $or: [{ deviceId }, { deviceToken }],
        });
        if (existingDevice) {

            // // If the device already exists, schedule the notification
            // scheduleNotification();
            return res.status(ResponseCode.errorCode.dataExist).json({
                status: false,
                message: "Device with this ID or Token already exists",
            });
        }

        console.log("user registration successs");

        // Create a new device registration document
        const deviceData = {
            deviceId: deviceId,
            deviceToken: deviceToken,
            createdOn: new Date(),
        };

        // Save the device registration document to the database
        const addDevice = new deviceRegistrationModel(deviceData);
        const savedData = await addDevice.save();

        // Check if the data was saved successfully before scheduling the notification
        if (savedData) {
            // Schedule the notification for the newly registered device
            // scheduleNotification();
        }

        // Send a success response
        return res.status(ResponseCode.errorCode.success).json({
            status: true,
            message: "Device registration added successfully",
        });
    } catch (error) {
        console.log("Error in device registration:", error);

        // Handle other errors
        const errors = DBerror(error);
        return res.status(ResponseCode.errorCode.serverError).json({
            status: false,
            message: "Server error, please try again later",
            error: errors,
        });
    }
};


const deleteDeviceRegistration = async (req, res) => {
    try {
        const deviceId = req.params.deviceId;
        // Check if the device registration exists
        const existingDevice = await deviceRegistrationModel.findOne({ deviceId: deviceId });

        if (!existingDevice) {
            return res.status(ResponseCode.errorCode.dataNotFound).json({
                status: false,
                message: "Device registration not found",
            });
        }

        // Delete the device registration
        await deviceRegistrationModel.deleteOne({ deviceId: deviceId });

        return res.status(ResponseCode.errorCode.success).json({
            status: true,
            message: "Device registration deleted successfully",
        });

    } catch (error) {
        // Handle other errors
        const errors = DBerror(error);
        return res.status(ResponseCode.errorCode.serverError).json({
            status: false,
            message: "Server error, please try again later",
            error: errors,
        });
    }
};


module.exports = {
    deviceRegistrationAlert,
    deleteDeviceRegistration,
    allDeviceSendNotification,
    scheduleNotification

};
