var mongoose = require("mongoose");
var User = require("../../Models/user");
var bcrypt = require("bcryptjs");
var ResponseCode = require("../../service/responseCode");
var BookingDetails = require("../../Models/bookingDetails");
var UserBookings = require("../../Models/userBooking");
var notificationModel = require("../../Models/notification");
const availabilityModel = require("../../Models/availability");
var Currency = require("../../Models/currency");
var request = require("request");
const nodemailer = require("nodemailer");
const moment = require("moment");
const SecretKey =
  "key=AAAA6-brgqU:APA91bFVDR2FmnNTPjzcWCCF6KtFWVUJx_gak-G9_BRnEzBWPNTCTMUfTd5MW7KaDUNvM6gI3qF0VEhXZpDC_j35batDjqsgURZ_bRkQ4HeQk5qqbUxHazXplO3jQSUfrJoBg3deeu0P";
var jwt = require("jsonwebtoken");
const { Validator } = require("node-input-validator");
const { DBerror, InputError } = require("../../service/errorHandeler");
function formatDate(dateString) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = months[date.getMonth()];
  const day = date.getDate();

  return `${month} ${day}, ${year}`;
}

function createToken(data) {
  return jwt.sign(data, "user@1234567890");
}

const getTokenData = async (token) => {
  let userData = await User.findOne({ token: token }).exec();
  return userData;
};

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: "thingstodoo85@gmail.com",
    pass: "fnuf lemg isln emly"
  },
});

const sendEmail = (options) => {
  transporter.sendMail(options, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log(`Email has been sent: ${info.response}`);
    }
  });
};

const register = async (req, res) => {
  const v = new Validator(req.body, {
    email: "required",
    mobileNo: "required",
    password: "required|minLength:8",
  });
  const mailOption = {
    from: "thingstodoo85@gmail.com",
    to: req.body.email,
    subject: "Welcome Message",
    html: `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f2f2f2;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background-color: #ffffff;
              padding: 20px;
              border-radius: 5px;
              box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            }
            h1 {
              color: #333333;
              font-size: 24px;
              margin-bottom: 20px;
            }
            p {
              color: #666666;
              font-size: 16px;
              line-height: 1.5;
              margin-bottom: 10px;
            }
            a {
              color: #007bff;
              text-decoration: none;
            }
            a:hover {
              text-decoration: underline;
            }
          </style>
        </head>
        <body>
        <div class="container">
          <h1>Welcome to Our Company!</h1>
          <p>Dear ${req.body.firstName} ${req.body.lastName},</p>
          <p>We are excited to inform you that your new account has been successfully created.</p>
          <p>Best regards,</p>
          <p>ThingsToDo</p>
        </div>
        </body>
      </html>
    `,
  };

  let matched = await v.check().then((val) => val);
  if (!matched) {
    return res.status(ResponseCode.errorCode.success).send({
      status: false,
      error: v.errors,
      message: InputError(v.errors),
    });
  }

  await User.findOne({
    $or: [{ email: req.body.email }, { mobileNo: req.body.mobileNo }],
    isDeleted: false,
  }).then((data) => {
    console.log({ data });
    if (data) {
      return res.status(ResponseCode.errorCode.dataExist).json({
        status: false,
        message: "Email or Mobile already exist",
      });
    } else {
      const userData = {
        ...req.body,
        password: bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10)),
        token: createToken(req.body),
      };
      new User(userData)
        .save()
        .then(async (data) => {
          var userData = {
            _id: data._id,
            token: data.token,
          };

          var checkbooking = await BookingDetails.find({
            email: data.email,
          }).exec();

          if (checkbooking.length > 0) {
            BookingDetails.updateMany(
              { email: checkbooking[0].email },
              { userId: data._id }
            ).exec();
            UserBookings.updateMany(
              { email: checkbooking[0].email },
              { userId: data._id }
            ).exec();
          }

          transporter.sendMail(mailOption, function (error, info) {
            // console.log("mailOption===",mailOption);
            if (error) {
              console.log(error);
            } else {
              console.log("Email has been sent:- ", info.response);
            }
          });


          res.status(ResponseCode.errorCode.success).json({
            status: true,
            message: "user register seucessfully",
            data: userData,
          });
        })
        .catch((error) => {
          console.log("error", error);
          res.status(ResponseCode.errorCode.serverError).json({
            status: false,
            message: "server error please try again",
            // data:data
          });
        });
    }
  });
};

const registerWithGoogle = async (req, res) => {
  await User.findOne({ email: req.body.email, isDeleted: false }).then(
    (data) => {
      if (data) {
        return res.status(ResponseCode.errorCode.dataExist).json({
          status: false,
          success: true,
          message: "Email  already exist",
        });
      } else {
        const userData = {
          ...req.body,
          googleId: req.body.googleId,
          token: createToken(req.body),
        };
        new User(userData)
          .save()
          .then(async (data) => {
            var userData = {
              _id: data._id,
              token: data.token,
            };

            var checkbooking = await BookingDetails.find({
              email: data.email,
            }).exec();

            if (checkbooking.length > 0) {
              BookingDetails.updateMany(
                { email: checkbooking[0].email },
                { userId: data._id }
              ).exec();
              UserBookings.updateMany(
                { email: checkbooking[0].email },
                { userId: data._id }
              ).exec();
            }

            res.status(ResponseCode.errorCode.success).json({
              status: true,
              message: "user register seucessfully",
              data: userData,
            });
          })
          .catch((error) => {
            console.log("error", error);
            res.status(ResponseCode.errorCode.serverError).json({
              status: false,
              message: "server error please try again",
              // data:data
            });
          });
      }
    }
  );
};

const login = async (req, res) => {
  // console.log(req.body);
  const V = new Validator(req.body, {
    email: "required|email",
    password: "required",
    // name: "required"
  });
  let matched = await V.check().then((val) => val);
  if (!matched) {
    return res
      .status(ResponseCode.errorCode.success)
      .send({ status: false, error: V.errors });
  }

  await User.findOne({ email: req.body.email })
    .then(async (data) => {
      // console.log("data",data);
      if (data) {
        if (data.status == true && data.isDeleted == false) {
          if (bcrypt.compareSync(req.body.password, data.password)) {
            // const dataToken = jwt.sign(
            //     {
            //       id: data._id,
            //       email: data.email,
            //     },
            //     "avishekmaity@user",
            //   );
            var userData = {
              _id: data._id,
              token: data.token,
            };

            return res.status(ResponseCode.errorCode.success).json({
              status: true,
              message: "user Login Sucessfully",
              result: userData,
            });
          } else {
            return res.status(ResponseCode.errorCode.dataNotFound).json({
              status: false,
              message: "Email and Password Not Found",
            });
          }
        } else {
          return res.status(ResponseCode.errorCode.dataNotmatch).json({
            status: false,
            message: "your account is inactive,contaact to administrative ",
          });
        }
      } else {
        return res.status(ResponseCode.errorCode.dataNotFound).json({
          status: false,
          message: "Email & Password Not Found",
        });
      }
    })
    .catch((err) => {
      console.log(err);
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server Error Please Try Again",
      });
    });
};

const loginWithGoogle = async (req, res) => {
  await User.findOne({ email: req.body.email })
    .then(async (data) => {
      // console.log("data",data);
      if (data) {
        if (data.status == true && data.isDeleted == false) {
          if (data.googleId === req.body.googleId) {
            var userData = {
              _id: data._id,
              token: data.token,
            };

            return res.status(ResponseCode.errorCode.success).json({
              status: true,
              message: "user Login Sucessfully",
              result: userData,
            });
          } else {
            return res.status(ResponseCode.errorCode.dataNotFound).json({
              status: false,
              message: "Email and Id  Not Found",
            });
          }
        } else {
          return res.status(ResponseCode.errorCode.dataNotmatch).json({
            status: false,
            message: "your account is inactive,contact to administrative ",
          });
        }
      } else {
        return res.status(ResponseCode.errorCode.dataNotFound).json({
          status: false,
          message: "email & Id Not Found",
        });
      }
    })
    .catch((err) => {
      console.log(err);
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server Error Please Try Again",
      });
    });
};

const ReviewNotification = async (req, res) => {
  console.log("api hit===")

  const date = new Date();
  const formattedDate = date.toISOString().substring(0, 10);

  try {
    const userBookings = await UserBookings.find({
      userId: req.user._id,
      bookingDate: { $lt: formattedDate },
      // reviewStatus: false,
    }).exec();

    if (userBookings.length > 0) {
      const userData = await User.aggregate([
        {
          $match: {
            _id: req.user._id,
            reviewStatus: true,
            deviceToken: { $exists: true },
          },
        },
        {
          $project: {
            deviceToken: 1,
          },
        },
      ]);

      if (userData.length > 0) {
        const notificationData = {
          userId: req.user._id, 
          title: 'Review',
          description: 'Give us a review',
          notification_type: 'review',
        };
        const savedNotification = await new notificationModel(notificationData).save();
        console.log("save notification data",savedNotification);
        if (savedNotification) {
          // Send a notification to the user
          const options = {
            method: "POST",
            url: "https://fcm.googleapis.com/fcm/send",
            headers: {
              "content-type": "application/json",
              Authorization: SecretKey,
            },
            body: JSON.stringify({
              registration_ids: [userData[0].deviceToken],
              priority: "high",
              data: {},
              notification: {
                title: "Review",
                body: `Give us a review`,
                vibrate: 1,
                sound: 1,
                show_in_foreground: true,
                priority: "high",
                content_available: true,
              },
            }),
          };

          request(options, function (error, response) {
            if (error) {
              console.error(error);
              return res.status(500).json({
                status: false,
                message: "Error sending notification",
              });
            }

            console.log("Notification sent:", response.body);

            return res.status(ResponseCode.errorCode.success).json({
              status: true,
              message: "Review notification sent successfully",
            });
          });
        } else {
          return res.status(500).json({
            status: false,
            message: "Error saving notification data",
          });
        }
      } else {
        return res.status(ResponseCode.errorCode.dataNotFound).json({
          status: false,
          message: "User data not found for sending review notification",
        });
      }
    } else {
      return res.status(ResponseCode.errorCode.dataNotFound).json({
        status: false,
        message: "Review already given or no relevant bookings found",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: "Server error",
    });
  }
};


const viewNotification = async (req, res) => {
  try {
    const userId = req.user._id;
    const notifications = await notificationModel.aggregate([
      {
        $match: {
          userId: userId,
        },
      },
    ]);

    console.log("notification data is",notifications);

    if (notifications.length === 0) {
      return res.status(404).json({
        status: false,
        message: "No notifications found for the user",
        errorCode: "NO_NOTIFICATIONS_FOUND",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Notifications retrieved successfully",
      data: notifications,
    });
  } catch (error) {
    console.error("=====", error);
    return res.status(500).json({
      status: false,
      message: "Server Error. Please Try Again",
      errorCode: "SERVER_ERROR",
      error: error.message, 
    });
  }
};

const userGetProfile = async (req, res) => {
  await User.aggregate([
    {
      $match: {
        _id: req.user._id,
      },
    },
    {
      $lookup: {
        from: "currencies",
        localField: "currency",
        foreignField: "_id",
        as: "currencyData",
      },
    },
    {
      $unwind: {
        path: "$currencyData",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        currency: "$currencyData.name",
      },
    },
    {
      $project: {
        password: 0,
        createdOn: 0,
        updatedOn: 0,
        token: 0,
        status: 0,
        isDeleted: 0,
        __v: 0,
      },
    },
  ])
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "profile get Sucessfully",
        data: data,
      });
    })
    .catch((error) => {
      return res.status(ResponseCode.errorCode.serverError).json({
        status: true,
        message: "Server Error Please Try Again",
        error: error,
      });
    });
};

const viewAllCurency = async (req, res) => {
  await Currency.aggregate([
    {
      $project: {
        symbol: 1,
        name: 1,
        symbol_native: 1,
      },
    },
  ])
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "profile get Sucessfully",
        data: data,
      });
    })
    .catch((error) => {
      return res.status(ResponseCode.errorCode.serverError).json({
        status: true,
        message: "Server Error Please Try Again",
        error: error,
      });
    });
};

const update = (req, res) => {
  return User.findOneAndUpdate(
    {_id: { $in: [new mongoose.Types.ObjectId(req.user._id)] } },
    {
      ...req.body,
    }
  )
    .then((data) => {
      // const adminMailOptions = {
      //   from: "thingstodoo85@gmail.com",
      //   to: 'manish9681053451@gmail.com',
      //   subject: "New Merchant Request",
      //   html: `
      //     <html>
      //       <head>
      //         <style>
      //           body {
      //             font-family: Arial, sans-serif;
      //             background-color: #f2f2f2;
      //           }
      //           .container {
      //             max-width: 600px;
      //             margin: 20px auto;
      //             background-color: #ffffff;
      //             padding: 20px;
      //             border-radius: 5px;
      //             box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      //           }
      //           h1 {
      //             color: #333333;
      //             font-size: 24px;
      //             margin-bottom: 20px;
      //           }
      //           p {
      //             color: #666666;
      //             font-size: 16px;
      //             line-height: 1.5;
      //             margin-bottom: 10px;
      //           }
      //           a {
      //             color: #007bff;
      //             text-decoration: none;
      //           }
      //           a:hover {
      //             text-decoration: underline;
      //           }
      //         </style>
      //       </head>
      //       <body>
      //         <div class="container">
      //           <h1>New Merchant Request</h1>
      //           <p>Dear Admin,</p>
      //           <p>A new user has requested merchant status. Here are the details:</p>
      //           <ul>
      //             <li><strong>Name:</strong> ${req.body.firstName} ${req.body.lastName}</li>
      //             <li><strong>Email:</strong> ${req.body.email}</li>
      //           </ul>
      //           <p>Please review and take necessary actions.</p>
      //           <p>If you have any questions or need assistance, feel free to reach out to us.</p>
      //           <p>Thank you!</p>
      //           <p>Best regards,</p>
      //           <p>ThingsToDo</p>
      //         </div>
      //       </body>
      //     </html>
      //   `,
      // };



      if (data != null) {
        data = { ...data._doc, ...req.body };
        // sendEmail(adminMailOptions);
        return res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "user profile updated successfully",
          // data: data,
        });
      } else {
        return res.status(ResponseCode.errorCode.dataNotmatch).json({
          status: false,
          message: "User not match",
          data: null,
        });
      }
    })
    .catch((err) => {
      console.log(err);
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error. Please try again.",
        error: err,
      });
    });
};

const passwordChange = async (req, res) => {
  // ... (your existing validation and error handling code)

  await User.findOne({ _id: req.user._id })
    .then(async (data) => {
      if (data) {
        // Use comparePassword method to compare old password
        // const isPasswordMatch = await data. bcrypt.compare(req.body.oldPassword);
        //  console.log("data", bcrypt.compare(req.body.oldPassword))

        bcrypt.compare(
          req.body.oldPassword,
          data.password,
          async (err, data1) => {
            //if error than throw error
            if (err) throw err;

            //if both match than you can do anything
            if (data1) {
              console.log("data._id ", data._id);
              await User.updateOne(
                { _id: data._id },
                {
                  $set: {
                    password: bcrypt.hashSync(
                      req.body.password,
                      bcrypt.genSaltSync(10)
                    ),
                  },
                }
              );
              res.status(200).json({
                status: true,
                message: "User password change successfully",
              });
            } else {
              res.status(ResponseCode.errorCode.dataNotmatch).json({
                status: false,
                message: "Password not match",
                data: null,
              });
            }
          }
        );

        // if (data.password == bcrypt.compare(req.body.oldPassword)) {
        //   // Update the password with the new hashed password
        //   await User.updateOne(
        //     { _id: data._id },
        //     { $set: { password: bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10)) } }
        //   );

        //   res.status(ResponseCode.errorCode.success).json({
        //     status: true,
        //     message: "User password change successful",
        //   });
        // } else {
        //   res.status(ResponseCode.errorCode.dataNotmatch).json({
        //     status: false,
        //     message: "Password not match",
        //     data: null,
        //   });
        // }
      } else {
        res.status(ResponseCode.errorCode.dataNotmatch).json({
          status: false,
          message: "User not found",
          data: null,
        });
      }
    })
    .catch((error) => {
      console.log("error", error);
      res.status(500).json({
        status: false,
        message: "Server error, Please try again later",
        error: error,
      });
    });
};

const sendOtpToExistingEmail = async (req, res) => {
  User.findOne({ email: req.body.email })
    .then((data) => {
      console.log("data", data);
      if (data != null || data != "") {
        var val = Math.floor(1000 + Math.random() * 9000);

        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
          requireTLS: true,
          auth: {
            // user: "thingstodoo85@gmail.com",
            // pass: "yzqkegawigupokwq",
            user: "thingstodoo85@gmail.com",
            pass: "fnuf lemg isln emly",
          },
        });
        const mailOption = {
          from: "thingstodoo85@gmail.com",
          to: req.body.email,
          subject: "Welcome Message",
          html: `
              <html>
                <head>
                  <style>
                    body {
                      font-family: Arial, sans-serif;
                      background-color: #f2f2f2;
                    }
                    .container {
                      max-width: 600px;
                      margin: 20px auto;
                      background-color: #ffffff;
                      padding: 20px;
                      border-radius: 5px;
                      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                    }
                    h1 {
                      color: #333333;
                      font-size: 24px;
                      margin-bottom: 20px;
                    }
                    p {
                      color: #666666;
                      font-size: 16px;
                      line-height: 1.5;
                      margin-bottom: 10px;
                    }
                    a {
                      color: #007bff;
                      text-decoration: none;
                    }
                    a:hover {
                      text-decoration: underline;
                    }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <h1>Welcome to Our Company!</h1>
                    <p>Dear ${data.firstName} ${data.lastName},</p>
                    <p>Your Otp is - ${val}</p>                   
                    <p>If you have any questions or need assistance, feel free to reach out to us.</p>
                    <p>Thank you and welcome aboard!</p>
                    <p>Best regards,</p>
                    <p>ThingsToDo</p>
                  </div>
                </body>
              </html>
            `,
        };
        transporter.sendMail(mailOption, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log("Email has been sent:- ", info.response);
            res.status(ResponseCode.errorCode.success).json({
              status: true,
              message: "Otp is send to mail",
              otp: val,
              id: data._id,
            });
          }
        });
      } else {
        res.status(ResponseCode.errorCode.dataNotmatch).json({
          status: false,
          message: "User not found",
        });
      }
    })
    .catch((error) => {
      console.log("error", error);
      res.status(500).json({
        status: false,
        message: "Server error, Please try again later",
        error: error,
      });
    });
};

const passwordChangeWithoutToken = async (req, res) => {
  await User.findOneAndUpdate(
    { _id: req.body.id },
    {
      $set: {
        password: bcrypt.hashSync(req.body.newPassword, bcrypt.genSaltSync(10)),
      },
    }
  );
  res.status(200).json({
    status: true,
    message: "User password change successfully",
  });
};

const calenderwiseAvailability = async (req, res) => {
  const currentDate = new Date();
  const years = currentDate.getFullYear();
  const month = (currentDate.getMonth() + 1).toString().padStart(2, "0"); // Months are zero-indexed, so we add 1
  const day = currentDate.getDate().toString().padStart(2, "0");
  const dateString = `${years}-${month}-${day}`;
  console.log(dateString);

  // var { month1,month2, year } = req.body;
  // availabilityModel
  //   .aggregate([
  //     {
  //       $addFields: {
  //         book: "$tourDate",
  //         year: { $year: { $toDate: "$tourDate" } },
  //         month: { $month: { $toDate: "$tourDate" } },

  //       },
  //     },
  //     {
  //       $match: {
  //         isDeleted: false,
  //         activityDetailsId: new mongoose.Types.ObjectId(req.body.id),
  //         year: year,
  //         $or:[
  //           { month: month1},
  //           { month: month2}
  //         ]

  //       },
  //     },
  //     {
  //       $sort: {
  //         tourDate: 1,
  //       },
  //     },
  //     {
  //       $group: {
  //         _id: "$tourDate",
  //         remainingUsers: { $sum: "$remeningUser" },
  //       },
  //     },
  //     {
  //       $project: {
  //         __v: 0,
  //         isDeleted: 0,
  //         book: 0,
  //         year: 0,
  //         month: 0,
  //         createdOn: 0,
  //         updatedOn: 0,
  //       },
  //     },
  //   ])

  const { month1, month2, year, id } = req.body;
  availabilityModel
    .aggregate([
      // {
      //   $match: {
      //     isDeleted: false,
      //     activityDetailsId:new mongoose.Types.ObjectId(id),
      //       $and: [
      //         { $eq: [{ $year: "$tourDate" }, year] },
      //         {
      //           $or: [
      //             { $eq: [{ $month: "$tourDate" }, month1] },
      //             { $eq: [{ $month: "$tourDate" }, month2] },
      //           ],
      //         },
      //       ],
      //   },
      // },
      {
        $addFields: {
          book: "$tourDate",
          year: { $year: { $toDate: "$tourDate" } },
          month: { $month: { $toDate: "$tourDate" } },
        },
      },
      // {
      //   $match: {
      //     tourDate: {
      //       $gt: dateString,
      //     },
      //     isDeleted: false,
      //     activityDetailsId: new mongoose.Types.ObjectId(req.body.id),
      //     year: year,
      //     $or: [{ month: month1 }, { month: month2 }],
      //   },
      // },
      {
        $match: {
          isDeleted: false,
          activityDetailsId: new mongoose.Types.ObjectId(req.body.id),
          remeningUser : { $gte: 0 } ,
          $expr: {
            $gte: [
              {
                $dateFromString: {
                  dateString: "$tourDate",
                  format: "%Y-%m-%d"  // Adjust the format based on your date strings
                }
              },
              new Date(/*"2023-01-01"*/)  // Replace this with your desired date for comparison
            ]
          }
        } , 
      } , 
      {
        $sort: {
          tourDate: 1,
        },
      },
      // {
      //   $group: {
      //     _id: {
      //       "tourDate": "$tourDate",
      //       // "time": "$time"
      //     },
      //     remainingUsers: { $sum: "$remeningUser" },
      //   },
      // },
      {
        $group: {
          _id: "$tourDate",
          remainingUsers: { $sum: "$remeningUser" },
          // details: []
        },
      },
      {
        $lookup: {
          from: "availabilities",
          pipeline: [
            {
              $match: {
                isDeleted: false,
                activityDetailsId: new mongoose.Types.ObjectId(req.body.id),
                // year: year,
                // $or: [
                //   { month: month1 },
                //   { month: month2 }
                // ]
              },
            },
            {
              $group: {
                _id: "$time",
                remainingUsers: { $sum: "$remeningUser" },
              },
            },
          ],
          localField: "_id",
          foreignField: "tourDate",
          as: "tourDetails",
        },
      },
    ])
    .then((data) => {
      // console.log("data for available date :", data)

      if (data.length > 0) {
        return res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "view All availability",
          data: data,
        });
      } else {
        return res.status(ResponseCode.errorCode.dataNotFound).json({
          status: false,
          message: "data not found",
          data: data,
        });
      }
    })
    .catch((error) => {
      console.log(error);
      const errors = DBerror(error);
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error,Please try again",
        error: errors,
      });
    });
};

module.exports = {
  register,
  registerWithGoogle,
  login,
  loginWithGoogle,
  getTokenData,
  userGetProfile,
  update,
  viewAllCurency,
  ReviewNotification,
  passwordChange,
  sendOtpToExistingEmail,
  passwordChangeWithoutToken,
  calenderwiseAvailability,
  viewNotification
};
