const mongoose = require("mongoose");
const User = require("../../Models/user");
const GiftCard = require("../../Models/giftCard");
const UserBooking = require("../../Models/userBooking");
const BookingDetails = require("../../Models/bookingDetails");
const CardHistory = require("../../Models/CardHistory");
const ResponseCode = require("../../service/responseCode");
const { DBerror, InputError } = require("../../service/errorHandeler");
const nodemailer = require("nodemailer");
const gift = require("../../Models/gift");
var request = require("request");
const SecretKey =
  "key=AAAA6-brgqU:APA91bFVDR2FmnNTPjzcWCCF6KtFWVUJx_gak-G9_BRnEzBWPNTCTMUfTd5MW7KaDUNvM6gI3qF0VEhXZpDC_j35batDjqsgURZ_bRkQ4HeQk5qqbUxHazXplO3jQSUfrJoBg3deeu0P";

const giftAdd = (req, res) => {
  console.log("api hit===");
  var oneYearFromNow = new Date();
  var random = Math.random().toString(36).slice(2);
  console.log(random);

  let giftData = {
    ...req.body,
    userId: req.user._id,
    expirationDate: oneYearFromNow.setFullYear(
      oneYearFromNow.getFullYear() + 1
    ),
    giftCode: random,
    createdOn: new Date(),
  };

  if (req.body.activityId) {
    giftData.activityId = new mongoose.Types.ObjectId(req.body.activityId);
  }

  const addGift = new GiftCard(giftData);
  addGift
    .save()
    .then((data) => {
      res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "GiftCard added successfully",
      });
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


const sendGiftCardToEmail = async (req, res) => {
  let giftLink = req.body.giftApplyLink;
  let userEmail = req.user.email;

  if (userEmail === req.body.email) {
    return res.status(ResponseCode.errorCode.serverError).json({
      status: false,
      message: "You cannot send a Gift card to your own email address.",
    });
  }
  try {
    const check = await User.find({ email: req.body.email }).exec();

    if (check.length > 0) {
      await CardHistory.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(req.body.cardId) },
        {
          receiverEmail: check[0].email,
          recieverId: check[0]._id,
          sendToMail: true,
          updatedOn: new Date(),
        }
      ).exec();
    } else {
      await CardHistory.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(req.body.cardId) },
        {
          receiverEmail: req.body.email,
          sendToMail: true,
          updatedOn: new Date(),
        }
      ).exec();
    }

    await GiftCard.deleteOne({
      giftCode: req.body.giftCode,
      userId: req.user._id,
    }).exec();

    const history = await CardHistory.findOne({ _id: new mongoose.Types.ObjectId(req.body.cardId) }).exec();
    console.log("history",history)

    if (history) {
      const date = new Date(history.expirationDate);
      const options = { day: "numeric", month: "long", year: "numeric" };
      const formattedDate = date.toLocaleDateString("en-US", options);


      const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: "thingstodoo85@gmail.com",
        pass: "fnuf lemg isln emly"
      },
    });
    const mailOption = {
      from: "thingstodoo85@gmail.com",
      to: req.body.email,
      subject: "Gift Card",
      html:
        `<section
        style="background-color: rgb(209, 229, 245); background-repeat: no-repeat;  background-size: cover ; margin: 0 auto; max-width: 700px;">
        <div style="height: 100%; width: 100%; text-align: center;">
            <h1
                style="text-align: center; padding: 30px;font-weight: 700; font-size: 30px;">
                Your gift card is ready
            </h1>
            <p
                style="width: 100%; text-align: center; font-size: 20px; font-weight: 500;">
                Congratulation, Your made-up voucher code gift <br/>card is ready. Somebody really likes you!!
            </p>
          
            <div style="display: flex; justify-content: center; align-items: center;">
                <p
                    style="width: 100%; font-size: 20px; font-weight: 600; text-align: center;">
                    Your email : <span style="padding-left: 10px">` +
        req.body.email +
        `</span></p>
            </div>
            <div style="display: flex; align-items: center; justify-content: center;">

            <p
                    style="width: 100%; font-size: 20px; margin: 0; font-weight: 600; text-align: center;">
                    Your giftCode : <span style="padding-left: 10px; background-color: rgb(250, 250, 245); font-size: 20px;">` +
        history.giftCode +
        `</span></p>
            </div>
            <p
                style="width: 100%; text-align: center; font-size: 20px; font-weight: 500; padding-top: 15px; margin: 0; ;">
                Your Gift Voucher Amount</p>
            
                <div
                    style="width: 100%; margin: 0 auto; background: linear-gradient(270deg, #5b64c5 0%, #a48be4 100%); max-width: 225px; height: 47px; border-radius: 30PX; display: flex; align-items: center; justify-content: center;">
                    <p style="width: 100%; margin: 0; text-align: center; font-size: 30px; font-weight: 500; color: #FFF; ">$` +
        history.amount +
        `</p>
                </div>
          
            <div
                style="background-color: rgb(209, 229, 245); display: flex; align-items: center; justify-content: center; text-align: center;">
                <p style="width: 100%; text-align: center; font-size: 20px; font-weight: 600;"><span style="padding: 0 5px;">Expiry Date :</span><span style="font-weight: 500;">` +
        formattedDate +
        // `</span><span style="font-weight: 500;">` +
        // history.expirationDate +
        // `</span>
        `</p>
            </div>
        <div
            style="background-color: rgb(209, 229, 245); display: flex; align-items: center; justify-content: center; text-align: center;">
            <p style="width: 100%; text-align: center; font-size: 20px; font-weight: 600;">
              <span style="padding: 0 5px;">Gift Link :</span>
              <a href="` + giftLink + `" style="font-weight: 500;"> ${giftLink} </a>
            </p>
          </div>
          
        </div>
    </section>`,
      };

      transporter.sendMail(mailOption, function (error, info) {
        if (error) {
          console.log(error);
          return res.status(ResponseCode.errorCode.serverError).json({
            status: false,
            message: "Failed to send the Gift card via email.",
          });
        } else {
          console.log("Email has been sent: ", info.response);
          UserBooking.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(req.body.userbookingid) },
            { $set: { sendToEmail: "sent" } }
          ).exec();

          return res.status(ResponseCode.errorCode.success).json({
            status: true,
            message: "Gift card sent successfully",
          });
        }
      });

      console.log("histry data=====",history);
      if (history.recieverId){
        // notification function start
      const userId = history.recieverId;
      console.log("user id id is====", userId);
      const userData = await User.findOne({ _id: userId });
      const userDeviceToken = userData?.deviceToken;
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
              title: "Gift Received",
              body: `You have received a gift! Check it out now.`,
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
      }

    } else {
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Gift card history not found.",
      });
    }
  } catch (error) {
    console.log(error, "MAIL ERROR===");
    return res.status(ResponseCode.errorCode.serverError).json({
      status: false,
      message: "An error occurred while processing the request.",
    });
  }
};

const sendActivityGiftCardToEmail = async (req, res) => {
  var check = await User.findOne({ email: req.body.email }).exec();
  var history = await CardHistory.findOne({ _id: new mongoose.Types.ObjectId(req.body.cardId) }).exec()
  let date = new Date(history.expirationDate);
  let options = { day: "numeric", month: "long", year: "numeric" };
  let formattedDate = date.toLocaleDateString("en-US", options);

  var orderId = new mongoose.Types.ObjectId();

  if (check != null && check != "") {
    console.log("yes");
    CardHistory.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(req.body.cardId) },
      {
        receiverEmail: check.email,
        recieverId: check._id,
        sendToMail: true,
        updatedOn: new Date(),
      }
    ).exec();

    new UserBooking({
      activityDetailsId: req.body.activityId,
      amount: req.body.amount,
      giftCode: req.body.giftCode,
      userId: check._id,
      personalMsg: req.body.personalMsg || "",
      expirationDate: req.body.expirationDate,
      bookingDate: req.body.bookingDate,
      bookingTime: req.body.bookingTime,
      orderId: orderId,
      userId: req.user._id,
      createdOn: new Date(),
    }).save();

    new BookingDetails({
      userId: check._id,
      orderId: orderId,
      bookingDate: req.body.bookingDate,
      bookingTime: req.body.bookingTime,
      actualPrice: req.body.actualPrice,
      discountedPrice: req.body.discountedPrice || 0,
      createdOn: new Date(),
    }).save();
  } else {
    console.log("no");

    CardHistory.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(req.body.cardId) },
      {
        receiverEmail: check.email,
        sendToMail: true,
        updatedOn: new Date(),
      }
    ).exec();

    new UserBooking({
      activityDetailsId: req.body.activityId,
      amount: req.body.amount,
      giftCode: req.body.giftCode,
      email: req.body.email,
      personalMsg: req.body.personalMsg || "",
      expirationDate: req.body.expirationDate,
      bookingDate: req.body.bookingDate,
      bookingTime: req.body.bookingTime,
      orderId: orderId,
      createdOn: new Date(),
    }).save();

    new BookingDetails({
      orderId: orderId,
      email: req.body.email,
      bookingDate: req.body.bookingDate,
      bookingTime: req.body.bookingTime,
      actualPrice: req.body.actualPrice,
      discountedPrice: req.body.discountedPrice || 0,
      createdOn: new Date(),
    }).save();
  }

  GiftCard.deleteOne({
    giftCode: req.body.giftCode,
    userId: req.user._id,
  }).exec();

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: "thingstodoo85@gmail.com",
        pass: "yzqkegawigupokwq",
      },
    });
    const mailOption = {
      from: "thingstodoo85@gmail.com",

      to: req.body.email,
      subject: "Gift Card",
      // html: `
      //           <html>
      //             <head>
      //               <style>
      //                 body {
      //                   font-family: Arial, sans-serif;
      //                   background-color: #f2f2f2;
      //                 }
      //                 .container {
      //                   max-width: 600px;
      //                   margin: 20px auto;
      //                   background-color: #ffffff;
      //                   padding: 20px;
      //                   border-radius: 5px;
      //                   box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      //                 }
      //                 h1 {
      //                   color: #333333;
      //                   font-size: 24px;
      //                   margin-bottom: 20px;
      //                 }
      //                 p {
      //                   color: #666666;
      //                   font-size: 16px;
      //                   line-height: 1.5;
      //                   margin-bottom: 10px;
      //                 }
      //                 a {
      //                   color: #007bff;
      //                   text-decoration: none;
      //                 }
      //                 a:hover {
      //                   text-decoration: underline;
      //                 }
      //               </style>
      //             </head>
      //             <body>
      //               <div class="container">
      //                 <h1>Gift Card</h1>
      //                 <p>You have been sent a gift card from ${req.user.email}</p>
      //                 <p>Gift Card code:${req.body.giftCode}</p>

      //                 <p>Best regards,</p>
      //                 <p>ThingsToDo</p>
      //               </div>
      //             </body>
      //           </html>
      //         `,

      html:
        `<section
        style="background-color: rgb(209, 229, 245); background-repeat: no-repeat;  background-size: cover ; margin: 0 auto; max-width: 700px;">
        <div style="height: 100%; width: 100%; text-align: center;">
            <h1
                style="text-align: center; padding: 30px;font-weight: 700; font-size: 30px;">
                Your gift card is ready
            </h1>
            <p
                style="width: 100%; text-align: center; font-size: 20px; font-weight: 500;">
                Congratulation, Your made-up voucher code gift <br/>card is ready. Somebody really likes you!!
            </p>
          
            <div style="display: flex; justify-content: center; align-items: center;">
                <p
                    style="width: 100%; font-size: 20px; font-weight: 600; text-align: center;">
                    Your email : <span style="padding-left: 10px">` +
        req.body.email +
        `</span></p>
            </div>
            <div style="display: flex; align-items: center; justify-content: center;">

            <p
                    style="width: 100%; font-size: 20px; margin: 0; font-weight: 600; text-align: center;">
                    Your giftCode : <span style="padding-left: 10px; background-color: rgb(250, 250, 245); font-size: 20px;">` +
        history.giftCode +
        `</span></p>
            </div>
            <p
                style="width: 100%; text-align: center; font-size: 20px; font-weight: 500; padding-top: 15px; margin: 0; ;">
                Your Gift Voucher Amount</p>
            
                <div
                    style="width: 100%; margin: 0 auto; background: linear-gradient(270deg, #5b64c5 0%, #a48be4 100%); max-width: 225px; height: 47px; border-radius: 30PX; display: flex; align-items: center; justify-content: center;">
                    <p style="width: 100%; margin: 0; text-align: center; font-size: 30px; font-weight: 500; color: #FFF; ">$` +
        history.amount +
        `</p>
                </div>
          
            <div
                style="background-color: rgb(209, 229, 245); display: flex; align-items: center; justify-content: center; text-align: center;">
                <p style="width: 100%; text-align: center; font-size: 20px; font-weight: 600;"><span style="padding: 0 5px;">Expiry Date :</span><span style="font-weight: 500;">` +
        formattedDate +
        // `</span><span style="font-weight: 500;">` +
        // req.body.bookingTime +
        // `</span>
        `</p>
            </div>
        </div>
    </section>`,
    };
    transporter.sendMail(mailOption, function (error, info) {
      if (error) {
        console.log("error", error);
      } else {
        console.log("Email has been sent:- ", info.response);
        UserBooking.findOneAndUpdate(
          { _id: new mongoose.Types.ObjectId(req.body.userbookingid) },
          { $set: { sendToEmail: "sent" } }
        ).exec();
        res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "Gift card send successfully",
        });
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

const viewCardHistory = async (req, res) => {
  console.log("api hit==")
  CardHistory.aggregate([
    {
      $match: {
        senderId: req.user._id,
        isRedeemed: false,
      },
    },
    // {
    //   $lookup: {
    //     from: "giftcards",
    //     localField: "activityId",
    //     foreignField: "activityId",
    //     as: "activity",
    //   },
    // },
    // {
    //   $unwind: {
    //     path: "$activity",
    //     preserveNullAndEmptyArrays: true,
    //   },
    // },
    // {
    //   $addFields:{
    //     giftApplyLink: "$activity.giftApplyLink"
    //   },
    // },
    {
      $project: {
        isDeleted: 0,
        __v: 0,
        createdOn: 0,
        updatedOn: 0,
        status: 0,
        isRedeemed: 0,
        activity:0,
      },
    },
  ])
    .then((data) => {
      console.log("data is",data[0]);
      res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "view card history successfully",
        data: data,
      });
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

// const viewGiftCardList = async (req, res) => {
//   GiftCard.aggregate([
//     {
//       $match: {
//         userId: req.user._id,

//       },
//     },
//     {
//       $project: {
//         isDeleted: 0,
//         __v: 0,
//         createdOn: 0,
//         updatedOn: 0,
//         status: 0,
//         isRedeemed: 0,
//       },
//     },
//   ])
//     .then((data) => {
//       res.status(ResponseCode.errorCode.success).json({
//         status: true,
//         message: "view all gift card successfully",
//         data: data,
//       });
//     })
//     .catch((error) => {
//       console.log(error);
//       const errors = DBerror(error);
//       res.status(ResponseCode.errorCode.success).json({
//         status: false,
//         message: "Server error, Please try again later",
//         error: errors,
//       });
//     });
// };

const deleteGiftCard = async (req, res) => {
  const check = GiftCard.findOne({
    _id: new mongoose.Types.ObjectId(req.params.id),
  })
    .then((data) => {
      if (data) {
        GiftCard.deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id) })
          .then((result) => {
            res.status(ResponseCode.errorCode.success).json({
              status: true,
              message: "data deleted",
            });
          })
          .catch((error) => {
            console.log(error);
            const errors = DBerror(error);
            res.status(ResponseCode.errorCode.serverError).json({
              status: false,
              message: "Server error, Please try again later",
              error: errors,
            });
          });
      } else {
        res.status(ResponseCode.errorCode.dataNotFound).json({
          status: false,
          message: "Sdata not found",
        });
      }
    })
    .catch((error) => {
      console.log(error);
      const errors = DBerror(error);
      res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error, Please try again later",
        error: errors,
      });
    });
};


const viewGift = async (req, res) => {
  await gift.aggregate([
    {
      $match: {
        isDeleted: false,
        status: true,
      },
    },

    {
      $project: {
        __v: 0,
        isDeleted: 0,
        createdOn: 0,
      },
    },
    {
      $sort: {
        _id: -1,
        createdOn: -1
      },
    },
  ])
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "gift viewed sucessfully",
        data: data,
      });
    })
    .catch((error) => {
      const errors = DBerror(error);
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error,Please try again",
        error: errors,
      });
    });
};

module.exports = {
  giftAdd,
  sendGiftCardToEmail,
  sendActivityGiftCardToEmail,
  viewCardHistory,
  deleteGiftCard,
  // viewGiftCardList,
  viewGift
};
