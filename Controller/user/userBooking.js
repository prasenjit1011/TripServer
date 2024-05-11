const mongoose = require("mongoose");
const puppeteer = require("puppeteer");
const userBooking = require("../../Models/userBooking");
const BookingDetails = require("../../Models/bookingDetails");
const availabilityData = require("../../Models/availability");
const activity = require("../../Models/activityDetails");
const Cart = require("../../Models/cart");
const Wishlist = require("../../Models/wishlist");
const CartTimeCheck = require("../../Models/cartTimeCheck");
const moment = require("moment");
const User = require("../../Models/user");
const ResponseCode = require("../../service/responseCode");
const { DBerror, InputError } = require("../../service/errorHandeler");
const GiftCard = require("../../Models/giftCard");
const CardHistory = require("../../Models/CardHistory");
const MerchantCommission = require("../../Models/marchentCommission");
const Merchant = require("../../Models/merchant");
const { HtmlToPdf } = require("../../service/pdfGenerator");
// const { doPDFUpload } = require("../../service/s3")
const { doPDFUploadNew, doPDFUpload } = require("../../service/s3")
var request = require("request");
const fs = require("fs");
const cron = require("node-cron");
const nodemailer = require("nodemailer");
const SecretKey =
  "key=AAAA6-brgqU:APA91bFVDR2FmnNTPjzcWCCF6KtFWVUJx_gak-G9_BRnEzBWPNTCTMUfTd5MW7KaDUNvM6gI3qF0VEhXZpDC_j35batDjqsgURZ_bRkQ4HeQk5qqbUxHazXplO3jQSUfrJoBg3deeu0P";

function convertDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// const addBooking00 = async (req, res) => {
//   var orderId = new mongoose.Types.ObjectId();

//   // var num = Math.floor(Math.random() * (9999 - 100)) + 100;
//   var alpfaNueID = "";
//   var bkid = await BookingDetails.findOne(
//     {},
//     { alpfaNueID: 1 },
//     { sort: { createdOn: -1 } }
//   ).exec();

//   var inputString = "THD100001";
//   if (bkid == null || bkid == "") {
//     alpfaNueID = inputString;
//   } else {
//     const substring = Number(bkid.alpfaNueID.slice(3)) + 1;
//     alpfaNueID = "THD" + substring;
//   }
//   console.log({ alpfaNueID });

//   // return false

//   try {
//     req.body.items.forEach(async (ele) => {
//       if (ele.cart === "activity") {
//         var getOrderId = await new userBooking({
//           activityDetailsId: ele.activityDetailsId,
//           bookingDate: ele.bookingDate,
//           bookingTime: ele.bookingTime,
//           bookingType: "activity",
//           bookingStatus: "confirmed",
//           alpfaNueID: alpfaNueID,
//           totalTourPerson: ele.totalTourPerson,
//           participentType: ele.participentType,
//           orderId: orderId,
//           userId: req.user._id,
//           createdOn: new Date(),
//         }).save();

//         Cart.deleteOne({ _id: new mongoose.Types.ObjectId(ele.cartid) }).exec();
//         CartTimeCheck.deleteOne({
//           cartId: new mongoose.Types.ObjectId(ele.cartid),
//         }).exec();

//         // var DiscountedPrice: req.body.discountedPrice || req.body.actualPrice,

//         if (req.body.discountedPrice) {
//           var DiscountedPrice = req.body.discountedPrice;
//         } else {
//           var DiscountedPrice = req.body.actualPrice;
//         }

//         var userType = await activity
//           .findOne({
//             _id: new mongoose.Types.ObjectId(ele.activityDetailsId),
//             addedBy: "merchant",
//           })
//           .exec();

//         // console.log("getOrderId", getOrderId.orderId)

//         if (userType) {
//           var commisionData = await Merchant.findOne({
//             _id: new mongoose.Types.ObjectId(userType.addedByid),
//           }).exec();

//           // console.log("commisionData", commisionData.commisionPercentage)
//           var percentage = commisionData.commisionPercentage;

//           var adminAmount = ((DiscountedPrice * percentage) / 100).toFixed(2);
//           var merchnatAmount = (DiscountedPrice - adminAmount).toFixed(2);

//           var merchantComData = {
//             marchentID: userType.addedByid,
//             percentage: percentage,
//             activityID: ele.activityDetailsId,
//             bookingDate: ele.bookingDate,
//             adminAmount: adminAmount,
//             marchentCommissionAmount: merchnatAmount,
//             activityAmount: DiscountedPrice,
//             bookingDate: ele.bookingDate,
//             bookingDateFormate: new Date(ele.bookingDate),
//             orderID: getOrderId.orderId,
//           };
//           new MerchantCommission(merchantComData).save();
//         }

//         if (ele.folderId !== undefined || ele.folderId !== "") {
//           console.log("enter");
//           Wishlist.findOneAndUpdate(
//             {
//               userId: req.user._id,
//               folderId: new mongoose.Types.ObjectId(ele.folderId),
//               activityId: new mongoose.Types.ObjectId(ele.activityDetailsId),
//             },
//             {
//               $set: {
//                 pastWishlist: true,
//               },
//             }
//           ).exec();
//         }
//       } else {
//         new userBooking({
//           activityDetailsId: ele.activityId || null,
//           amount: ele.amount,
//           giftCode: ele.giftCode,
//           bookingType: "giftcard",
//           sendToEmail: "pending",
//           bookingStatus: "confirmed",
//           personalMsg: ele.personalMsg || "",
//           expirationDate: ele.expirationDate,
//           bookingDate: ele.bookingDate,
//           alpfaNueID: alpfaNueID,
//           bookingTime: ele.bookingTime,
//           orderId: orderId,
//           userId: req.user._id,
//           createdOn: new Date(),
//         }).save();

//         new CardHistory({
//           senderId: req.user._id,
//           activityId: ele.activityId || null,
//           giftCode: ele.giftCode,
//           personalMsg: ele.personalMsg || "",
//           expirationDate: ele.expirationDate,
//           bookingTime: ele.bookingTime,
//           amount: ele.amount,
//           createdOn: new Date(),
//         }).save();

//         GiftCard.deleteOne({
//           _id: new mongoose.Types.ObjectId(ele.cartid),
//         }).exec();
//       }
//     });

//     var slotFind = await availabilityData
//       .aggregate([
//         {
//           $match: {
//             activityDetailsId: new mongoose.Types.ObjectId(
//               req.body.items[0].activityDetailsId
//             ),
//             tourDate: req.body.items[0].bookingDate,
//             time: req.body.items[0].bookingTime,
//           },
//         },
//         {
//           $project: {
//             __v: 0,
//           },
//         },
//       ])
//       .exec();

//     console.log("slotFind", slotFind);

//     if (slotFind.length > 0) {
//       var actualSlot = slotFind[0].remeningUser;

//       var tourPerson = req.body.items[0].totalTourPerson;

//       var newSlot = actualSlot - tourPerson;
//       // var newObj = {
//       //   remeningUser: newSlot
//       // }
//       // console.log("newObj", newObj)
//       // console.log("newSlot", newSlot)
//       // console.log("req.body.items[0].activityDetailsId", req.body.items[0].activityDetailsId)
//       await availabilityData
//         .findOneAndUpdate(
//           {
//             activityDetailsId: new mongoose.Types.ObjectId(
//               req.body.items[0].activityDetailsId
//             ),
//             tourDate: req.body.items[0].bookingDate,
//             time: req.body.items[0].bookingTime,
//           },
//           {
//             $set: {
//               remeningUser: newSlot,
//             }, // Corrected field name to "remainingUser"
//           }
//         )
//         .then((data) => {
//           console.log("dataaaa  ", dataUp);
//         })
//         .catch((err) => {
//           console.log("error", err);
//         });
//     }

//     new BookingDetails({
//       userId: req.user._id,
//       orderId: orderId,
//       alpfaNueID: alpfaNueID,
//       // bookingStatus: "completed",
//       bookingDate: req.body.items[0].bookingDate,
//       bookingTime: req.body.items[0].bookingTime,
//       actualPrice: req.body.actualPrice,
//       discountedPrice: req.body.discountedPrice || req.body.actualPrice,
//       createdOn: new Date(),
//     })
//       .save()
//       .then(async (result) => {
//         ticketSendToEmail(result.userId, result.orderId, result.email);

//         User.aggregate([
//           {
//             $match: {
//               _id: result.userId,
//               bookingStatus: true,
//               deviceToken: { $exists: true },
//             },
//           },
//           {
//             $project: {
//               deviceToken: 1,
//             },
//           },
//         ])
//           .then(async (data) => {
//             console.log("data", data);

//             if (data.length > 0) {
//               var options = {
//                 method: "POST",
//                 url: "https://fcm.googleapis.com/fcm/send",
//                 headers: {
//                   "content-type": "application/json",
//                   Authorization: SecretKey,
//                 },
//                 body: JSON.stringify({
//                   registration_ids: [data[0].deviceToken],
//                   priority: "high",
//                   data: {},
//                   notification: {
//                     title: "Booking done successfully",
//                     body: `Your payment is done successfully`,
//                     vibrate: 1,
//                     sound: 1,
//                     show_in_foreground: true,
//                     priority: "high",
//                     content_available: true,
//                   },
//                 }),
//               };
//               request(options, function (error, response) {
//                 if (error) throw new Error(error);
//                 console.log(response.body);
//               });
//             }

//             if (req.body.giftCouponCode) {
//               GiftCard.findOneAndUpdate(
//                 {
//                   giftCode: req.body.giftCouponCode,
//                 },
//                 {
//                   $set: {
//                     isRedeemed: true,
//                   },
//                   updatedOn: new Date(),
//                 }
//               ).exec();

//               return res.status(ResponseCode.errorCode.success).json({
//                 status: true,
//                 message: "Booking done successfully",
//                 orderId: orderId,
//               });
//             } else {
//               return res.status(ResponseCode.errorCode.success).json({
//                 status: true,
//                 message: "Booking done successfully",
//                 orderId: orderId,
//               });
//             }
//           })
//           .catch((error) => {
//             console.log(error);

//             return res.status(500).json({
//               status: false,
//               message: "server error",
//             });
//           });
//       })
//       .catch((error) => {
//         console.log(error);
//         return res.status(500).json({
//           status: false,
//           message: "sever error.try again",
//         });
//       });
//   } catch (error) {
//     console.log(error);
//     return res.status(ResponseCode.errorCode.serverError).json({
//       status: false,
//       message: "Server error, please try again",
//       error: error,
//     });
//   }
// };


const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: "thingstodoo85@gmail.comz",
    pass: "fnuf lemg isln emly"
  },
});

// const addBooking000000 = async (req, res) => {
//   var orderId = new mongoose.Types.ObjectId();

//   // var num = Math.floor(Math.random() * (9999 - 100)) + 100;
//   var alpfaNueID = "";
//   var bkid = await BookingDetails.findOne(
//     {},
//     { alpfaNueID: 1 },
//     { sort: { createdOn: -1 } }
//   ).exec();

//   var inputString = "THD100001";
//   if (bkid == null || bkid == "") {
//     alpfaNueID = inputString;
//   } else {
//     const substring = Number(bkid.alpfaNueID.slice(3)) + 1;
//     alpfaNueID = "THD" + substring;
//   }
//   // console.log({ alpfaNueID });

//   // return false
//   // console.log("res.body", res.body);

//   try {
//     const discountedPrice = req.body.discountedPrice || req.body.actualPrice;
//     req.body.items.forEach(async (ele) => {
//       console.log("====ele", ele);
//       if (ele.cart === "activity") {
//         var getOrderId = await new userBooking({
//           activityDetailsId: ele.activityDetailsId,
//           bookingDate: ele.bookingDate,
//           bookingTime: ele.bookingTime,
//           bookingType: "activity",
//           bookingStatus: "confirmed",
//           alpfaNueID: alpfaNueID,
//           totalTourPerson: ele.totalTourPerson,
//           participentType: ele.participentType,
//           orderId: orderId,
//           amount: discountedPrice,
//           userId: req.user._id,
//           createdOn: new Date(),
//         }).save();

//         // console.log("getOrderId", getOrderId);

//         Cart.deleteOne({ _id: new mongoose.Types.ObjectId(ele.cartid) }).exec();
//         CartTimeCheck.deleteOne({
//           cartId: new mongoose.Types.ObjectId(ele.cartid),
//         }).exec();

//         // var DiscountedPrice: req.body.discountedPrice || req.body.actualPrice,

//         if (req.body.discountedPrice) {
//           var DiscountedPrice = req.body.discountedPrice;
//         } else {
//           var DiscountedPrice = req.body.actualPrice;
//         }

//         var userType = await activity
//           .findOne({
//             _id: new mongoose.Types.ObjectId(ele.activityDetailsId),
//             addedBy: "merchant",
//           })
//           .exec();

//         // console.log("getOrderId", getOrderId.orderId)

//         if (userType) {
//           var commisionData = await Merchant.findOne({
//             _id: new mongoose.Types.ObjectId(userType.addedByid),
//           }).exec();

//           // console.log("commisionData", commisionData.commisionPercentage)
//           var percentage = commisionData.commisionPercentage;

//           var adminAmount = ((DiscountedPrice * percentage) / 100).toFixed(2);
//           var merchnatAmount = (DiscountedPrice - adminAmount).toFixed(2);
//           var activityActualPrice1 = DiscountedPrice;

//           var merchantComData = {
//             marchentID: userType.addedByid,
//             percentage: percentage,
//             activityID: ele.activityDetailsId,
//             bookingDate: ele.bookingDate,
//             adminAmount: adminAmount,
//             activityPrice: activityActualPrice1,
//             marchentCommissionAmount: merchnatAmount,
//             activityAmount: DiscountedPrice,
//             bookingDate: ele.bookingDate,
//             bookingDateFormate: new Date(ele.bookingDate),
//             orderID: getOrderId.orderId,
//           };
//           new MerchantCommission(merchantComData).save();
//         }

//         if (ele.folderId !== undefined || ele.folderId !== "") {
//           // console.log("enter");
//           Wishlist.findOneAndUpdate(
//             {
//               userId: req.user._id,
//               folderId: new mongoose.Types.ObjectId(ele.folderId),
//               activityId: new mongoose.Types.ObjectId(ele.activityDetailsId),
//             },
//             {
//               $set: {
//                 pastWishlist: true,
//               },
//             }
//           ).exec();
//         }
//       } else {
//         new userBooking({
//           activityDetailsId: ele.activityId || null,
//           amount: ele.amount,
//           giftCode: ele.giftCode,
//           bookingType: "giftcard",
//           sendToEmail: "pending",
//           bookingStatus: "confirmed",
//           personalMsg: ele.personalMsg || "",
//           expirationDate: ele.expirationDate,
//           bookingDate: ele.bookingDate,
//           alpfaNueID: alpfaNueID,
//           bookingTime: ele.bookingTime,
//           orderId: orderId,
//           userId: req.user._id,
//           createdOn: new Date(),
//         }).save();

//         new CardHistory({
//           senderId: req.user._id,
//           activityId: ele.activityId || null,
//           giftCode: ele.giftCode,
//           giftApplyLink: ele.giftApplyLink,
//           personalMsg: ele.personalMsg || "",
//           expirationDate: ele.expirationDate,
//           bookingTime: ele.bookingTime,
//           amount: ele.amount,
//           createdOn: new Date(),
//         }).save();

//         GiftCard.deleteOne({
//           _id: new mongoose.Types.ObjectId(ele.cartid),
//         }).exec();
//       }
//     });

//     var slotFind = await availabilityData
//       .aggregate([
//         {
//           $match: {
//             activityDetailsId: new mongoose.Types.ObjectId(
//               req.body.items[0].activityDetailsId
//             ),
//             tourDate: req.body.items[0].bookingDate,
//             time: req.body.items[0].bookingTime,
//           },
//         },
//         {
//           $project: {
//             __v: 0,
//           },
//         },
//       ])
//       .exec();

//     // console.log("slotFind", slotFind);

//     if (slotFind.length > 0) {
//       var actualSlot = slotFind[0].remeningUser;

//       var tourPerson = req.body.items[0].totalTourPerson;

//       var newSlot = actualSlot - tourPerson;
//       // var newObj = {
//       //   remeningUser: newSlot
//       // }
//       // console.log("newObj", newObj)
//       // console.log("newSlot", newSlot)
//       // console.log("req.body.items[0].activityDetailsId", req.body.items[0].activityDetailsId)
//       await availabilityData
//         .findOneAndUpdate(
//           {
//             activityDetailsId: new mongoose.Types.ObjectId(
//               req.body.items[0].activityDetailsId
//             ),
//             tourDate: req.body.items[0].bookingDate,
//             time: req.body.items[0].bookingTime,
//           },
//           {
//             $set: {
//               remeningUser: newSlot,
//             }, // Corrected field name to "remainingUser"
//           }
//         )
//         .then((data) => {
//           // console.log("dataaaa ------------- ", data);
//         })
//         .catch((err) => {
//           console.log("error", err);
//         });
//     }

//     new BookingDetails({
//       userId: req.user._id,
//       orderId: orderId,
//       alpfaNueID: alpfaNueID,
//       // bookingStatus: "completed",
//       bookingDate: req.body.items[0].bookingDate,
//       bookingTime: req.body.items[0].bookingTime,
//       actualPrice: req.body.actualPrice,
//       discountedPrice: req.body.discountedPrice || req.body.actualPrice,
//       createdOn: new Date(),
//     })
//       .save()
//       .then((result) => {
//         // console.log("inside then1", result);
//         ticketSendToEmail(result.userId, result.orderId, result.email);

//         User.aggregate([
//           {
//             $match: {
//               _id: result.userId,
//               bookingStatus: true,
//               deviceToken: { $exists: true },
//             },
//           },
//           {
//             $project: {
//               deviceToken: 1,
//             },
//           },
//         ])
//           .then(async (data) => {
//             // console.log("data", data);

//             if (data.length > 0) {
//               var options = {
//                 method: "POST",
//                 url: "https://fcm.googleapis.com/fcm/send",
//                 headers: {
//                   "content-type": "application/json",
//                   Authorization: SecretKey,
//                 },
//                 body: JSON.stringify({
//                   registration_ids: [data[0].deviceToken],
//                   priority: "high",
//                   data: {},
//                   notification: {
//                     title: "Booking done successfully",
//                     body: `Your payment is done successfully`,
//                     vibrate: 1,
//                     sound: 1,
//                     show_in_foreground: true,
//                     priority: "high",
//                     content_available: true,
//                   },
//                 }),
//               };
//               request(options, function (error, response) {
//                 if (error) throw new Error(error);
//                 // console.log(response.body);
//               });
//             }

//             if (req.body.giftCouponCode) {
//               GiftCard.findOneAndUpdate(
//                 {
//                   giftCode: req.body.giftCouponCode,
//                 },
//                 {
//                   $set: {
//                     isRedeemed: true,
//                   },
//                   updatedOn: new Date(),
//                 }
//               ).exec();

//               return res.status(ResponseCode.errorCode.success).json({
//                 status: true,
//                 message: "Booking done successfully",
//                 orderId: orderId,
//               });
//             } else {
//               return res.status(ResponseCode.errorCode.success).json({
//                 status: true,
//                 message: "Booking done successfully",
//                 orderId: orderId,
//               });
//             }
//           })
//           .catch((error) => {
//             console.log(error);

//             return res.status(500).json({
//               status: false,
//               message: "server error",
//             });
//           });
//       })
//       .catch((error) => {
//         console.log(error);
//         return res.status(500).json({
//           status: false,
//           message: "sever error.try again",
//         });
//       });
//   } catch (error) {
//     console.log("===errrr======", error);
//     return res.status(ResponseCode.errorCode.serverError).json({
//       status: false,
//       message: "Server error, please try again",
//       error: error,
//     });
//   }
// };




const sendEmail = (options) => {
  transporter.sendMail(options, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log(`Email has been sent: ${info.response}`);
    }
  });
};

const addBooking = async (req, res) => {
  var orderId = new mongoose.Types.ObjectId();
  // var num = Math.floor(Math.random() * (9999 - 100)) + 100;
  var alpfaNueID = "";
  var bkid = await BookingDetails.findOne(
    {},
    { alpfaNueID: 1 },
    { sort: { createdOn: -1 } }
  ).exec();
  var inputString = "THD100001";
  if (bkid == null || bkid == "") {
    alpfaNueID = inputString;
  } else {
    const substring = Number(bkid.alpfaNueID.slice(3)) + 1;
    alpfaNueID = "THD" + substring;
  }
  try {
    const discountedPrice = req.body.discountedPrice || req.body.actualPrice;
    req.body.items.forEach(async (ele) => {
   
      if (ele.cart === "activity") {
        var getOrderId = await new userBooking({
          activityDetailsId: ele.activityDetailsId,
          bookingDate: ele.bookingDate,
          bookingTime: ele.bookingTime,
          bookingType: "activity",
          bookingStatus: "confirmed",
          alpfaNueID: alpfaNueID,
          totalTourPerson: ele.totalTourPerson,
          participentType: ele.participentType,
          orderId: orderId,
          // amount: discountedPrice,
          amount: ele.amount,
          userId: req.user._id,
          createdOn: new Date(),
        }).save();
        if (getOrderId.paymentMode === "online") {
          // notification function start
          const userId = getOrderId.userId;
   
          const userData = await User.findOne({ _id: userId });
          const userDeviceToken = userData?.deviceToken;
    

          if (userDeviceToken !== null && userDeviceToken !== "" && userDeviceToken !== undefined) {

            const bookedOptions = {
              method: "POST",
              url: "https://fcm.googleapis.com/fcm/send",
              headers: {
                "content-type": "application/json",
                Authorization: SecretKey,
              },
              body: JSON.stringify({
                registration_ids: [userDeviceToken],
                priority: "high",
                data: {},
                notification: {
                  title: "Booked successfully",
                  body: `Your Booked is done successfully.`,
                  vibrate: 1,
                  sound: 1,
                  show_in_foreground: true,
                  priority: "high",
                  content_available: true,
                },
              }),
            };
            request(bookedOptions, function (error, response) {
              if (error) {
                console.error("Error sending FCM notification:", error);
              } else {
                console.log("FCM notification sent successfully:", response.body);
              }
            });
          }

          const paymentOptions = {
            method: "POST",
            url: "https://fcm.googleapis.com/fcm/send",
            headers: {
              "content-type": "application/json",
              Authorization: SecretKey,
            },
            body: JSON.stringify({
              registration_ids: [userDeviceToken],
              priority: "high",
              data: {},
              notification: {
                title: "Payment successfully",
                body: `Your payment is done successfully.`,
                vibrate: 1,
                sound: 1,
                show_in_foreground: true,
                priority: "high",
                content_available: true,
              },
            }),
          };

          // Send FCM notification
          request(paymentOptions, function (error, response) {
            if (error) {
              console.error("Error sending FCM notification:", error);
            } else {
              console.log("FCM notification sent successfully:", response.body);
            }
          });
          // notification function END
        }

        Cart.deleteOne({ _id: new mongoose.Types.ObjectId(ele.cartid) }).exec();
        CartTimeCheck.deleteOne({
          cartId: new mongoose.Types.ObjectId(ele.cartid),
        }).exec();

        // var DiscountedPrice: req.body.discountedPrice || req.body.actualPrice,

        if (req.body.discountedPrice) {
          var DiscountedPrice = req.body.discountedPrice;
        } else {
          var DiscountedPrice = req.body.actualPrice;
        }

        var userType = await activity
          .findOne({
            _id: new mongoose.Types.ObjectId(ele.activityDetailsId),
            addedBy: "merchant",
          })
          .exec();

        // console.log("getOrderId", getOrderId.orderId)

        if (userType) {
          var commisionData = await Merchant.findOne({
            _id: new mongoose.Types.ObjectId(userType.addedByid),
          }).exec();

          // console.log("commisionData", commisionData.commisionPercentage)
          var percentage = commisionData.commisionPercentage;

          var adminAmount = ((DiscountedPrice * percentage) / 100).toFixed(2);
          var merchnatAmount = (DiscountedPrice - adminAmount).toFixed(2);
          var activityActualPrice1 = DiscountedPrice;

          var merchantComData = {
            marchentID: userType.addedByid,
            percentage: percentage,
            activityID: ele.activityDetailsId,
            bookingDate: ele.bookingDate,
            adminAmount: adminAmount,
            activityPrice: activityActualPrice1,
            marchentCommissionAmount: merchnatAmount,
            activityAmount: DiscountedPrice,
            bookingDate: ele.bookingDate,
            bookingDateFormate: new Date(ele.bookingDate),
            orderID: getOrderId.orderId,
          };
          new MerchantCommission(merchantComData).save();
        }

        if (ele.folderId !== undefined || ele.folderId !== "") {
          // console.log("enter");
          Wishlist.findOneAndUpdate(
            {
              userId: req.user._id,
              folderId: new mongoose.Types.ObjectId(ele.folderId),
              activityId: new mongoose.Types.ObjectId(ele.activityDetailsId),
            },
            {
              $set: {
                pastWishlist: true,
              },
            }
          ).exec();
        }
      } else {
        new userBooking({
          activityDetailsId: ele.activityId || null,
          amount: ele.amount,
          giftCode: ele.giftCode,
          bookingType: "giftcard",
          sendToEmail: "pending",
          bookingStatus: "confirmed",
          personalMsg: ele.personalMsg || "",
          expirationDate: ele.expirationDate,
          bookingDate: ele.bookingDate,
          alpfaNueID: alpfaNueID,
          bookingTime: ele.bookingTime,
          orderId: orderId,
          userId: req.user._id,
          createdOn: new Date(),
        }).save()
          .then(async (data1) => {
        
            if (data1.paymentMode === "online") {
              // notification function start
              const userId = data1.userId;
      
              const userData = await User.findOne({ _id: userId });
              const userDeviceToken = userData?.deviceToken;
        

              if (userDeviceToken !== null && userDeviceToken !== "" && userDeviceToken !== undefined) {

                const bookedOptions = {
                  method: "POST",
                  url: "https://fcm.googleapis.com/fcm/send",
                  headers: {
                    "content-type": "application/json",
                    Authorization: SecretKey,
                  },
                  body: JSON.stringify({
                    registration_ids: [userDeviceToken],
                    priority: "high",
                    data: {},
                    notification: {
                      title: "Booked successfully",
                      body: `Your Booked is done successfully.`,
                      vibrate: 1,
                      sound: 1,
                      show_in_foreground: true,
                      priority: "high",
                      content_available: true,
                    },
                  }),
                };
                request(bookedOptions, function (error, response) {
                  if (error) {
                    console.error("Error sending FCM notification:", error);
                  } else {
                    console.log("FCM notification sent successfully:", response.body);
                  }
                });
              }

              const paymentOptions = {
                method: "POST",
                url: "https://fcm.googleapis.com/fcm/send",
                headers: {
                  "content-type": "application/json",
                  Authorization: SecretKey,
                },
                body: JSON.stringify({
                  registration_ids: [userDeviceToken],
                  priority: "high",
                  data: {},
                  notification: {
                    title: "Payment successfully",
                    body: `Your payment is done successfully.`,
                    vibrate: 1,
                    sound: 1,
                    show_in_foreground: true,
                    priority: "high",
                    content_available: true,
                  },
                }),
              };

              // Send FCM notification
              request(paymentOptions, function (error, response) {
                if (error) {
                  console.error("Error sending FCM notification:", error);
                } else {
                  console.log("FCM notification sent successfully:", response.body);
                }
              });

              // notification function END
            }
          })
          .catch((err) => {
            console.log("error", err);
          });


        new CardHistory({
          senderId: req.user._id,
          activityId: ele.activityId || null,
          giftCode: ele.giftCode,
          giftApplyLink: ele.giftApplyLink,
          personalMsg: ele.personalMsg || "",
          expirationDate: ele.expirationDate,
          bookingTime: ele.bookingTime,
          amount: ele.amount,
          createdOn: new Date(),
        }).save();

        GiftCard.deleteOne({
          _id: new mongoose.Types.ObjectId(ele.cartid),
        }).exec();
      }
    });

    var slotFind = await availabilityData
      .aggregate([
        {
          $match: {
            activityDetailsId: new mongoose.Types.ObjectId(
              req.body.items[0].activityDetailsId
            ),
            tourDate: req.body.items[0].bookingDate,
            time: req.body.items[0].bookingTime,
          },
        },
        {
          $project: {
            __v: 0,
          },
        },
      ])
      .exec();

    if (slotFind.length > 0) {
      var actualSlot = slotFind[0].remeningUser;

      var tourPerson = req.body.items[0].totalTourPerson/2 ;

      var newSlot = actualSlot - tourPerson;
      var newObj = {
        remeningUser: newSlot
      } 
      // console.log("newObj",newObj)
      // console.log("newSlot",newSlot)
      // console.log("actualSlot",actualSlot)
      // console.log("slotFind",slotFind)
      await availabilityData
        .findOneAndUpdate(
          {
            activityDetailsId: new mongoose.Types.ObjectId(
              req.body.items[0].activityDetailsId
            ),
            tourDate: req.body.items[0].bookingDate,
            time: req.body.items[0].bookingTime,
          },
          {
            $set: {
              remeningUser: actualSlot,
            }, // Corrected field name to "remainingUser"
          }
        )
        .then((data) => {
          console.log("dataaaa  krishna murari sharma------------- ", data);
        })
        .catch((err) => {
          console.log("error", err);
        });
    }

    new BookingDetails({
      userId: req.user._id,
      orderId: orderId,
      alpfaNueID: alpfaNueID,
      // bookingStatus: "completed",
      bookingDate: req.body.items[0].bookingDate,
      bookingTime: req.body.items[0].bookingTime,
      actualPrice: req.body.actualPrice,
      discountedPrice: req.body.discountedPrice || req.body.actualPrice,
      createdOn: new Date(),
    })
      .save()
      .then(async (result) => {
        console.log("inside then1", result);
        const userId = result.userId;
        console.log("user Id is", userId);
        const userData = await User.findOne({ _id: userId })
        console.log("user data is", userData);
        const userEmail = userData.email;
        console.log("user mail is  line 246", userEmail);
        ticketSendToEmail(result.userId, result.orderId, userEmail);

        User.aggregate([
          {
            $match: {
              _id: result.userId,
              bookingStatus: true,
              deviceToken: { $exists: true },
            },
          },
          {
            $project: {
              deviceToken: 1,
            },
          },
        ])
          .then(async (data) => {
            const mailOption = {
              from: "thingstodoo85@gmail.comz",
              to: req.user.email,
              subject: "Your Booking has confirm",
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
                    <p>Dear ${req.user.firstName} ${req.user.lastName},</p>
                    <p>We are excited to inform you that your booking is confirm.</p>
                    <p>If you have any questions or need assistance, feel free to reach out to us.</p>
                    <p>Thank you and welcome aboard!</p>
                    <p>Best regards,</p>
                    <p>ThingsToDo</p>
                  </div>
                  </body>
                </html>
              `,
            };
            const adminMailOptions = {
              from: "thingstodoo85@gmail.comz",
              to: 'nilam1111nitu@gmail.comz',
              subject: "User Booking Successfully",
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
                      <h1>New User Request</h1>
                      <p>Dear Admin,</p>
                      <p>A new user has booked successfully. Here are the details:</p>
                      <ul>
                        <li><strong>Name:</strong> ${req.user.firstName} ${req.user.lastName}</li>
                        <li><strong>Email:</strong> ${req.user.email}</li>
                      </ul>
                      <p>Please review and take necessary actions.</p>
                      <p>If you have any questions or need assistance, feel free to reach out to us.</p>
                      <p>Thank you!</p>
                      <p>Best regards,</p>
                      <p>ThingsToDo</p>
                    </div>
                  </body>
                </html>
              `,
            };
    
            if (data.length > 0) {
              var options = {
                method: "POST",
                url: "https://fcm.googleapis.com/fcm/send",
                headers: {
                  "content-type": "application/json",
                  Authorization: SecretKey,
                },
                body: JSON.stringify({
                  registration_ids: [data[0].deviceToken],
                  priority: "high",
                  data: {},
                  notification: {
                    title: "Booking done successfully",
                    body: `Your payment is done successfully`,
                    vibrate: 1,
                    sound: 1,
                    show_in_foreground: true,
                    priority: "high",
                    content_available: true,
                  },
                }),
              };
              request(options, function (error, response) {
                if (error) throw new Error(error);
                // console.log(response.body);
              });
            }
            if (req.body.giftCouponCode) {
              GiftCard.findOneAndUpdate(
                {
                  giftCode: req.body.giftCouponCode,
                },
                {
                  $set: {
                    isRedeemed: true,
                  },
                  updatedOn: new Date(),
                }
              ).exec();

              sendEmail(mailOption);
              sendEmail(adminMailOptions);

              return res.status(ResponseCode.errorCode.success).json({
                status: true,
                message: "Booking done successfully",
                orderId: orderId,
              });
            } else {
              sendEmail(mailOption);
              sendEmail(adminMailOptions);
              return res.status(ResponseCode.errorCode.success).json({
                status: true,
                message: "Booking done successfully",
                orderId: orderId,
              });
            }
          })
          .catch((error) => {
            console.log(error);
            return res.status(500).json({
              status: false,
              message: "server error",
            });
          });
      })
      .catch((error) => {
        console.log(error);
        return res.status(500).json({
          status: false,
          message: "sever error.try again",
        });
      });
  } catch (error) {
    console.log("===errrr======", error);
    return res.status(ResponseCode.errorCode.serverError).json({
      status: false,
      message: "Server error, please try again",
      error: error,
    });
  }
};

const beforeBookingCheck = async (req, res) => {
  const arr = [];
  const promises = [];

  req.body.items.forEach((ele) => {
    promises.push(
      CartTimeCheck.findOne({
        userId: req.user._id,
        activityId: ele.activityDetailsId,
        bookDateFor: ele.bookingDate,
        bookTimeFor: ele.bookingTime,
      }).then(async (result) => {
        // console.log("result", result)
        if (result != null || result != "") {
          // console.log("bbb")
          const formattedDate = convertDate(new Date());
          if (formattedDate == result?.currentDate) {
            // console.log("aaa")

            const currentTime = new Date();
            if (currentTime.toLocaleTimeString() > result.timeAfter10Minutes) {
              // console.log("ccc")
              await Cart.findOneAndUpdate(
                { _id: ele._id },
                {
                  $set: {
                    currentStatus: "unavailable",
                  },
                },
                { new: true }
              ).exec();
              arr.push(ele);
            } else {
              // console.log("avail");
              await Cart.findOneAndUpdate(
                { _id: ele._id },
                {
                  $set: {
                    currentStatus: "available",
                  },
                },
                { new: true }
              ).exec();
            }
          } else {
            // console.log("unava");
            await Cart.findOneAndUpdate(
              { _id: ele._id },
              {
                $set: {
                  currentStatus: "unavailable",
                },
              },
              { new: true }
            ).exec();
            arr.push(ele);
          }
        } else {
          // console.log("unava");
          await Cart.findOneAndUpdate(
            { _id: ele._id },
            {
              $set: {
                currentStatus: "unavailable",
              },
            },
            { new: true }
          ).exec();
          arr.push(ele);
        }
      })
    );
  });

  Promise.all(promises)
    .then(() => {
      return res.status(ResponseCode.errorCode.success).json({
        status: false,
        message: "Activities are not available..Delete from cart and continue",
        data: arr,
      });
    })
    .catch((error) => {
      console.log("error", error);
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error,Please try again",
        error: error,
      });
    });
};

const deleteBooking000 = async (req, res) => {
  var check = await userBooking
    .aggregate([
      {
        $match: {
          isDeleted: false,
          _id: new mongoose.Types.ObjectId(req.params.id),
        },
      },
    ])
    .then(async (data2) => {
      var bookingDate = data2[0].bookingDate;
      var bookingTime = data2[0].bookingTime;

      var dateTimeString = `${bookingDate} ${bookingTime}`;

      var dateTime = new Date(dateTimeString);

      var isoString = dateTime.toISOString();

      var todayDate = new Date();

      var timestamp1 = new Date(todayDate);
      var timestamp2 = new Date(isoString);

      var timeDifferenceMs = Math.abs(timestamp1 - timestamp2);

      var hoursDifference = timeDifferenceMs / (1000 * 60 * 60);

      var activityDetails = await activity
        .findOne({
          _id: new mongoose.Types.ObjectId(data2[0].activityDetailsId),
        })
        .exec();
      var marchandDetails = await Merchant.findOne({
        _id: new mongoose.Types.ObjectId(activityDetails.addedByid),
      });
      // console.log("marchand", marchandDetails)
      var marchand = marchandDetails.firstName + " " + marchandDetails.lastName;

      if (hoursDifference > 24) {
        await userBooking
          .findOneAndUpdate(
            { _id: req.params.id },
            {
              $set: {
                bookingStatus: "cancelled",
              },
            }
          )
          .then(async (data) => {
            console.log("krishna data =====>>>",{ data });

            var availabilities = await availabilityData
              .findOne({
                activityDetailsId: data.activityDetailsId,
                tourDate: data.bookingDate,
                time: data.bookingTime,
              })
              .exec();

            console.log("krishna ======= availabilities",availabilities);

            if (availabilities != null) {
              var totalRemaining =
               ( availabilities.remeningUser + data.totalTourPerson)*.5;
              await availabilityData.findOneAndUpdate(
                {
                  activityDetailsId: data.activityDetailsId,
                  tourDate: data.bookingDate,
                  time: data.bookingTime,
                },
                {
                  $set: {
                    remeningUser: totalRemaining,
                  },
                },
                { new: true }
              ); 
 
            }
            return res.status(ResponseCode.errorCode.success).json({
              status: true,
              message: "Booking cancelled successfully",
            });
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
      } else {
        return res.status(ResponseCode.errorCode.success).json({
          status: false,
          message: `This tour is under 24 hour cancellation window. Please contact ${marchand} merchant tours directly!`,
        });
      }
    })
    .catch((error) => {
      console.log(error);
      res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error, Please try again later",
        error: error,
      });
    });
};

const deleteBooking = async (req, res) => {
  var check = await userBooking
    .aggregate([
      {
        $match: {
          isDeleted: false,
          _id: new mongoose.Types.ObjectId(req.params.id),
        },
      },
    ])
    .then(async (data2) => {
      var bookingDate = data2[0].bookingDate;
      var bookingTime = data2[0].bookingTime;

      var dateTimeString = `${bookingDate} ${bookingTime}`;

      var dateTime = new Date(dateTimeString);

      var isoString = dateTime.toISOString();

      var todayDate = new Date();

      var timestamp1 = new Date(todayDate);
      var timestamp2 = new Date(isoString);

      var timeDifferenceMs = Math.abs(timestamp1 - timestamp2);

      var hoursDifference = timeDifferenceMs / (1000 * 60 * 60);

      var activityDetails = await activity
        .findOne({
          _id: new mongoose.Types.ObjectId(data2[0].activityDetailsId),
        })
        .exec();
      var marchandDetails = await Merchant.findOne({
        _id: new mongoose.Types.ObjectId(activityDetails.addedByid),
      });
      console.log("marchand", marchandDetails)
      // var marchand = marchandDetails.firstName + " " + marchandDetails.lastName;
      var marchand = marchandDetails.companyName 


      if (hoursDifference > 24) {
        await userBooking
          .findOneAndUpdate(
            { _id: req.params.id },
            {
              $set: {
                bookingStatus: "cancelled",
              },
            }
          )
          .then(async (data) => {
            console.log("after cancelledddddddddddddddddddddddd==", data);

            const mailOption = {
              from: "thingstodoo85@gmail.comz",
              to: req.user.email,
              subject: "Your Booking has cancelled succesfull",
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
                    <p>Dear ${req.user.firstName} ${req.user.lastName},</p>
                    <p>We are inform you that your booking has cancelled.</p>
                    <p>If you have any questions or need assistance, feel free to reach out to us.</p>
                    <p>Thank you and welcome aboard!</p>
                    <p>Best regards,</p>
                    <p>ThingsToDo</p>
                  </div>
                  </body>
                </html>
              `,
            };

            const adminMailOptions = {
              from: "thingstodoo85@gmail.comz",
              to: 'nilam1111nitu@gmail.comz',
              subject: "User Booking Cancel Successfully",
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
                      <h1>User Booking Cancel successfully</h1>
                      <p>Dear Admin,</p>
                      <p>A user has cancel booking. Here are the details:</p>
                      <ul>
                        <li><strong>Name:</strong> ${req.user.firstName} ${req.user.lastName}</li>
                        <li><strong>Email:</strong> ${req.user.email}</li>
                      </ul>
                      <p>Please review and take necessary actions.</p>
                      <p>If you have any questions or need assistance, feel free to reach out to us.</p>
                      <p>Thank you!</p>
                      <p>Best regards,</p>
                      <p>ThingsToDo</p>
                    </div>
                  </body>
                </html>
              `,
            };


            var availabilities = await availabilityData
              .findOne({
                activityDetailsId: data.activityDetailsId,
                tourDate: data.bookingDate,
                time: data.bookingTime,
              })
              .exec();

            console.log(availabilities);

            if (availabilities != null) {
              var totalRemaining =
                availabilities.remeningUser + data.totalTourPerson;
              // console.log({totalRemaining})

              await availabilityData.findOneAndUpdate(
                {
                  activityDetailsId: data.activityDetailsId,
                  tourDate: data.bookingDate,
                  time: data.bookingTime,
                },
                {
                  $set: {
                    remeningUser: totalRemaining,
                  },
                },
                { new: true }
              );
            }
            sendEmail(mailOption);
            sendEmail(adminMailOptions);

            // notification function start
            const userId = data.userId;
            console.log("user id id is====", userId);
            const userData = await User.findOne({ _id: userId });
            const userDeviceToken = userData.deviceToken;
            console.log("token===", userDeviceToken, "device token is");

            if (userDeviceToken !== null && userDeviceToken !== "" && userDeviceToken !== undefined) {
              const options = {
                method: "POST",
                url: "https://fcm.googleapis.com/fcm/send",
                headers: {
                  "content-type": "application/json",
                  Authorization: SecretKey,
                },
                body: JSON.stringify({
                  registration_ids: [userDeviceToken],
                  priority: "high",
                  data: {},
                  notification: {
                    title: "Booking cancelled",
                    body: `We are informing you that your booking has been cancelled.`,
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
            }

            // notification function END


            return res.status(ResponseCode.errorCode.success).json({
              status: true,
              message: "Booking cancelled successfully",
            });
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
      } else {
        return res.status(ResponseCode.errorCode.success).json({
          status: false,
          message: `This tour is under 24 hour cancellation window. Please contact ${marchand} merchant tours directly!`,
        });
      }
    })
    .catch((error) => {
      console.log(error);
      res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error, Please try again later",
        error: error,
      });
    });
};

const viewAllBookingHistory = async (req, res) => {
  BookingDetails.aggregate([
    {
      $match: {
        userId: req.user._id,
      },
    },
    {
      $lookup: {
        from: "userbookings",
        localField: "orderId",
        foreignField: "orderId",
        pipeline: [
          {
            $lookup: {
              from: "activitydetails",
              localField: "activityDetailsId",
              foreignField: "_id",
              pipeline: [
                {
                  $project: {
                    activityTitle: 1,
                    image: 1,
                  },
                },
              ],
              as: "activityDetails",
            },
          },
          {
            $unwind: {
              path: "$activityDetails",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $addFields: {
              activityName: "$activityDetails.activityTitle",
              activityImage: { $arrayElemAt: ["$activityDetails.image", 0] },
            },
          },
          {
            $project: {
              __v: 0,
              isDeleted: 0,
              createdOn: 0,
              updatedOn: 0,
              bookingDate: 0,
              bookingTime: 0,
              activityDetails: 0,
            },
          },
        ],
        as: "list",
      },
    },
    {
      $project: {
        bookingDate: 1,
        bookingTime: 1,
        actualPrice: 1,
        discountedPrice: 1,
        list: 1,
      },
    },
  ])
    .then((data) => {
      res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "view all booking history",
        data: data,
      });
    })
    .catch((error) => {
      const errors = DBerror(error);
      res.status(ResponseCode.errorCode.success).json({
        status: false,
        message: "Server error, Please try again later",
        error: errors,
      });
    });
};

const viewPurchasedGiftCard = async (req, res) => {
  await userBooking
    .aggregate([
      {
        $match: {
          userId: req.user._id,
          orderId: new mongoose.Types.ObjectId(req.params.orderId),
          bookingType: "giftcard",
        },
      },
      {
        $lookup: {
          from: "activitydetails",
          localField: "activityDetailsId",
          foreignField: "_id",
          as: "activityDetails",
        },
      },
      {
        $addFields: {
          activityName: { $arrayElemAt: ["$activityDetails.activityTitle", 0] },
        },
      },
      {
        $lookup: {
          from: "cardhistories",
          localField: "giftCode",
          foreignField: "giftCode",
          as: "cardHistory",
          pipeline:[
            {
              $match:{
                isDeleted:false
              }
            },
          ]
        },
      },
      {
        $unwind:"$cardHistory"
      },
      {
        $addFields:{
          cardHistoryID:"$cardHistory._id"
        }
      },
      {
        $project: {
          __v: 0,
          isDeleted: 0,
          updatedOn: 0,
          participentType: 0,
          userId: 0,
          activityDetails: 0,
          activityDetailsId: 0,
          cardHistory:0
        },
      },
    ])
    .then((data) => {
      res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Get all the data",
        data: data,
      });
    })
    .catch((error) => {
      res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error, Please try again later",
        error: error,
      });
    });
};

const viewAllUpcomingBooking = async (req, res) => {
  const date = new Date();

  // console.log(req.user._id);
  const formattedDate = moment(date).format("YYYY-MM-DD");

  console.log("formattedDate", formattedDate);

  let booking1 = userBooking.aggregate([
    {
      $match: {
        isDeleted: false,
        userId: req.user._id,
        bookingType: "activity",
        bookingDate: { $gte: formattedDate },
      },
    },

    {
      $lookup: {
        from: "activitydetails",
        localField: "activityDetailsId",
        foreignField: "_id",
        pipeline: [
          {
            $lookup: {
              from: "languages",
              localField: "languageId",
              foreignField: "_id",
              as: "language",
            },
          },
          {
            $unwind: { path: "$language", preserveNullAndEmptyArrays: true },
          },
          {
            $project: {
              activityTitle: 1,
              image: 1,
              currency: 1,
              tourDuration: 1,
              activityActualPrice: 1,
              participentType: 1,
              language: 1,
            },
          },
        ],
        as: "activityDetails",
      },
    },
    {
      $unwind: {
        path: "$activityDetails",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $addFields: {
        activityName: "$activityDetails.activityTitle",
        activityImage: { $arrayElemAt: ["$activityDetails.image", 0] },
        tourDuration: "$activityDetails.tourDuration",
        activityActualPrice: "$activityDetails.activityActualPrice",
        // participentType: "$activityDetails.participentType",
        language: "$activityDetails.language.name",
        currency: "$activityDetails.currency",
      },
    },
    {
      $project: {
        __v: 0,
        isDeleted: 0,
        createdOn: 0,
        updatedOn: 0,
        activityDetails: 0,
      },
    },
  ])
    .then((data) => {
      // console.log("data", data);
      res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "view all upcoming booking history",
        data: data,
      });
    })
    .catch((error) => {
      const errors = DBerror(error);
      res.status(ResponseCode.errorCode.success).json({
        status: false,
        message: "Server error, Please try again later",
        error: errors,
      });
    });
};

const viewAllpreviousBooking0000 = async (req, res) => {
  const date = new Date();
  const formattedDate = moment(date).format("YYYY-MM-DD");
  userBooking
    .aggregate([
      {
        $match: {
          userId: req.user._id,
          bookingType: "activity",
          bookingDate: { $lt: formattedDate },
        },
      },

      {
        $lookup: {
          from: "activitydetails",
          localField: "activityDetailsId",
          foreignField: "_id",
          pipeline: [
            {
              $lookup: {
                from: "languages",
                localField: "languageId",
                foreignField: "_id",
                as: "language",
              },
            },
            {
              $unwind: { path: "$language", preserveNullAndEmptyArrays: true },
            },

            {
              $lookup: {
                from: "reviewratings",
                localField: "_id",
                foreignField: "activityDetailsId",
                as: "review",
              },
            },
            {
              $addFields: {
                rating: { $avg: "$review.avgRating" },
              },
            },

            {
              $project: {
                activityTitle: 1,
                image: 1,
                tourDuration: 1,
                currency: 1,
                activityActualPrice: 1,
                participentType: 1,
                language: "$language.name",
                rating: 1,
              },
            },
          ],
          as: "activityDetails",
        },
      },
      {
        $unwind: {
          path: "$activityDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          activityName: "$activityDetails.activityTitle",
          activityImage: { $arrayElemAt: ["$activityDetails.image", 0] },
          tourDuration: "$activityDetails.tourDuration",
          activityActualPrice: "$activityDetails.activityActualPrice",
          // participentType: "$activityDetails.participentType",
          language: "$activityDetails.language",
          currency: "$activityDetails.currency",
          reviewrating: "$activityDetails.rating",
        },
      },
      {
        $project: {
          __v: 0,
          isDeleted: 0,
          createdOn: 0,
          updatedOn: 0,
          activityDetails: 0,
        },
      },
    ])
    .then((data) => {
      res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "view all previous booking history",
        data: data,
      });
    })
    .catch((error) => {
      const errors = DBerror(error);
      res.status(ResponseCode.errorCode.success).json({
        status: false,
        message: "Server error, Please try again later",
        error: errors,
      });
    });
};




const viewAllpreviousBooking = async (req, res) => {
  const date = new Date();
  const formattedDate = moment(date).format("YYYY-MM-DD");

  console.log("formattedDate",formattedDate)

  userBooking
    .aggregate([
      {
        $match: {
          userId: req.user._id,
          bookingType: "activity",
          bookingDate: { $lt: formattedDate },
        },
      },
      {
        $lookup: {
          from: "activitydetails",
          localField: "activityDetailsId",
          foreignField: "_id",
          pipeline: [
            {
              $lookup: {
                from: "languages",
                localField: "languageId",
                foreignField: "_id",
                as: "language",
              },
            },
            {
              $unwind: { path: "$language", preserveNullAndEmptyArrays: true },
            },
            {
              $lookup: {
                from: "reviewratings",
                localField: "_id",
                foreignField: "activityDetailsId",
                as: "review",
              },
            },
            {
              $addFields: {
                rating: { $avg: "$review.avgRating" },
              },
            },
            {
              $project: {
                activityTitle: 1,
                image: 1,
                tourDuration: 1,
                currency: 1,
                activityActualPrice: 1,
                participentType: 1,
                language: "$language.name",
                rating: 1,
              },
            },
          ],
          as: "activityDetails",
        },
      },
      {
        $unwind: {
          path: "$activityDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          activityName: "$activityDetails.activityTitle",
          activityImage: { $arrayElemAt: ["$activityDetails.image", 0] },
          tourDuration: "$activityDetails.tourDuration",
          activityActualPrice: "$activityDetails.activityActualPrice",
          language: "$activityDetails.language",
          currency: "$activityDetails.currency",
          reviewrating: "$activityDetails.rating",

          // Add a new field for booking status
          bookingStatus: {
            $cond: {
              if: { $lt: ["$bookingDate", formattedDate] },
              then: "completed",
              else: "pending", // You can set this to another status if needed
            },
          },
        },
      },
      {
        $project: {
          __v: 0,
          isDeleted: 0,
          createdOn: 0,
          updatedOn: 0,
          activityDetails: 0,
        },
      },
    ])
    .then((data) => {
      res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "View all previous booking history",
        data: data,
      });
    })
    .catch((error) => {
      const errors = DBerror(error);
      res.status(ResponseCode.errorCode.success).json({
        status: false,
        message: "Server error, Please try again later",
        error: errors,
      });
    });
};


const ticketSendToEmail = async (userId, orderId, email) => {
  console.log("inside mail ticket", userId, orderId);

  BookingDetails.aggregate([
    {
      $match: {
        userId: userId,
        orderId: orderId,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "userdetails",
      },
    },
    {
      $lookup: {
        from: "userbookings",
        localField: "orderId",
        foreignField: "orderId",
        pipeline: [
          {
            $match: {
              bookingType: "activity",
              bookingStatus: "completed",
            },
          },
          {
            $lookup: {
              from: "activitydetails",
              localField: "activityDetailsId",
              foreignField: "_id",
              pipeline: [
                {
                  $lookup: {
                    from: "cities",
                    localField: "cityId",
                    foreignField: "_id",
                    as: "city",
                  },
                },
                {
                  $unwind: {
                    path: "$city",
                    preserveNullAndEmptyArrays: true,
                  },
                },

                {
                  $lookup: {
                    from: "categories",
                    localField: "categoryId",
                    foreignField: "_id",
                    as: "category",
                  },
                },
                {
                  $unwind: {
                    path: "$category",
                    preserveNullAndEmptyArrays: true,
                  },
                },

                {
                  $project: {
                    activityTitle: 1,
                    // image: 1,
                    meetingPoint: 1,
                    tourDuration: 1,
                    // participentType: 1,
                    cityName: "$city.cityName",
                    categotyName: "$category.categoryName",
                  },
                },
              ],
              as: "activityDetails",
            },
          },
          {
            $unwind: {
              path: "$activityDetails",
              preserveNullAndEmptyArrays: true,
            },
          },

          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "userDetails",
            },
          },

          {
            $unwind: {
              path: "$userDetails",
              preserveNullAndEmptyArrays: true,
            },
          },

          {
            $project: {
              orderId: 1,
              bookingDate: 1,
              bookingTime: 1,
              participentType: 1,
              totalTourPerson: 1,
              activityDetails: 1,
              userFirstName: "$userDetails.firstName",
              userLastName: "$userDetails.lastName",
            },
          },
        ],
        as: "list",
      },
    },
    {
      $project: {
        _id: 0,
        list: 1,
        userdetails: 1,
      },
    },
  ])
    .then(async (data) => {
      console.log("data", data);

      var result = "";

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

      const inputDateString = data[0]?.list[0]?.bookingDate;
      const formattedDate = formatDate(inputDateString);
      console.log(formattedDate);

      var total = [];
      var sum = 0;
      var timestamp = `${new Date().getDate()}${new Date().getHours()}${new Date().getSeconds()}${new Date().getMilliseconds()}`;

      let options = {
        format: "A4",
        landscape: true,
      };
      console.log("data list===", data[0].list);
      data[0].list.forEach((ele) => {
        console.log("vggy", ele);

        result += `<!DOCTYPE html>
        <html lang="en">
        
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title></title>
        </head>
        
        <body>
            <section style="width: 100%; height: auto; padding: 10px 0;">
                <div style="max-width: 1100px; margin: 0 auto; background-color: #fff;">
                    <div style="width: 100%; padding: 10px;">
                        <table>
                            <tr colspan="2">
                                <td style="display: block;">
                                            <a href="https://imgbb.com/"><img src="https://i.ibb.co/KjqRKWR/things-to-doo-logo.png" alt="things-to-doo-logo" style="max-width: 80px;width: 100%; height: 100%;"></a>
                                </td>
                                <td style="width: 500px; padding-left: 10px;">
                                    <span>
                                        <p style="font-weight: 800; font-size: 15px; line-height: 0px;">${ele.orderId}</p>
                                        <P style="font-weight: 800; font-size: 15px; line-height: 10px;">${ele.activityDetails.cityName}:${ele.activityDetails.categotyName}</P>
                                        <p style="font-size: 15px;color: rgb(58, 59, 59);line-height: 20px; font-weight: 600;">
                                            Option (Stander Option)</p>
                                        <p style="font-size: 15px; color:  rgb(58, 59, 59);  line-height: 0px;">${ele.activityDetails.cityName}:${ele.activityDetails.categotyName}
                                            
                                        </p>
                                        <div style="padding-top: 10px;">
                                            <a href="https://ibb.co/BnqCTw5"><img src="https://i.ibb.co/SfR3VJ4/calendar-152139-640.png" alt="calendar-152139-640"style="max-width: 20px;width: 100%; height: 100%;"></a>
                                            <span
                                                style="font-size: 14px; color:  rgb(58, 59, 59); line-height: 20px; font-weight: 600;padding-left: 10px;">${formattedDate}  ${ele.bookingTime}
                                                </span>
                                        </div>
                                        <div style="padding-top: 10px;">
                                            <a href="https://imgbb.com/"><img src="https://i.ibb.co/DgGczxR/images.png" alt="images"style="max-width: 20px;width: 100%; height: 100%;" ></a>
                                            <span
                                                style="font-size: 14px; color: rgb(58, 59, 59); line-height: 20px; font-weight: 600;padding-left: 10px;">Duration:
                                                ${ele.activityDetails.tourDuration.value}  ${ele.activityDetails.tourDuration.unit} 
                                                </span>
                                        </div>
                                        <p style="font-weight: 600; font-size: 15px; color: rgb(168, 169, 170);">Booked by</p>
                                        <p style="font-weight: 600; font-size: 15px; color:rgb(58, 59, 59);">${ele.userFirstName} ${ele.userLastName}
                                        </p>
                                    </span>
                                </td>`;

        for (let element of ele.participentType) {
          result += `<td style="width: 400px; padding-left: 30px;">
                                        
  <img src="https://i.ibb.co/PcFX5YF/png-transparent-user-computer-icons-user-miscellaneous-cdr-rectangle-thumbnail.png" alt="png-transparent-user-computer-icons-user-miscellaneous-cdr-rectangle-thumbnail" style="max-width: 20px;width: 100%; height: auto;">
  <span style="font-weight: 600; font-size: 15px; color: #000;padding-left: 10px;">${element.person} ${element.pertype}(${element.age})
      </span>

</td>`;
        }

        //     <td style="width: 400px; padding-left: 30px;">

        //     <img src="https://i.ibb.co/PcFX5YF/png-transparent-user-computer-icons-user-miscellaneous-cdr-rectangle-thumbnail.png" alt="png-transparent-user-computer-icons-user-miscellaneous-cdr-rectangle-thumbnail" style="max-width: 20px;width: 100%; height: auto;">
        //     <span style="font-weight: 600; font-size: 15px; color: #000;padding-left: 10px;">${ele.participentType[1].person} ${ele.participentType[1].pertype}(${ele.participentType[1].age})
        //         </span>

        // </td>

        result += ` </tr>
                        </table>
                    </div>
        
                    <div style="width: 100%; padding-top: 10px;">
                        <table>
                            <tr>
                                <td style="width: 500px;padding-bottom: 10px;">
                                    <span>
                                        <h4 style="font-size: 25px; font-weight: 700; margin-top: 5px;">What to remember ?</h4>
                                        <p style="font-size: 15px;">Lorem ipsum dolor, sit amet consectetur adipisicing elit.
                                            Eveniet doloribus voluptatum
                                            maiores ab maxime pariatur! Adipisci, officia. Voluptatem, harum architecto quis
                                            consequuntur totam impedit..</p>
                                        <p style="font-size: 15px;">Lorem ipsum dolor sit, amet consectetur adipisicing elit.
                                            Iusto
                                            voluptatum nobis assumenda laudantium? Ab, quia repellendus culpa dolorem libero
                                            laborum
                                            quisquam modi reprehenderit exercitationem aliquid sequi sunt sint asperiores eum.
                                        </p>
                                    </span>
                                </td>
                                <td style="width: 700px; padding-left: 10px;">
                                    <span>
                                        <p style="font-size: 20px; font-weight: 700; margin-top: 0px;line-hight:0.5px">Need Help ?</p>
                                        <p style="font-size: 15px;font-weight: 500;">Lorem ipsum dolor sit amet consectetur
                                            adipisicing elit. Suscipit ad aliquam consequuntur repellendus inventore architecto
                                            eos
                                            quaerat quo,</p>
                                        <p style="font-size: 15px;font-weight: 500;line-hight:0px">Local partner: Your company name</p>
                                        <p style="font-size: 14px;font-weight: 500;">Phone: <span
                                                style="font-size: 15px;font-weight: 500;color: blue;">+453179513</span></p>
                                        <p style="font-size: 14px;font-weight: 500;">email: <span
                                                style="font-size: 14px;font-weight: 500;color: blue;">gyuf169bj@465.com ,
                                                gufom124@.com</span></p>
                                        <div>
                                            <p style="font-size: 15px; line-hight:0px; font-weight: 700; margin-top: 0px;">Manage your booking
                                            </p>
                                            <p style="font-size: 15px;font-weight: 500;">Lorem ipsum dolor sit amet, consectetur
                                                adipisicing elit. Assumenda aspernatur soluta fugiat molestiae rem minus vitae
                                                reiciendis iste distinctio neque. Provident, dolore.</p>
                                            <p style="font-size: 15px;font-weight: 500;">Booking reference <span
                                                    style="font-size: 15px;font-weight: 500;color: blue;">GYG0000000</span></p>
                                            <P style="font-size: 15px;font-weight: 500;">PIN: <span
                                                    style="font-size: 14px;font-weight: 500;color: blue;">00000000</span></P>
                                            <p style="font-size: 14px;font-weight: 500;">For general booking questions, call
                                                Think
                                                to Do customer service 24/7 at <span
                                                    style="font-size: 15px;font-weight: 500;color: blue;">+617913681</span></p>
                                            <p style="font-size: 14px;font-weight: 500;">message us using WhatsApp(English
                                                only)on<span style="font-size: 13px;font-weight: 500;color: blue;">
                                                    +46921761</span>
                                            </p>
                                        </div>
                                    </span>
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>
            </section>
        </body>
        
        </html>`;

        result += `<!DOCTYPE html>
        <html lang="en">
        
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Document</title>
        </head>
        <style> html { -webkit-print-color-adjust: exact; } </style>
        <body>
      
            <section style="width: 100%; height: auto; text-align: start; padding: 100px 0;">
                <div
                    style="max-width: 700px; width: 100%; margin: 0 auto; border-radius: 6px;  overflow: hidden;">
        
                    <div style="background-color:orangered; height: auto; padding: 50px 30px;">
                        <h2 style="color: #fff;"> Things To Do</h2>
                        <p style="color: #fff;">${ele.activityDetails.cityName}:${ele.activityDetails.categotyName}</p>
                        <p style="color: #fff; padding: 10px 0;">Standard option</p>
                    </div>
            
        <div style="">
                    <table style="max-width: 100%; width: 100%;padding: 20px 30px;background-color: #e7dada69;">
                        <tr>
                            <td>
                                <p style="color: orangered;">Date</p>
                                <p style="color: blacks; font-weight: 700;">${formattedDate}</p>
                            </td>
                            <td>
                                <p style="color: orangered;">Time</p>
                                <p style="color: black; font-weight: 700;"> ${ele.bookingTime}</p>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="2">
                                <p style="color: orangered;">Order ID</p>
                                <p style="color: black; font-weight: 700;">${ele.orderId}</p>
                            </td>
                        </tr>
                    </table>
        
                    <div style="width: 100%; padding: 20px 30px; background-color: #e7dada69;">
                        <p style="font-size: 24px; color: black;">${ele.userFirstName} ${ele.userLastName}</p>
                        <p style="color: black;">Ticket for ${ele.totalTourPerson} persons</p>
                    </div>
        </div>
                </div>
        
            </section>
        </body>
        
        </html>`;

        result += `<!DOCTYPE html>
        <html lang="en">
        
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title></title>
        </head>
        
        <body>
            <section style="width: 100%; height: auto;padding: 80px 0 20px 0;">
                <div style="max-width: 1000px; margin: 0 auto; background-color: #fff;">
                    <div style=" padding: 20px; background-color: orangered;">
                        <p style="text-align: center; color: #fff; font-size: 30px; font-weight: 600;padding-top:20px">Booking details</p>
                    </div>
                    <div>
                        <h2 style="text-align: center; font-size: 30px; font-weight: 600;padding-top: 20px;">Important
                            Information</h2>
                        <p style="text-align: center; font-size: 20px;padding: 0px 80px; ">Lorem, ipsum dolor sit amet
                            consectetur adipisicing elit. Iure, obcaecati eveniet! Sed eum in eaque excepturi dolor saepe
                            consectetur expedita voluptas aut esse similique, animi ullam dicta, fuga perferendis unde. Lorem
                            ipsum dolor sit amet consectetur adipisicing elit. Voluptatem quae deleniti quis libero similique
                            non autem ipsa dignissimos illo magnam nemo corporis voluptate maxime repellat ipsam saepe, atque
                            quibusdam. Debitis. Lorem ipsum, dolor sit amet consectetur adipisicing elit. Neque iste ex fugit
                            culpa quia blanditiis minima quod beatae quaerat doloremque, libero consequuntur amet nobis
                            molestias. Excepturi, soluta...</p>
        
                            <h2 style="text-align: center; font-size: 30px; font-weight: 600;padding-top: 10px;">Merchant Information</h2>
                            <p style="font-size: 15px;padding: 0px 80px;">Your Company name</p>
                            <p style="font-size: 15px;padding: 0px 80px;color: blue;">+4921764864</p>
                            <p style="font-size: 15px;padding: 0px 80px;color: blue;">cjgyuv@hfujb254-hgfjb25667.vkhi3267-467.com</p>
                            <p style="font-size: 15px;padding: 0px 80px; color: #4d4c4c;padding-bottom: 50px;">Lorem ipsum dolor sit, amet consectetur adipisicing elit. At repudiandae officia itaque asperiores vitae debitis placeat impedit quidem voluptatem! Dolorem suscipit accusantium iusto distinctio porro nulla soluta veritatis, rerum quibusdam.</p>
                    </div>
                </div>
            </section>
        </body>
        
        </html>`;
      });

      let file = result;
      console.log("file is ===", file, 'is file');
      let path = "pdf/" + timestamp + ".pdf"


      // HtmlToPdf.generatePdf(file, path, options).then((pdfBuffer) => {
      // console.log("PDF Buffer:-", pdfBuffer);
      // fs.writeFile("pdf/" + timestamp + ".pdf", pdfBuffer, function (err) {
      //   // console.log("hello")

      //   if (err) return console.log(err);

      const pdfBuffer = await HtmlToPdf(file, options);
      console.log("pdf buffer file===", pdfBuffer);
      const uploadResult = await doPDFUpload(pdfBuffer, timestamp);
      console.log("upload result url", uploadResult.url);
      if (uploadResult.status) {
        const emailTemplet = `<p>Subject:Your Booking Confirmation</p>           
     
        <p>Dear ${data[0].userdetails[0].firstName} ${data[0].userdetails[0].lastName},
  
        Thank you for choosing ThingsToDo for your upcoming travel. We are pleased to confirm your booking. Please find the details of your ticket below:</p>`;

        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
          requireTLS: true,
          auth: {
            user: "thingstodoo85@gmail.comz",
            pass: "fnuf lemg isln emly",
          },
        });
        console.log("emails is ticket", email);
        const mailOption = {
          from: "thingstodoo85@gmail.comz",
          to: email,
          subject: "Booking Ticket",
          html: emailTemplet,
          attachments: [
            {
              // path: "http://34.249.210.102:8025/pdf/" + timestamp + ".pdf",
              path: uploadResult.url,
              // path: "http://127.0.0.1:8025/pdf/" + timestamp + ".pdf"
              // cid: 'uniq-mailtrap.png'
            },
          ],
        };

        transporter.sendMail(mailOption, function (error, info) {
          if (error) {
            console.log(error);
            // res
            //   .status(500)
            //   .json({ status: false, message: "Error sending email" });
          } else {
            console.log("Email has been sent:- ", info.response);
            // res.status(200).json({ status: true, message: "Email sent" });
          }
        });
      } else {
        console.log("Error uploading PDF to AWS S3");
      }


      // return res.status(200).json({
      //   status: true,
      //   data: "http://34.249.210.102:8025/pdf/" + timestamp + ".pdf",
      //   // data: "http://127.0.0.1:8025/pdf/" + timestamp + ".pdf",
      //   message: "Pdf Created Successfully",
      //   // data:data[0].list
      // });
      // });
      // });
      // res.status(ResponseCode.errorCode.success).json({
      //   status: true,
      //   message: "view all booking history",
      //   data: data[0].list,
      // });
    })
    .catch((error) => {
      console.log(error);
      // const errors = DBerror(error);
      // res.status(ResponseCode.errorCode.success).json({
      //   status: false,
      //   message: "Server error, Please try again later",
      //   error: errors,
      // });
    });
};

const viewBookingTicket1 = async (req, res) => {
  console.log(req.user);

  BookingDetails.aggregate([
    {
      $match: {
        userId: req.user._id,
        orderId: new mongoose.Types.ObjectId(req.params.orderid),
      },
    },
    {
      $lookup: {
        from: "userbookings",
        localField: "orderId",
        foreignField: "orderId",
        pipeline: [
          {
            $match: {
              bookingType: "activity",
              bookingStatus: "completed",
              // orderId: new mongoose.Types.ObjectId(req.params.orderid),
              // activityDetailsId: new mongoose.Types.ObjectId(
              //   req.params.activityid
              // ),
            },
          },
          {
            $lookup: {
              from: "activitydetails",
              localField: "activityDetailsId",
              foreignField: "_id",
              pipeline: [
                {
                  $lookup: {
                    from: "cities",
                    localField: "cityId",
                    foreignField: "_id",
                    as: "city",
                  },
                },
                {
                  $unwind: {
                    path: "$city",
                    preserveNullAndEmptyArrays: true,
                  },
                },

                {
                  $lookup: {
                    from: "categories",
                    localField: "categoryId",
                    foreignField: "_id",
                    as: "category",
                  },
                },
                {
                  $unwind: {
                    path: "$category",
                    preserveNullAndEmptyArrays: true,
                  },
                },

                {
                  $project: {
                    activityTitle: 1,
                    // image: 1,
                    meetingPoint: 1,
                    tourDuration: 1,
                    // participentType: 1,
                    cityName: "$city.cityName",
                    categotyName: "$category.categoryName",
                  },
                },
              ],
              as: "activityDetails",
            },
          },
          {
            $unwind: {
              path: "$activityDetails",
              preserveNullAndEmptyArrays: true,
            },
          },

          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "userDetails",
            },
          },

          {
            $unwind: {
              path: "$userDetails",
              preserveNullAndEmptyArrays: true,
            },
          },

          {
            $project: {
              orderId: 1,
              bookingDate: 1,
              bookingTime: 1,
              participentType: 1,
              totalTourPerson: 1,
              activityDetails: 1,
              userFirstName: "$userDetails.firstName",
              userLastName: "$userDetails.lastName",
            },
          },
        ],
        as: "list",
      },
    },
    {
      $project: {
        _id: 0,
        alpfaNueID: 1,
        list: 1,
      },
    },
  ])
    .then((data) => {
      console.log("data", data);
      // res.json({
      //   data: data,
      // });
      // return false;
      var result = "";

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

      const inputDateString = data[0].list[0].bookingDate;
      const formattedDate = formatDate(inputDateString);
      console.log(formattedDate);

      var total = [];
      var sum = 0;
      var timestamp = `${new Date().getDate()}${new Date().getHours()}${new Date().getSeconds()}${new Date().getMilliseconds()}`;

      let options = {
        format: "A4",
        landscape: true,
      };

      data[0]?.list.forEach((ele) => {
        console.log("vggy", ele);

        result += `<!DOCTYPE html>
        <html lang="en">
        
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title></title>
        </head>
        
        <body>
            <section style="width: 100%; height: auto; padding: 10px 0;">
                <div style="max-width: 1100px; margin: 0 auto; background-color: #fff;">
                    <div style="width: 100%; padding: 10px;">
                        <table>
                            <tr colspan="2">
                                <td style="display: block;">
                                            <a href="https://imgbb.com/"><img src="https://i.ibb.co/KjqRKWR/things-to-doo-logo.png" alt="things-to-doo-logo" style="max-width: 80px;width: 100%; height: 100%;"></a>
                                </td>
                                <td style="width: 500px; padding-left: 10px;">
                                    <span>
                                        <p style="font-weight: 800; font-size: 15px; line-height: 0px;">${data[0].alpfaNueID}</p>
                                        <P style="font-weight: 800; font-size: 15px; line-height: 10px;">${ele.activityDetails.cityName}:${ele.activityDetails.categotyName}</P>
                                        <p style="font-size: 15px;color: rgb(58, 59, 59);line-height: 20px; font-weight: 600;">
                                            Option (Stander Option)</p>
                                        <p style="font-size: 15px; color:  rgb(58, 59, 59);  line-height: 0px;">${ele.activityDetails.cityName}:${ele.activityDetails.categotyName}
                                            
                                        </p>
                                        <div style="padding-top: 10px;">
                                            <a href="https://ibb.co/BnqCTw5"><img src="https://i.ibb.co/SfR3VJ4/calendar-152139-640.png" alt="calendar-152139-640"style="max-width: 20px;width: 100%; height: 100%;"></a>
                                            <span
                                                style="font-size: 14px; color:  rgb(58, 59, 59); line-height: 20px; font-weight: 600;padding-left: 10px;">${formattedDate}  ${ele.bookingTime}
                                                </span>
                                        </div>
                                        <div style="padding-top: 10px;">
                                            <a href="https://imgbb.com/"><img src="https://i.ibb.co/DgGczxR/images.png" alt="images"style="max-width: 20px;width: 100%; height: 100%;" ></a>
                                            <span
                                                style="font-size: 14px; color: rgb(58, 59, 59); line-height: 20px; font-weight: 600;padding-left: 10px;">Duration:
                                                ${ele.activityDetails.tourDuration.value}  ${ele.activityDetails.tourDuration.unit} 
                                                </span>
                                        </div>
                                        <p style="font-weight: 600; font-size: 15px; color: rgb(168, 169, 170);">Booked by</p>
                                        <p style="font-weight: 600; font-size: 15px; color:rgb(58, 59, 59);">${ele.userFirstName} ${ele.userLastName}
                                        </p>
                                    </span>
                                </td>`;

        for (let element of ele.participentType) {
          result += `<td style="width: 400px; padding-left: 30px;">
                                        
        <img src="https://i.ibb.co/PcFX5YF/png-transparent-user-computer-icons-user-miscellaneous-cdr-rectangle-thumbnail.png" alt="png-transparent-user-computer-icons-user-miscellaneous-cdr-rectangle-thumbnail" style="max-width: 20px;width: 100%; height: auto;">
        <span style="font-weight: 600; font-size: 15px; color: #000;padding-left: 10px;">${element.person} ${element.pertype}(${element.age})
        </span>

          </td>`;
        }

        //     <td style="width: 400px; padding-left: 30px;">

        //     <img src="https://i.ibb.co/PcFX5YF/png-transparent-user-computer-icons-user-miscellaneous-cdr-rectangle-thumbnail.png" alt="png-transparent-user-computer-icons-user-miscellaneous-cdr-rectangle-thumbnail" style="max-width: 20px;width: 100%; height: auto;">
        //     <span style="font-weight: 600; font-size: 15px; color: #000;padding-left: 10px;">${ele.participentType[1].person} ${ele.participentType[1].pertype}(${ele.participentType[1].age})
        //         </span>

        // </td>

        result += ` </tr>
                        </table>
                    </div>
        
                    <div style="width: 100%; padding-top: 10px;">
                        <table>
                            <tr>
                                <td style="width: 500px;padding-bottom: 10px;">
                                    <span>
                                        <h4 style="font-size: 25px; font-weight: 700; margin-top: 5px;">What to remember ?</h4>
                                        <p style="font-size: 15px;">Lorem ipsum dolor, sit amet consectetur adipisicing elit.
                                            Eveniet doloribus voluptatum
                                            maiores ab maxime pariatur! Adipisci, officia. Voluptatem, harum architecto quis
                                            consequuntur totam impedit..</p>
                                        <p style="font-size: 15px;">Lorem ipsum dolor sit, amet consectetur adipisicing elit.
                                            Iusto
                                            voluptatum nobis assumenda laudantium? Ab, quia repellendus culpa dolorem libero
                                            laborum
                                            quisquam modi reprehenderit exercitationem aliquid sequi sunt sint asperiores eum.
                                        </p>
                                    </span>
                                </td>
                                <td style="width: 700px; padding-left: 10px;">
                                    <span>
                                        <p style="font-size: 20px; font-weight: 700; margin-top: 0px;line-hight:0.5px">Need Help ?</p>
                                        <p style="font-size: 15px;font-weight: 500;">Lorem ipsum dolor sit amet consectetur
                                            adipisicing elit. Suscipit ad aliquam consequuntur repellendus inventore architecto
                                            eos
                                            quaerat quo,</p>
                                        <p style="font-size: 15px;font-weight: 500;line-hight:0px">Local partner: Your company name</p>
                                        <p style="font-size: 14px;font-weight: 500;">Phone: <span
                                                style="font-size: 15px;font-weight: 500;color: blue;">+453179513</span></p>
                                        <p style="font-size: 14px;font-weight: 500;">email: <span
                                                style="font-size: 14px;font-weight: 500;color: blue;">gyuf169bj@465.com ,
                                                gufom124@.com</span></p>
                                        <div>
                                            <p style="font-size: 15px; line-hight:0px; font-weight: 700; margin-top: 0px;">Manage your booking
                                            </p>
                                            <p style="font-size: 15px;font-weight: 500;">Lorem ipsum dolor sit amet, consectetur
                                                adipisicing elit. Assumenda aspernatur soluta fugiat molestiae rem minus vitae
                                                reiciendis iste distinctio neque. Provident, dolore.</p>
                                            <p style="font-size: 15px;font-weight: 500;">Booking reference <span
                                                    style="font-size: 15px;font-weight: 500;color: blue;">GYG0000000</span></p>
                                            <P style="font-size: 15px;font-weight: 500;">PIN: <span
                                                    style="font-size: 14px;font-weight: 500;color: blue;">00000000</span></P>
                                            <p style="font-size: 14px;font-weight: 500;">For general booking questions, call
                                                Think
                                                to Do customer service 24/7 at <span
                                                    style="font-size: 15px;font-weight: 500;color: blue;">+617913681</span></p>
                                            <p style="font-size: 14px;font-weight: 500;">message us using WhatsApp(English
                                                only)on<span style="font-size: 13px;font-weight: 500;color: blue;">
                                                    +46921761</span>
                                            </p>
                                        </div>
                                    </span>
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>
            </section>
          </body>
        
          </html>`;

        result += `<!DOCTYPE html>
        <html lang="en">
        
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Document</title>
        </head>
        <style> html { -webkit-print-color-adjust: exact; } </style>
        <body>
      
            <section style="width: 100%; height: auto; text-align: start; padding: 100px 0;">
                <div
                    style="max-width: 700px; width: 100%; margin: 0 auto; border-radius: 6px;  overflow: hidden;">
        
                    <div style="background-color:orangered; height: auto; padding: 50px 30px;">
                        <h2 style="color: #fff;"> Things To Do</h2>
                        <p style="color: #fff;">${ele.activityDetails.cityName}:${ele.activityDetails.categotyName}</p>
                        <p style="color: #fff; padding: 10px 0;">Standard option</p>
                    </div>
            
        <div style="">
                    <table style="max-width: 100%; width: 100%;padding: 20px 30px;background-color: #e7dada69;">
                        <tr>
                            <td>
                                <p style="color: orangered;">Date</p>
                                <p style="color: blacks; font-weight: 700;">${formattedDate}</p>
                            </td>
                            <td>
                                <p style="color: orangered;">Time</p>
                                <p style="color: black; font-weight: 700;"> ${ele.bookingTime}</p>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="2">
                                <p style="color: orangered;">Order ID</p>
                                <p style="color: black; font-weight: 700;">${data[0].alpfaNueID}</p>
                            </td>
                        </tr>
                    </table>
        
                    <div style="width: 100%; padding: 20px 30px; background-color: #e7dada69;">
                        <p style="font-size: 24px; color: black;">${ele.userFirstName} ${ele.userLastName}</p>
                        <p style="color: black;">Ticket for ${ele.totalTourPerson} persons</p>
                    </div>
        </div>
                </div>
        
            </section>
        </body>
        
         </html>`;

        result += `<!DOCTYPE html>
         <html lang="en">
        
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title></title>
        </head>
        
        <body>
            <section style="width: 100%; height: auto;padding: 80px 0 20px 0;">
                <div style="max-width: 1000px; margin: 0 auto; background-color: #fff;">
                    <div style=" padding: 20px; background-color: orangered;">
                        <p style="text-align: center; color: #fff; font-size: 30px; font-weight: 600;padding-top:20px">Booking details</p>
                    </div>
                    <div>
                        <h2 style="text-align: center; font-size: 30px; font-weight: 600;padding-top: 20px;">Important
                            Information</h2>
                        <p style="text-align: center; font-size: 20px;padding: 0px 80px; ">Lorem, ipsum dolor sit amet
                            consectetur adipisicing elit. Iure, obcaecati eveniet! Sed eum in eaque excepturi dolor saepe
                            consectetur expedita voluptas aut esse similique, animi ullam dicta, fuga perferendis unde. Lorem
                            ipsum dolor sit amet consectetur adipisicing elit. Voluptatem quae deleniti quis libero similique
                            non autem ipsa dignissimos illo magnam nemo corporis voluptate maxime repellat ipsam saepe, atque
                            quibusdam. Debitis. Lorem ipsum, dolor sit amet consectetur adipisicing elit. Neque iste ex fugit
                            culpa quia blanditiis minima quod beatae quaerat doloremque, libero consequuntur amet nobis
                            molestias. Excepturi, soluta...</p>
        
                            <h2 style="text-align: center; font-size: 30px; font-weight: 600;padding-top: 10px;">Merchant Information</h2>
                            <p style="font-size: 15px;padding: 0px 80px;">Your Company name</p>
                            <p style="font-size: 15px;padding: 0px 80px;color: blue;">+4921764864</p>
                            <p style="font-size: 15px;padding: 0px 80px;color: blue;">cjgyuv@hfujb254-hgfjb25667.vkhi3267-467.com</p>
                            <p style="font-size: 15px;padding: 0px 80px; color: #4d4c4c;padding-bottom: 50px;">Lorem ipsum dolor sit, amet consectetur adipisicing elit. At repudiandae officia itaque asperiores vitae debitis placeat impedit quidem voluptatem! Dolorem suscipit accusantium iusto distinctio porro nulla soluta veritatis, rerum quibusdam.</p>
                    </div>
                </div>
            </section>
        </body>
        
        </html>`;
      });

      let file = result;
      let path = "pdf/" + timestamp + ".pdf"
      HtmlToPdf.generatePdf(file, path, options).then((pdfBuffer) => {
        // console.log("PDF Buffer:-", pdfBuffer);
        // fs.writeFile("pdf/" + timestamp + ".pdf", pdfBuffer, function (err) {
        //   // console.log("hello")

        //   if (err) return console.log(err);

        //     const emailTemplet = `<p>Subject:Your Booking Confirmation</p>

        // <p>Dear ${req.user.firstName} ${req.user.lastName},

        // Thank you for choosing ThingsToDo for your upcoming travel. We are pleased to confirm your booking. Please find the details of your ticket below:</p>`;

        //     const transporter = nodemailer.createTransport({
        //       host: "smtp.gmail.com",
        //       port: 587,
        //       secure: false,
        //       requireTLS: true,
        //       auth: {
        //         user: "pal.happytome88@gmail.comz",
        //         pass: "vgtubapoawagvfcv",
        //       },
        //     });

        //     const mailOption = {
        //       from: "pal.happytome88@gmail.comz",
        //       to: req.user.email,
        //       subject: "Booking Ticket",
        //       html: emailTemplet,
        //       attachments: [
        //         {
        //           path: "http://34.249.210.102:8025/pdf/" + timestamp + ".pdf",
        //           // path: "http://127.0.0.1:8025/pdf/" + timestamp + ".pdf"
        //           // cid: 'uniq-mailtrap.png'
        //         },
        //       ],
        //     };

        //     transporter.sendMail(mailOption, function (error, info) {
        //       if (error) {
        //         console.log(error);
        //         res
        //           .status(500)
        //           .json({ status: false, message: "Error sending email" });
        //       } else {
        //         console.log("Email has been sent:- ", info.response);
        //         res.status(200).json({ status: true, message: "Email sent" });
        //       }
        //     });

        return res.status(200).json({
          status: true,
          // data: "http://34.249.210.102:8025/pdf/" + timestamp + ".pdf",
          data: "http://34.201.127.230:8025/pdf/" + timestamp + ".pdf",
          message: "Pdf Created Successfully",
          // data:data[0].list
        });
        // });
      });
      // res.status(ResponseCode.errorCode.success).json({
      //   status: true,
      //   message: "view all booking history",
      //   data: data[0].list,
      // });
    })
    .catch((error) => {
      console.log(error);
      const errors = DBerror(error);
      res.status(ResponseCode.errorCode.success).json({
        status: false,
        message: "Server error, Please try again later",
        error: errors,
      });
    });
};

const viewBookingTicket = async (req, res) => {
  console.log("book ticket api hit===");
  // console.log(req.user);

  userBooking
    .aggregate(
      [
        {
          $match: {
            userId: req.user._id,
            orderId: new mongoose.Types.ObjectId(req.params.orderid),
            activityDetailsId: new mongoose.Types.ObjectId(req.params.activityid),
          },
        },

        {
          $lookup: {
            from: "activitydetails",
            localField: "activityDetailsId",
            foreignField: "_id",
            pipeline: [
              {
                $lookup: {
                  from: "cities",
                  localField: "cityId",
                  foreignField: "_id",
                  as: "city",
                },
              },
              {
                $unwind: {
                  path: "$city",
                  preserveNullAndEmptyArrays: true,
                },
              },

              {
                $lookup: {
                  from: "categories",
                  localField: "categoryId",
                  foreignField: "_id",
                  as: "category",
                },
              },
              {
                $unwind: {
                  path: "$category",
                  preserveNullAndEmptyArrays: true,
                },
              },

              {
                $project: {
                  activityTitle: 1,
                  // image: 1,
                  meetingPoint: 1,
                  tourDuration: 1,
                  // participentType: 1,
                  cityName: "$city.cityName",
                  categotyName: "$category.categoryName",
                },
              },
            ],
            as: "activityDetails",
          },
        },
        {
          $unwind: {
            path: "$activityDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userDetails",
          },
        },

        {
          $unwind: {
            path: "$userDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $project: {
            orderId: 1,
            bookingDate: 1,
            bookingTime: 1,
            participentType: 1,
            totalTourPerson: 1,
            activityDetails: 1,
            alpfaNueID: 1,
            userFirstName: "$userDetails.firstName",
            userLastName: "$userDetails.lastName",
          },
        },

        // {
        //   $project: {
        //     _id: 0,
        //     alpfaNueID: 1,
        //     list: 1,
        //   },
        // },
      ]
    )
    .then(async (data) => {
      // console.log("data is",data);
      // res.json({
      //   data: data,
      // });
      if (!data || data.length === 0) {
        return res.status(404).json({
          status: false,
          message: "Booking Data not found",
        });
      }

      var result = "";

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

      const inputDateString = data?.[0]?.bookingDate;
      const formattedDate = formatDate(inputDateString);
      console.log(formattedDate);

      var total = []; ``
      var sum = 0;
      var timestamp = `${new Date().getDate()}${new Date().getHours()}${new Date().getSeconds()}${new Date().getMilliseconds()}`;
      var result = "";
      data.forEach((ele) => {
        result += `<!DOCTYPE html>
        <html lang="en">
        
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title></title>
        </head>
        
        <body>
            <section style="width: 100%; height: auto; padding: 10px 0;">
                <div style="max-width: 1100px; margin: 0 auto; background-color: #fff;">
                    <div style="width: 100%; padding: 10px;">
                        <table>
                            <tr colspan="2">
                                <td style="display: block;">
                                            <a href="https://imgbb.com/"><img src="https://i.ibb.co/KjqRKWR/things-to-doo-logo.png" alt="things-to-doo-logo" style="max-width: 80px;width: 100%; height: 100%;"></a>
                                </td>
                                <td style="width: 500px; padding-left: 10px;">
                                    <span>
                                        <p style="font-weight: 800; font-size: 15px; line-height: 0px;">${ele.alpfaNueID}</p>

                                        <P style="font-weight: 800; font-size: 15px; line-height: 20px;">${ele.activityDetails.activityTitle}</P>
                                        <p style="font-size: 15px;color: rgb(58, 59, 59);line-height: 20px; font-weight: 600;">
                                            Option (Stander Option)</p>
                                        <p style="font-size: 15px; color:  rgb(58, 59, 59);  line-height: 0px;">${ele.activityDetails.cityName}:${ele.activityDetails.categotyName}
                                            
                                        </p>
                                        <div style="padding-top: 10px;">
                                            <a href="https://ibb.co/BnqCTw5"><img src="https://i.ibb.co/SfR3VJ4/calendar-152139-640.png" alt="calendar-152139-640"style="max-width: 20px;width: 100%; height: 100%;"></a>
                                            <span
                                                style="font-size: 14px; color:  rgb(58, 59, 59); line-height: 20px; font-weight: 600;padding-left: 10px;"> ${formattedDate}  ${ele.bookingTime}
                                                </span>
                                        </div>
                                        <div style="padding-top: 10px;">
                                            <a href="https://imgbb.com/"><img src="https://i.ibb.co/DgGczxR/images.png" alt="images"style="max-width: 20px;width: 100%; height: 100%;" ></a>
                                            <span
                                                style="font-size: 14px; color: rgb(58, 59, 59); line-height: 20px; font-weight: 600;padding-left: 10px;">Duration:
                                                ${ele.activityDetails.tourDuration.value}  ${ele.activityDetails.tourDuration.unit} 
                                                </span>
                                        </div>
                                        <p style="font-weight: 600; font-size: 15px; color: rgb(168, 169, 170);">Booked by</p>
                                        <p style="font-weight: 600; font-size: 15px; color:rgb(58, 59, 59);">${ele.userFirstName} ${ele.userLastName}
                                        </p>
                                    </span>
                                </td>`;

        for (let element of ele.participentType) {
          result += `<td style="width: 400px; padding-left: 30px;">
                                        
        <img src="https://i.ibb.co/PcFX5YF/png-transparent-user-computer-icons-user-miscellaneous-cdr-rectangle-thumbnail.png" alt="png-transparent-user-computer-icons-user-miscellaneous-cdr-rectangle-thumbnail" style="max-width: 20px;width: 100%; height: auto;">
        <span style="font-weight: 600; font-size: 15px; color: #000;padding-left: 10px;">${element.person} ${element.pertype}(${element.age})
        </span>

          </td>`;
        }

        //     <td style="width: 400px; padding-left: 30px;">

        //     <img src="https://i.ibb.co/PcFX5YF/png-transparent-user-computer-icons-user-miscellaneous-cdr-rectangle-thumbnail.png" alt="png-transparent-user-computer-icons-user-miscellaneous-cdr-rectangle-thumbnail" style="max-width: 20px;width: 100%; height: auto;">
        //     <span style="font-weight: 600; font-size: 15px; color: #000;padding-left: 10px;">${ele.participentType[1].person} ${ele.participentType[1].pertype}(${ele.participentType[1].age})
        //         </span>

        // </td>

        result += ` </tr>
                        </table>
                    </div>
        
                    <div style="width: 100%; padding-top: 10px;">
                        <table>
                            <tr>
                                <td style="width: 500px;padding-bottom: 10px;">
                                    <span>
                                        <h4 style="font-size: 25px; font-weight: 700; margin-top: 5px;">What to remember ?</h4>
                                        <p style="font-size: 15px;">Lorem ipsum dolor, sit amet consectetur adipisicing elit.
                                            Eveniet doloribus voluptatum
                                            maiores ab maxime pariatur! Adipisci, officia. Voluptatem, harum architecto quis
                                            consequuntur totam impedit..</p>
                                        <p style="font-size: 15px;">Lorem ipsum dolor sit, amet consectetur adipisicing elit.
                                            Iusto
                                            voluptatum nobis assumenda laudantium? Ab, quia repellendus culpa dolorem libero
                                            laborum
                                            quisquam modi reprehenderit exercitationem aliquid sequi sunt sint asperiores eum.
                                        </p>
                                    </span>
                                </td>
                                <td style="width: 700px; padding-left: 10px;">
                                    <span>
                                        <p style="font-size: 20px; font-weight: 700; margin-top: 0px;line-hight:0.5px">Need Help ?</p>
                                        <p style="font-size: 15px;font-weight: 500;">Lorem ipsum dolor sit amet consectetur
                                            adipisicing elit. Suscipit ad aliquam consequuntur repellendus inventore architecto
                                            eos
                                            quaerat quo,</p>
                                        <p style="font-size: 15px;font-weight: 500;line-hight:0px">Local partner: Your company name</p>
                                        <p style="font-size: 14px;font-weight: 500;">Phone: <span
                                                style="font-size: 15px;font-weight: 500;color: blue;">+453179513</span></p>
                                        <p style="font-size: 14px;font-weight: 500;">email: <span
                                                style="font-size: 14px;font-weight: 500;color: blue;">gyuf169bj@465.com ,
                                                gufom124@.com</span></p>
                                        <div>
                                            <p style="font-size: 15px; line-hight:0px; font-weight: 700; margin-top: 0px;">Manage your booking
                                            </p>
                                            <p style="font-size: 15px;font-weight: 500;">Lorem ipsum dolor sit amet, consectetur
                                                adipisicing elit. Assumenda aspernatur soluta fugiat molestiae rem minus vitae
                                                reiciendis iste distinctio neque. Provident, dolore.</p>
                                            <p style="font-size: 15px;font-weight: 500;">Booking reference <span
                                                    style="font-size: 15px;font-weight: 500;color: blue;">GYG0000000</span></p>
                                            <P style="font-size: 15px;font-weight: 500;">PIN: <span
                                                    style="font-size: 14px;font-weight: 500;color: blue;">00000000</span></P>
                                            <p style="font-size: 14px;font-weight: 500;">For general booking questions, call
                                                Think
                                                to Do customer service 24/7 at <span
                                                    style="font-size: 15px;font-weight: 500;color: blue;">+617913681</span></p>
                                            <p style="font-size: 14px;font-weight: 500;">message us using WhatsApp(English
                                                only)on<span style="font-size: 13px;font-weight: 500;color: blue;">
                                                    +46921761</span>
                                            </p>
                                        </div>
                                    </span>
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>
            </section>
          </body>
        
          </html>`;

        result += `<!DOCTYPE html>
        <html lang="en">
        
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Document</title>
        </head>
        <style> html { -webkit-print-color-adjust: exact; } </style>
        <body>
      
            <section style="width: 100%; height: auto; text-align: start; padding: 50px 0;">
                <div
                    style="max-width: 700px; width: 100%; margin: 0 auto; border-radius: 6px;  overflow: hidden;">
        
                    <div style="background-color:orangered; height: auto; padding: 50px 30px;">
                        <h2 style="color: #fff;"> Things To Do</h2>
                        <p style="color: #fff;">${ele.activityDetails.cityName}:${ele.activityDetails.categotyName}</p>
                        <p style="color: #fff; padding: 10px 0;">Standard option</p>
                    </div>
            
        <div style="">
                    <table style="max-width: 100%; width: 100%;padding: 20px 30px;background-color: #e7dada69;">
                        <tr>
                            <td>
                                <p style="color: orangered;">Date</p>
                                <p style="color: blacks; font-weight: 700;">${formattedDate}</p>
                            </td>
                            <td>
                                <p style="color: orangered;">Time</p>
                                <p style="color: black; font-weight: 700;"> ${ele.bookingTime}</p>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="2">
                                <p style="color: orangered;">Order ID</p>
                                <p style="color: black; font-weight: 700;">${ele.alpfaNueID}</p>
                            </td>
                        </tr>
                    </table>
        
                    <div style="width: 100%; padding: 20px 30px; background-color: #e7dada69;">
                        <p style="font-size: 24px; color: black;">${ele.userFirstName} ${ele.userLastName}</p>
                        <p style="color: black;">Ticket for ${ele.totalTourPerson} persons</p>
                    </div>
        </div>
                </div>
        
            </section>
        </body>
        
         </html>`;

        result += `<!DOCTYPE html>
         <html lang="en">
        
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title></title>
        </head>
        
        <body>
            <section style="width: 100%; height: auto;padding: 40px 0 20px 0;">
                <div style="max-width: 1000px; margin: 0 auto; background-color: #fff;">
                    <div style=" padding: 20px; background-color: orangered;">
                        <p style="text-align: center; color: #fff; font-size: 30px; font-weight: 600;padding-top:20px">Booking details</p>
                    </div>
                    <div>
                        <h2 style="text-align: center; font-size: 30px; font-weight: 600;padding-top: 20px;">Important
                            Information</h2>
                        <p style="text-align: center; font-size: 20px;padding: 0px 80px; ">Lorem, ipsum dolor sit amet
                            consectetur adipisicing elit. Iure, obcaecati eveniet! Sed eum in eaque excepturi dolor saepe
                            consectetur expedita voluptas aut esse similique, animi ullam dicta, fuga perferendis unde. Lorem
                            ipsum dolor sit amet consectetur adipisicing elit. Voluptatem quae deleniti quis libero similique
                            non autem ipsa dignissimos illo magnam nemo corporis voluptate maxime repellat ipsam saepe, atque
                            quibusdam. Debitis. Lorem ipsum, dolor sit amet consectetur adipisicing elit. Neque iste ex fugit
                            culpa quia blanditiis minima quod beatae quaerat doloremque, libero consequuntur amet nobis
                            molestias. Excepturi, soluta...</p>
        
                            <h2 style="text-align: center; font-size: 30px; font-weight: 600;padding-top: 10px;">Merchant Information</h2>
                            <p style="font-size: 15px;padding: 0px 80px;">Your Company name</p>
                            <p style="font-size: 15px;padding: 0px 80px;color: blue;">+4921764864</p>
                            <p style="font-size: 15px;padding: 0px 80px;color: blue;">cjgyuv@hfujb254-hgfjb25667.vkhi3267-467.com</p>
                            <p style="font-size: 15px;padding: 0px 80px; color: #4d4c4c;padding-bottom: 50px;">Lorem ipsum dolor sit, amet consectetur adipisicing elit. At repudiandae officia itaque asperiores vitae debitis placeat impedit quidem voluptatem! Dolorem suscipit accusantium iusto distinctio porro nulla soluta veritatis, rerum quibusdam.</p>
                    </div>
                </div>
            </section>
        </body>
        
        </html>`;
      });

      let file = result;
      let options = {
        // format: "A4",
        unit: 'mm',
        format: 'A4',
        landscape: true,
      };
      let path = "pdf/" + timestamp + ".pdf"
      // HtmlToPdf(file, path, options).then((pdfBuffer) => {
      //   return res.status(200).json({
      //     status: true,
      //     data: "http://34.249.210.102:8025/pdf/" + timestamp + ".pdf",
      //     // data: "http://127.0.0.1:8025/pdf/" + timestamp + ".pdf",
      //     message: "Pdf Created Successfully",
      //     // data: data[0]
      //   });
      //   // });
      // });
      const pdfBuffer = await HtmlToPdf(file, options);
      console.log("pdf buffer file===", pdfBuffer);
      const uploadResult = await doPDFUpload(pdfBuffer, timestamp);

      if (uploadResult.status) {
        return res.status(200).json({
          status: true,
          data: uploadResult.url,
          message: "Pdf Created and Uploaded Successfully",
        });
      } else {
        return res.status(500).json({
          status: false,
          error: uploadResult.error,
          message: "Error uploading PDF to AWS S3",
        });
      }

    })
    .catch((error) => {
      console.log("Error during API execution:", error);
      const errors = DBerror(error);
      res.status(ResponseCode.errorCode.success).json({
        status: false,
        message: "Server error, Please try again later",
        error: errors,
      });
    });
};


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
        title: "Approaching Journey",
        body: "The imminent arrival of your trip is just around the corner.",
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



const allDeviceSendNotificationForUpcomingTrip = async () => {
  try {
    const currentDate = new Date();
    // currentDate.setHours(0, 0, 0, 0); // Set hours, minutes, seconds, and milliseconds to 0 for accurate date comparison
    console.log("currentDate===", moment(currentDate).format("YYYY-MM-DD"));
    const twentyFourHoursLater = new Date(currentDate);
    twentyFourHoursLater.setDate(currentDate.getDate() + 1);

    // const formattedCurrentDate = currentDate.toISOString().split('T')[0];
    const formattedCurrentDate = moment(currentDate).format("YYYY-MM-DD");
    const formattedTwentyFourHoursLater = moment(twentyFourHoursLater).format("YYYY-MM-DD");
    // const formattedTwentyFourHoursLater = twentyFourHoursLater.toISOString().split('T')[0];

    console.log("formattedCurrentDate is==", formattedCurrentDate);
    console.log("formattedTwentyFourHoursLater=====", formattedTwentyFourHoursLater);

    const userBookingData = await userBooking.aggregate([
      {
        $match: {
          isDeleted: false,
          bookingType: 'activity',
          bookingStatus: 'confirmed',
          bookingDate: {
            $gt: formattedCurrentDate,
            $lte: formattedTwentyFourHoursLater,
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          pipeline: [
            {
              $match: {
                isDeleted: false,

              }
            }
          ],
          as: "userData",
        },
      },
      {
        $unwind: "$userData",
      },
      {
        $addFields: {
          userDeviceToken: "$userData.deviceToken",
        },
      },
    ]);
    // console.log("user booking data", userBookingData);
    // Loop through the userBookingData and send notifications for each booking
    userBookingData.forEach((booking) => {
      sendNotification(booking.userDeviceToken);
      console.log("bokkking bookingDate token are ", booking.userId, "token data are===");
      console.log("bokkking bookingDate token are ", booking.bookingDate, "token data are===");
    });
  } catch (error) {
    console.error("Error sending notifications to all devices:", error);
  }
}




const scheduleTripNotification = () => {
  // Schedule the cron job to run every 24 hours
  cron.schedule("0 0 */1 * *", () => {
    // Call the function to send FCM notification to all devices
    allDeviceSendNotificationForUpcomingTrip();
  });
};


// const scheduleTripNotification = () => {
//   console.log("Hit schedule trip function ===");
//   // Schedule the cron job to run every five seconds
//   cron.schedule("*/15 * * * * *", () => {
//     // Call the function to send FCM notification to all devices
//     allDeviceSendNotificationForUpcomingTrip();
//   });
// };


const userBookingNotCompleteNotification = async (req, res) => {
  const userData = req.user;
  try {
    const userDeviceToken = userData.deviceToken;

    if (userDeviceToken !== null && userDeviceToken !== "" && userDeviceToken !== undefined) {
      

      // Delay the execution of notification sending by 2 minutes
      setTimeout(() => {
        sendNotificationNew(userDeviceToken);
      }, 2 * 60 * 1000); // 2 minutes in milliseconds
      res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Notification will send after 2 min",
      });
    } else {
      return res.status(ResponseCode.errorCode.dataNotFound).json({
        status: false,
        message: "Invalid device token",
      });
    }
  } catch (error) {
    console.log("Error in booking not complete notification", error);
    const errors = DBerror(error);
    return res.status(ResponseCode.errorCode.serverError).json({
      status: false,
      message: "Server error, please try again later",
      error: errors,
    });
  }
};

// Function to send notification
const sendNotificationNew = (userDeviceToken) => {
  const bookedOptions = {
    method: "POST",
    url: "https://fcm.googleapis.com/fcm/send",
    headers: {
      "content-type": "application/json",
      Authorization: SecretKey,
    },
    body: JSON.stringify({
      registration_ids: [userDeviceToken],
      priority: "high",
      data: {},
      notification: {
        title: "Booking not Complete",
        body: `Your Booking is not complete. Please complete your booking.`,
        vibrate: 1,
        sound: 1,
        show_in_foreground: true,
        priority: "high",
        content_available: true,
      },
    }),
  };

  request(bookedOptions, function (error, response) {
    if (error) {
      console.error("Error sending FCM notification:", error);
    } else {
      console.log("FCM notification sent successfully:", response.body);
    }
  });
};




module.exports = {
  addBooking,
  deleteBooking,
  viewAllBookingHistory,
  viewPurchasedGiftCard,
  viewAllUpcomingBooking,
  viewAllpreviousBooking,
  viewBookingTicket,
  beforeBookingCheck,
  allDeviceSendNotificationForUpcomingTrip,
  scheduleTripNotification,
  userBookingNotCompleteNotification
};
