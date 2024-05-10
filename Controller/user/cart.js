const mongoose = require("mongoose");
const Cart = require("../../Models/cart");
const User = require("../../Models/user");
const CartTimeCheck = require("../../Models/cartTimeCheck");
const GiftCard = require("../../Models/giftCard");
const cartHistory = require("../../Models/CardHistory");
const ResponseCode = require("../../service/responseCode");
const Availablity = require("../../Models/availability");
const { DBerror, InputError } = require("../../service/errorHandeler");
var moment = require("moment");

function convertDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
const addCart = async (req, res) => {
  var checkexistence = await Cart.find({
    userId: req.user._id,
    activityId: new mongoose.Types.ObjectId(req.body.activityId),
    statingTime: req.body.statingTime,
    bookedOn: req.body.bookedOn,
  }).exec();

  console.log({ checkexistence });

  if (checkexistence.length > 0) {
    res.status(ResponseCode.errorCode.dataExist).json({
      status: false,
      message: "Data already exist",
    });
  } else {
    let CartData = {
      ...req.body,
      userId: req.user._id,
      createdOn: new Date(),
    };

    const addCart = new Cart(CartData);
    addCart
      .save()
      .then((data) => {
        console.log(data.createdOn);

        const inputDateString = data.createdOn;
        const formattedDate = convertDate(inputDateString);
        const currentTime = new Date();
        const timeAfter10Minutes = new Date();
        timeAfter10Minutes.setMinutes(currentTime.getMinutes() + 10);

        // const timeAfter10Minutes = new Date(data.createdOn);
        // timeAfter10Minutes.setMinutes(timeAfter10Minutes.getMinutes() + 10)

        console.log("currentTime=====", timeAfter10Minutes.toISOString());
        // console.log("localtime=====", currentTime.toLocaleTimeString());
        // console.log("Current Time:", currentTime.toLocaleTimeString());
        // console.log(
        //   "Time After 10 Minutes:",
        //   timeAfter10Minutes.toLocaleTimeString()
        // );

        let cartTime = {
          userId: req.user._id,
          cartId: data._id,
          activityId: data.activityId,
          totalPerson: data.totalPerson,
          bookDateFor: data.bookedOn,
          bookTimeFor: data.statingTime,
          currentDate: formattedDate,
          currentTime: currentTime.toISOString(),
          timeAfter10Minutes: timeAfter10Minutes.toISOString(),
          createdOn: new Date(),
        };

        new CartTimeCheck(cartTime)
          .save()
          .then(async (result) => {
            // console.log({ result });
            var check = await Availablity.findOne({
              activityDetailsId: result.activityId,
              tourDate: result.bookDateFor,
              time: result.bookTimeFor,
            }).exec();

            console.log("check", check);

            if (check) {
              var total = check.remeningUser - result.totalPerson;

              console.log({ total });
              Availablity.findOneAndUpdate(
                {
                  activityDetailsId: check.activityDetailsId,
                  tourDate: check.tourDate,
                  time: check.time,
                },
                {
                  $set: {
                    remeningUser: total,
                  },
                }
              ).exec();
            }

            res.status(ResponseCode.errorCode.success).json({
              status: true,
              message: "Cart added successfully",
              data: result.timeAfter10Minutes,
            });
          })
          .catch((error) => {
            // console.log(error);
            const errors = DBerror(error);
            res.status(ResponseCode.errorCode.serverError).json({
              status: false,
              message: "Server error, Please try again later",
              error: errors,
            });
          });
      })
      .catch((error) => {
        // console.log({error});
        const errors = DBerror(error);

        // console.log(errors);
        res.status(ResponseCode.errorCode.serverError).json({
          status: false,
          message: "Server error",
          error: errors,
        });
      });
  }
};

const getCart00 = async (req, res) => {
  await User.aggregate([
    {
      $match: {
        _id: req.user._id,
        isDeleted: false,
      },
    },
    {
      $lookup: {
        from: "carts",
        localField: "_id",
        foreignField: "userId",
        pipeline: [
          {
            $lookup: {
              from: "activitydetails",
              localField: "activityId",
              foreignField: "_id",
              pipeline: [
                {
                  $lookup: {
                    from: "reviewratings",
                    localField: "_id",
                    foreignField: "activityDetailsId",
                    pipeline: [
                      {
                        $project: {
                          _id: 0,
                          activityDetailsId: 1,
                          avgRating: 1,
                        },
                      },
                    ],
                    as: "otherReview",
                  },
                },
                {
                  $addFields: {
                    reviewRating: { $sum: { $avg: "$otherReview.avgRating" } },
                  },
                },
                {
                  $addFields: {
                    totalReview: { $size: "$otherReview" },
                  },
                },
                {
                  $lookup: {
                    from: "languages",
                    localField: "languageId",
                    foreignField: "_id",
                    pipeline: [
                      {
                        $project: {
                          _id: 0,
                          name: 1,
                        },
                      },
                    ],
                    as: "language",
                  },
                },
                {
                  $unwind: {
                    path: "$language",
                    preserveNullAndEmptyArrays: true,
                  },
                },
                {
                  $lookup: {
                    from: "countries",
                    localField: "countryId",
                    foreignField: "_id",
                    pipeline: [
                      {
                        $project: {
                          _id: 1,
                          name: 1,
                        },
                      },
                    ],
                    as: "country",
                  },
                },
                {
                  $unwind: {
                    path: "$country",
                    preserveNullAndEmptyArrays: true,
                  },
                },
                {
                  $lookup: {
                    from: "wishlists",
                    localField: "_id",
                    foreignField: "activityId",
                    pipeline: [
                      {
                        $project: {
                          _id: 1,
                          folderId: 1,
                        },
                      },
                    ],
                    as: "wishlist",
                  },
                },
                {
                  $unwind: {
                    path: "$wishlist",
                    preserveNullAndEmptyArrays: true,
                  },
                },

                {
                  $project: {
                    image: 1,
                    country: 1,
                    slug: 1,
                    currency: 1,
                    activityTitle: 1,
                    tourDuration: 1,
                    startDate: 1,
                    reviewRating: 1,
                    totalReview: 1,
                    language: "$language.name",
                    currency: 1,
                    wishlist: 1,
                  },
                },
              ],
              as: "activity",
            },
          },
          {
            $unwind: {
              path: "$activity",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "carttimechecks",
              localField: "_id",
              foreignField: "cartId",
              as: "cartTime",
            },
          },
          {
            $unwind: {
              path: "$cartTime",
              preserveNullAndEmptyArrays: true,
            },
          },

          {
            $project: {
              _id: 1,
              activity: 1,
              currentStatus: 1,
              totalPerson: 1,
              totalPrice: 1,
              statingTime: 1,
              bookedOn: 1,
              participentType: 1,
              timeAfter10Mint: "$cartTime.timeAfter10Minutes",
            },
          },
        ],

        as: "cart_activity",
      },
    },
    {
      $lookup: {
        from: "giftcards",
        localField: "_id",
        foreignField: "userId",
        pipeline: [
          {
            $lookup: {
              from: "activitydetails",
              localField: "activityId",
              foreignField: "_id",
              as: "activitys",
            },
          },
          {
            $unwind: {
              path: "$activitys",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              amount: 1,
              giftCode: 1,
              personalMsg: 1,
              expirationDate: 1,
              activityId: "$activitys._id",
              activityName: "$activitys.activityTitle",
              activityImage: { $arrayElemAt: ["$activitys.image", 0] },
              activityCurrency: "$activitys.currency",
            },
          },
        ],

        as: "cart_giftcard",
      },
    },

    {
      $project: {
        _id: 0,
        cart_activity: 1,
        cart_giftcard: 1,
      },
    },
  ])
    .then(async (data) => {
      data[0].cart_activity.forEach(async (ele) => {
        console.log("ele", ele);
        var check = await Availablity.findOne({
          activityDetailsId: ele._id,
          tourDate: ele.bookedOn,
          time: ele.statingTime,
          remeningUser: { $gte: ele.totalPerson },
        }).exec();

        console.log({ check });
        if (check != null) {
          await CartTimeCheck.findOne({
            userId: req.user._id,
            activityId: check.activityDetailsId,
            bookDateFor: check.tourDate,
            bookTimeFor: check.time,
          })
            .then(async (result) => {
              console.log({ result });

              if (result != null || result != "") {
                const formattedDate = convertDate(new Date());
                console.log("hiiii");
                if (formattedDate === result.currentDate) {
                  console.log("hello");
                  const currentTime = new Date();
                  if (
                    currentTime.toLocaleTimeString() > result.timeAfter10Minutes
                  ) {
                    console.log("cartupdate");
                    await Cart.findOneAndUpdate(
                      { _id: ele._id },
                      {
                        $set: {
                          currentStatus: "unavailable",
                        },
                      },
                      { new: true }
                    ).exec();
                  } else {
                    console.log("avail");
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
                  console.log("unava");
                  Cart.findOneAndUpdate(
                    { _id: ele._id },
                    {
                      $set: {
                        currentStatus: "unavailable",
                      },
                    },
                    { new: true }
                  ).exec();
                }
              }
            })
            .catch((error) => { });
        } else {
          Cart.findOneAndUpdate(
            { _id: ele._id },
            {
              $set: {
                currentStatus: "unavailable",
              },
            },
            { new: true }
          ).exec();
        }
      });
      res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Get all cart data",
        data: data[0],
        // data: newdata,
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

const updateCart = (req, res) => {
  Cart.findOneAndUpdate(
    { _id: { $in: [new mongoose.Types.ObjectId(req.params.id)] } },
    {
      $set: {
        ...req.body,
      },
      updatedOn: new Date(),
    }
  )
    .then((data) => {
      res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Updated successfully",
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

const deleteCart = async (req, res) => {
  Cart.deleteOne({
    _id: { $in: [new mongoose.Types.ObjectId(req.params.id)] },
  })
    .then(async (data) => {
      var checkTime = await CartTimeCheck.find({
        userId: req.user._id,
        cartId: new mongoose.Types.ObjectId(req.params.id),
      }).exec();

      console.log({ checkTime });

      if (checkTime.length > 0) {
        var check = await Availablity.findOne({
          activityDetailsId: checkTime[0].activityId,
          tourDate: checkTime[0].bookDateFor,
          time: checkTime[0].bookTimeFor,
        }).exec();
        console.log(check);

        var total = check.remeningUser + checkTime[0].totalPerson;

        Availablity.findOneAndUpdate(
          {
            _id: check._id,
          },
          {
            $set: {
              remeningUser: total,
            },
          }
        ).exec();

        CartTimeCheck.deleteOne({ _id: checkTime[0]._id }).exec();
      }

      res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Deleted successfully",
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

// const addCardToCart = async (req, res) => {
//   var check = await cartHistory
//     .aggregate([
//       {
//         $match: {
//           giftCode: req.body.giftCode,
//           isRedeemed: false,
//           expirationDate: {
//             $gte: moment.utc(new Date()).startOf("date").toDate(),
//           },
//         },
//       },
//     ])
//     .then(async (data) => {
//       console.log("data", data);
//       if (data.length > 0) {
//         var fetchcart = await Cart.find(
//           { userId: req.user._id },
//           { _id: 0, totalPrice: 1 }
//         ).exec();
//         console.log("fetchcart data is", fetchcart);
//         var fetchgiftcard = await GiftCard.find(
//           { userId: req.user._id },
//           { _id: 0, amount: 1 }
//         ).exec();
//         console.log("fetchgiftcard=======", fetchgiftcard);
//         var res1 = fetchcart.reduce((acc, nxt) => acc + nxt.totalPrice, 0);
//         var res2 = fetchgiftcard.reduce((acc, nxt) => acc + nxt.amount, 0);
//         // var res3 = res1 + res2 - data[0].amount;
//         // Ensure discountedAmount is not negative
//         var res3 = Math.max(res1 + res2 - data[0].amount, 0);

//         let totalP = res1+ res2;
//         let giftP = data[0].amount;
//         let giftPrice = ""
//         if(totalP >= giftP){
//           giftPrice = giftP
//         }else{
//           giftPrice = totalP;
//         }
//         let payPrice = ""
//         if(totalP >= giftP){
//           payPrice = totalP - giftP
//         }else{
//           payPrice = 0
//         }
//         // cartHistory
//         //   .findOneAndUpdate(
//         //     { _id: data[0]._id },
//         //     { $set: { isRedeemed: true } }
//         //   )
//         //   .exec();
//         cartHistory
//           .findOneAndUpdate(
//             { _id: data[0]._id },
//             {
//               $set: {
//                 isRedeemed: res3 >= data[0].amount, // true if fully used, false if partially used
//                 amount: Math.max(data[0].amount - res1 + res2, 0) // update the remaining amount if partially used
//               }
//             }
//           )
//           .exec();
//         res.status(ResponseCode.errorCode.success).json({
//           status: true,
//           message: "Gift card added successfully",
//           // totalAmount: res1 + res2,
//           // discountedAmount: res3,
//           totalAmount: payPrice,
//           discountedAmount: giftPrice,
//         });
//       } else {
//         res.status(ResponseCode.errorCode.dataNotFound).json({
//           status: false,
//           message: "no such gift code exist",
//         });
//       }
//     })
//     .catch((error) => {
//       console.log(error);
//       const errors = DBerror(error);
//       res.status(ResponseCode.errorCode.serverError).json({
//         status: false,
//         message: "Server error, Please try again later",
//         error: error,
//       });
//     });
// };


const addCardToCart = async (req, res) => {
  try {
    const giftCode = req.body.giftCode;

    const giftHistory = await cartHistory.aggregate([
      {
        $match: {
          giftCode,
          isRedeemed: false,
          expirationDate: {
            $gte: moment.utc(new Date()).startOf("date").toDate(),
          },
        },
      },
    ]);

    if (giftHistory.length > 0) {
      const fetchcart = await Cart.find({ userId: req.user._id }, { _id: 0, totalPrice: 1 });
      const fetchgiftcard = await GiftCard.find({ userId: req.user._id }, { _id: 0, amount: 1 });

      const totalAmount = fetchcart.reduce((acc, nxt) => acc + nxt.totalPrice, 0) + fetchgiftcard.reduce((acc, nxt) => acc + nxt.amount, 0);
      const discountedAmount = Math.max(totalAmount - giftHistory[0].amount, 0);
      console.log("discountedAmount====",discountedAmount);


      if(discountedAmount<=0){
        isRedeemed=false;

      }else{
        isRedeemed = true;
      }
      // const isRedeemed = discountedAmount >= giftHistory[0].amount;
      // const isRedeemed = 5000 >= 6100
      console.log("is reedmed status==",isRedeemed);

      await cartHistory.findOneAndUpdate(
        { _id: giftHistory[0]._id },
        {
          $set: {
            isRedeemed,
            amount: Math.max(giftHistory[0].amount - totalAmount, 0),
          },
        }
      );

      // const payPrice = Math.min(totalAmount, giftHistory[0].amount);
      const payPrice = Math.max(totalAmount - giftHistory[0].amount, 0);
      console.log("newww ====payPrice",payPrice);
      // const giftPrice = totalAmount - payPrice;
      // console.log("gift price is===",giftPrice);

      res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Gift card added successfully",
        totalAmount: totalAmount,
        discountedAmount: payPrice,
        // totalAmount: giftPrice,
        // discountedAmount: payPrice,
      });
    } else {
      res.status(ResponseCode.errorCode.dataNotFound).json({
        status: false,
        message: "No such gift code exists",
      });
    }
  } catch (error) {
    console.log(error);
    const errors = DBerror(error);
    res.status(ResponseCode.errorCode.serverError).json({
      status: false,
      message: "Server error, Please try again later",
      error: error,
    });
  }
};

const getCart = async (req, res) => {
  let currentDate = new Date();
  let newDate = new Date(currentDate);

  await User.aggregate([
    {
      $match: {
        _id: req.user._id,
        isDeleted: false,
      },
    },
    {
      $lookup: {
        from: "carts",
        localField: "_id",
        foreignField: "userId",
        pipeline: [
          {
            $lookup: {
              from: "activitydetails",
              localField: "activityId",
              foreignField: "_id",
              pipeline: [
                {
                  $lookup: {
                    from: "specialoffers",
                    localField: "specialOfferId",
                    foreignField: "_id",
                    pipeline: [
                      {
                        $match: {
                          endDate: {
                            $gte: moment
                              .utc(new Date())
                              .startOf("date")
                              .toDate(),
                          },
                        },
                      },
                    ],
                    as: "offerDetails",
                  },
                },
                {
                  $unwind: {
                    path: "$offerDetails",
                    preserveNullAndEmptyArrays: true,
                  },
                },
                {
                  $addFields: {
                    activityActualAdultPrice: "$participentType",
                  },
                },
                {
                  $addFields: {
                    adultPrice: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$activityActualAdultPrice",
                            as: "priceItem",
                            cond: { $eq: ["$$priceItem.pertype", "Adult"] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                },
                {
                  $addFields: {
                    activityAdultPrice: "$adultPrice.price",
                  },
                },
                // {
                //   $addFields: {
                //     discountPrice: "$offerDetails.discountPercentage",
                //   },
                // },
                // {
                //   $addFields: {
                //     activitydiscountedPrice: {
                //       $multiply: [
                //         "$activityAdultPrice",
                //         { $divide: ["$discountPrice", 100] },
                //       ],
                //     },
                //   },
                // },
                {
                  $addFields: {
                    duration: {
                      $ifNull: ["$offerDetails.duration", 0],
                    },
                  },
                },

                {
                  $addFields: {
                    durationInSeconds: {
                      $switch: {
                        branches: [
                          {
                            case: {
                              $eq: ["$offerDetails.duration.unit", "days"],
                            },
                            then: {
                              $multiply: [
                                "$offerDetails.duration.value",
                                24 * 60 * 60 * 1000,
                              ],
                            },
                          },
                          {
                            case: {
                              $eq: ["$offerDetails.duration.unit", "hours"],
                            },
                            then: {
                              $multiply: [
                                "$offerDetails.duration.value",
                                60 * 60 * 1000,
                              ],
                            },
                          },
                          {
                            case: {
                              $eq: ["$offerDetails.duration.unit", "minutes"],
                            },
                            then: {
                              $multiply: [
                                "$offerDetails.duration.value",
                                60 * 1000,
                              ],
                            },
                          },
                        ],
                        default: 0, // Default value if "unit" doesn't match any of the cases
                      },
                    },
                  },
                },
                {
                  $addFields: {
                    startDate: {
                      $cond: {
                        if: { $ne: ["$offerDetails.startDate", null] },
                        then: "$offerDetails.startDate", // Use offerDetails.startDate if available
                        else: new Date(), // Use the current date as a default if offerDetails.startDate is null
                      },
                    },
                  },
                },

                {
                  $addFields: {
                    endDate: {
                      $cond: {
                        if: { $ne: ["$offerDetails", null] }, // Check if offerDetails is not null
                        then: { $add: ["$startDate", "$durationInSeconds"] }, // Calculate endDate
                        else: null, // Set endDate to null if offerDetails is null
                      },
                    },
                  },
                },
                {
                  $addFields: {
                    discountPrice: {
                      $cond: {
                        if: {
                          $and: [
                            { $ne: ["$offerDetails", null] }, // Check if offerDetails is not null
                            { $gte: ["$endDate", new Date()] }, // Check if endDate is not over the current date
                          ],
                        },
                        then: "$offerDetails.discountPercentage", // Use discountPercentage if conditions are met
                        else: null, // Set discountPrice to null if conditions are not met
                      },
                    },
                  },
                },
                {
                  $addFields: {
                    activitydiscountedPrice: {
                      $cond: {
                        if: { $eq: ["$discountPrice", null] }, // Check if discountPrice is null
                        then: null, // Set activitydiscountedPrice to null if discountPrice is null
                        else: {
                          $multiply: [
                            "$activityAdultPrice",
                            { $divide: ["$discountPrice", 100] },
                          ],
                        },
                      },
                    },
                  },
                },
                {
                  $lookup: {
                    from: "reviewratings",
                    localField: "_id",

                    foreignField: "activityDetailsId",
                    pipeline: [
                      {
                        $project: {
                          _id: 0,
                          activityDetailsId: 1,
                          avgRating: 1,
                        },
                      },
                    ],
                    as: "otherReview",
                  },
                },
                {
                  $addFields: {
                    reviewRating: { $sum: { $avg: "$otherReview.avgRating" } },
                  },
                },
                {
                  $addFields: {
                    totalReview: { $size: "$otherReview" },
                  },
                },
                {
                  $lookup: {
                    from: "languages",
                    localField: "languageId",
                    foreignField: "_id",
                    pipeline: [
                      {
                        $project: {
                          _id: 0,
                          name: 1,
                        },
                      },
                    ],
                    as: "language",
                  },
                },
                {
                  $unwind: {
                    path: "$language",
                    preserveNullAndEmptyArrays: true,
                  },
                },
                {
                  $lookup: {
                    from: "countries",
                    localField: "countryId",
                    foreignField: "_id",
                    pipeline: [
                      {
                        $project: {
                          _id: 1,
                          name: 1,
                        },
                      },
                    ],
                    as: "country",
                  },
                },
                {
                  $unwind: {
                    path: "$country",
                    preserveNullAndEmptyArrays: true,
                  },
                },
                // {
                //   $lookup: {
                //     from: "wishlists",
                //     localField: "_id",
                //     foreignField: "activityId",
                //     pipeline: [
                //       {
                //         $project: {
                //           _id: 1,
                //           folderId: 1,
                //         },
                //       },
                //     ],
                //     as: "wishlist",
                //   },
                // },
                // {
                //   $unwind: {
                //     path: "$wishlist",
                //     preserveNullAndEmptyArrays: true,
                //   },
                // },

                {
                  $project: {
                    image: 1,
                    country: 1,
                    slug: 1,
                    currency: 1,
                    activityTitle: 1,
                    tourDuration: 1,
                    startDate: 1,
                    endDate: 1,
                    reviewRating: 1,
                    totalReview: 1,
                    language: "$language.name",
                    currency: 1,
                    // wishlist: 1,
                    discountPercent: 1,
                    calculateStartDate: 1,
                    calculatedEndDate: 1,
                    activityAdultPrice: 1,
                    discountPrice: 1,
                    activitydiscountedPrice: 1,
                    durationInSeconds: 1,
                  },
                },
              ],
              as: "activity",
            },
          },
          {
            $unwind: {
              path: "$activity",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "carttimechecks",
              localField: "_id",
              foreignField: "cartId",
              as: "cartTime",
            },
          },
          {
            $unwind: {
              path: "$cartTime",
              preserveNullAndEmptyArrays: true,
            },
          },

          {
            $project: {
              _id: 1,
              activity: 1,
              currentStatus: 1,
              totalPerson: 1,
              totalPrice: 1,
              statingTime: 1,
              bookedOn: 1,
              participentType: 1,
              timeAfter10Mint: "$cartTime.timeAfter10Minutes",
            },
          },
        ],

        as: "cart_activity",
      },
    },
    {
      $lookup: {
        from: "giftcards",
        localField: "_id",
        foreignField: "userId",
        pipeline: [
          {
            $lookup: {
              from: "activitydetails",
              localField: "activityId",
              foreignField: "_id",
              as: "activitys",
            },
          },
          {
            $unwind: {
              path: "$activitys",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              amount: 1,
              giftCode: 1,
              giftApplyLink: 1,
              personalMsg: 1,
              expirationDate: 1,
              activityId: "$activitys._id",
              activityName: "$activitys.activityTitle",
              activityImage: { $arrayElemAt: ["$activitys.image", 0] },
              activityCurrency: "$activitys.currency",
            },
          },
        ],

        as: "cart_giftcard",
      },
    },

    {
      $project: {
        _id: 0,
        cart_activity: 1,
        cart_giftcard: 1,
      },
    },
  ])
    .then(async (data) => {
      console.log("data", data);
      data[0].cart_activity.forEach(async (ele) => {
        console.log("ele", ele);
        var check = await Availablity.findOne({
          activityDetailsId: ele._id,
          tourDate: ele.bookedOn,
          time: ele.statingTime,
          remeningUser: { $gte: ele.totalPerson },
        }).exec();

        console.log({ check });
        if (check != null) {
          await CartTimeCheck.findOne({
            userId: req.user._id,
            activityId: check.activityDetailsId,
            bookDateFor: check.tourDate,
            bookTimeFor: check.time,
          })
            .then(async (result) => {
              console.log({ result });

              if (result != null || result != "") {
                const formattedDate = convertDate(new Date());
                console.log("hiiii");
                if (formattedDate === result.currentDate) {
                  console.log("hello");
                  const currentTime = new Date();
                  if (
                    currentTime.toLocaleTimeString() > result.timeAfter10Minutes
                  ) {
                    console.log("cartupdate");
                    await Cart.findOneAndUpdate(
                      { _id: ele._id },
                      {
                        $set: {
                          currentStatus: "unavailable",
                        },
                      },
                      { new: true }
                    ).exec();
                  } else {
                    console.log("avail");
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
                  console.log("unava");
                  Cart.findOneAndUpdate(
                    { _id: ele._id },
                    {
                      $set: {
                        currentStatus: "unavailable",
                      },
                    },
                    { new: true }
                  ).exec();
                }
              }
            })
            .catch((error) => { });
        } else {
          Cart.findOneAndUpdate(
            { _id: ele._id },
            {
              $set: {
                currentStatus: "unavailable",
              },
            },
            { new: true }
          ).exec();
        }
      });
      res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Get all cart data",
        data: data[0],
        // data: newdata,
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

const receivedGiftCart = async (req, res) =>{
  try {
    console.log("user dara",req.user);
    const userEmail = req.user.email;
    const userReceivedGift = await cartHistory.aggregate([
      {
        $match:{
          receiverEmail:userEmail,
          sendToMail: true,
          isRedeemed: false,
          isDeleted: false,
          amount: {$gt: 0},
          expirationDate: {
            $gte: moment.utc(new Date()).startOf("date").toDate(),
          },
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "senderId",
          foreignField: "_id",
          as: "userDetails",
          pipeline:[
            {
              $match:{
                isDeleted:false
              }
            }
          ]
        }
      },
      {
        $unwind:"$userDetails"
      },
      {
        $addFields:{
          firstName:"$userDetails.firstName",
          lastName:"$userDetails.lastName"

        }
      },
      {
        $project:{
          userDetails:0
        }
      }
    ])
    if(userReceivedGift.length> 0){
      res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "User Received Gift fetched successfully",
        data: userReceivedGift
      })
    }else{
      res.status(ResponseCode.errorCode.dataNotFound).json({
        status: false,
        message: "No such gift card exist"
      })
    }
  } catch (error) {
    console.log("error in received gift",error);
    const errors = DBerror(error);
    res.status(ResponseCode.errorCode.serverError).json({
      status: false,
      message: "Server error, Please try again later",
      error: error,
    });
    
  }
}





module.exports = {
  addCart,
  getCart,
  updateCart,
  deleteCart,
  addCardToCart,
  receivedGiftCart
};
