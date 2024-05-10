const mongoose = require("mongoose");
const specialOfferModel = require("../../Models/specialOffer");
const newSpecialOffer = require("../../Models/newSpecialOffer");
const activityDetails = require("../../Models/activityDetails");
const notificationModel = require("../../Models/notification");

const User = require("../../Models/user");
const ResponseCode = require("../../service/responseCode");
const { PutObjectRequestFilterSensitiveLog } = require("@aws-sdk/client-s3");
const { DBerror, InputError } = require("../../service/errorHandeler");
var request = require("request");
const SecretKey =
  "key=AAAA6-brgqU:APA91bFVDR2FmnNTPjzcWCCF6KtFWVUJx_gak-G9_BRnEzBWPNTCTMUfTd5MW7KaDUNvM6gI3qF0VEhXZpDC_j35batDjqsgURZ_bRkQ4HeQk5qqbUxHazXplO3jQSUfrJoBg3deeu0P";

const calculateActivity = async (specialOfferId) => {

  console.log("inside function")

  await specialOfferModel.findOne({ _id: new mongoose.Types.ObjectId(specialOfferId) }).then((data) => {

    console.log("data", data)

    if (data.activityDetailsId) {

      console.log("data exist")
      data.activityDetailsId.forEach(async (activityDetail) => {
        // console.log("activityDetail", activityDetail);
        // console.log("data", data);
        var activitydet = await activityDetails
          .findOne({ _id: new mongoose.Types.ObjectId(activityDetail) })
          .exec();

        const discountAmount =
          (activitydet.activityActualPrice * data.discountPercentage) / 100;
        const discountChildAmount =
          (activitydet.actualChildPrice * data.discountPercentage) / 100;
        const discountedPrice =
          activitydet.activityActualPrice - discountAmount;
        const discountedChildPrice =
          activitydet.actualChildPrice - discountChildAmount;

        activitydet.participentType.forEach((participantType) => {
          // console.log("participantType",participantType);
          const discPrice =
            participantType.price -
            (participantType.price * data.discountPercentage) / 100;
          participantType.discountPrice = discPrice;
          // console.log("discPrice", participantType.discountPrice);
        });

        await activityDetails.findOneAndUpdate(
          { _id: new mongoose.Types.ObjectId(activityDetail) },
          {
            $set: {
              specialOfferId: data._id,
              activityDiscountPrice: discountedPrice,
              discountChildPrice: discountedChildPrice,
              participentType: activitydet.participentType,
            },
          },
          {
            new: true,
          }
        );
      });

      console.log("success")
      // res.status(ResponseCode.errorCode.success).json({
      //   status: true,
      //   message: "Offer Against Activity updated sucessfully",
      // });
    }
    else {

      console.log("not")


      // res.status(ResponseCode.errorCode.success).json({
      //   status: false,
      //   message: "Offer Against Activity not updated sucessfully",
      // });


    }


  }).catch((error) => {
    console.log("failure")

    // const errors = DBerror(error);
    // return res.status(ResponseCode.errorCode.serverError).json({
    //   status: false,
    //   message: "Server error,Please try again",
    //   error: error,
    // });

  })

}


const createSpecialOffer = async (req, res) => {

  // console.log(req.body);

  try {

    // const name = req.body.offerType
    // if (["limitedTimeOffer", "earlyBirdOffer", "lastMinuteOffer"].indexOf(name) == -1) {
    //   return res.status(400).json({
    //     status: false,
    //     msg: "offerType name spelling is not maintain properLy ,limitedTimeOffer or earlyBirdOffer or lastMinuteOffer ",

    //   })
    // }

    const offerData = {
      ...req.body,
      addedById: req.user._id,
      visibleStatus: true,
      isApproval: true,
      addedBy: "admin",
    };

    const { value, unit } = offerData.duration;
    let durationInMillis;
    if (unit === "hours") {
      durationInMillis = value * 60 * 60 * 1000;
    } else if (unit === "days") {
      durationInMillis = value * 24 * 60 * 60 * 1000;
    }
    else if (unit === "minutes") {
      durationInMillis = value * 60 * 1000;
    }
    const startDate = new Date(offerData.startDate);
    const endDate = new Date(startDate.getTime() + durationInMillis);
    offerData.endDate = endDate;

    new specialOfferModel(offerData)
      .save()
      .then(async (data) => {
        // console.log("data",data);
        if (data.activityDetailsId) {
          data.activityDetailsId.forEach(async (activityDetail) => {
            // console.log("activityDetail", activityDetail);
            // console.log("data", data);
            var activitydet = await activityDetails
              .findOne({ _id: new mongoose.Types.ObjectId(activityDetail) })
              .exec();

            console.log("activity data===", activitydet);

            if (!activitydet) {
              console.error("Activity details not found for ID:", activityDetail);
              return; // Skip to the next activityDetail
            }

            const discountAmount =
              (activitydet.activityActualPrice * data.discountPercentage) / 100;
            const discountChildAmount =
              (activitydet.actualChildPrice * data.discountPercentage) / 100;
            const discountedPrice =
              activitydet.activityActualPrice - discountAmount;
            const discountedChildPrice =
              activitydet.actualChildPrice - discountChildAmount;

            activitydet.participentType.forEach((participantType) => {
              // console.log("participantType",participantType);
              const discPrice =
                participantType.price -
                (participantType.price * data.discountPercentage) / 100;
              participantType.discountPrice = discPrice;
              // console.log("discPrice", participantType.discountPrice);
            });

            await activityDetails.findOneAndUpdate(
              { _id: new mongoose.Types.ObjectId(activityDetail) },
              {
                $set: {
                  specialOfferId: data._id,
                  activityDiscountPrice: discountedPrice,
                  discountChildPrice: discountedChildPrice,
                  participentType: activitydet.participentType,
                },
              },
              {
                new: true,
              }
            );
          });

          // Save notification data
          const notificationData = {
            userId: req.user._id, // Assuming you want to use req.user._id
            title: 'Special Offer',
            description: 'New offer added',
            notification_type: 'special_offer',
          };

          const savedNotification = await new notificationModel(notificationData).save();
          console.log("saved notification data is", savedNotification);

          User.aggregate([
            {
              $match: {
                dealsStatus: true,
                deviceToken: { $exists: true }
              }
            },
            {
              $project: {
                deviceToken: 1,
              },
            },
          ])
            .then(async (data) => {

              // console.log({data})

              for (let i of data) {

                // console.log("special offer data====",i)

                var options = {
                  method: "POST",
                  url: "https://fcm.googleapis.com/fcm/send",
                  headers: {
                    "content-type": "application/json",
                    Authorization: SecretKey,
                  },
                  body: JSON.stringify({
                    registration_ids: [i.deviceToken],
                    priority: "high",
                    data: {},
                    notification: {
                      title: "Special offer",
                      body: `New Offer added`,
                      vibrate: 1,
                      sound: 1,
                      show_in_foreground: true,
                      priority: "high",
                      content_available: true,
                    },
                  }),
                };

              }

              request(options, function (error, response) {
                if (error) throw new Error(error);
                console.log(response.body);
              });

              res.status(ResponseCode.errorCode.success).json({
                status: true,
                message: "offer Against Activity create sucessfully",
              });
            })
            .catch((error) => {
              console.log(error);

              // return res.status(500).json({
              //   status: false,
              //   message: "sever error",
              // });
            });




        }
      })
      .catch((error) => {
        console.log("error is", error);
        const errors = DBerror(error);
        return res.status(ResponseCode.errorCode.serverError).json({
          status: false,
          message: "Server error,Please try again",
          error: error,
        });
      });




  } catch (error) {
    res.status(ResponseCode.errorCode.serverError).json({
      status: false,
      message: "Server error,Please try again",
      error: error.message,
    });

  }


};

const singleSpecialOffer = async (req, res) => {
  await specialOfferModel
    .aggregate([
      {
        $match: {
          isDeleted: false,
          isApproval: true,
          visibleStatus: true,
          rejectedStatus: false,
          addedById: new mongoose.Types.ObjectId(req.user._id),
          _id: new mongoose.Types.ObjectId(req.params.id),
        },
      },
      {
        $project: {
          status: 0,
          isDeleted: 0,
          createdOn: 0,
          updatedOn: 0,
          __v: 0,
        },
      },
    ])
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "single offer fatch successfully",
        data: data[0],
      });
    })
    .catch((error) => {
      const errors = DBerror(error);
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error,Please try again",
        error: error,
      });
    });
};

const viewSpecialOffer1 = async (req, res) => {
  const { offer_type } = req.params
  console.log("offer_type===",offer_type);
  const currentDate = new Date();
  console.log("current data",currentDate);
  let matchCondition = {
    isDeleted: false,
    isApproval: true,
    rejectedStatus: false,
    visibleStatus: true,
  }
  if (offer_type) {
    if (offer_type === 'active ') {
      console.log("end data is ==",matchCondition.endDate);
      matchCondition.endDate = { $gte: currentDate };
      // matchCondition['endDate'] = { $gte: currentDate };
    } else if (offer_type === 'unactive') {
      matchCondition.isDeletedendDate = { $lt: currentDate };
      // matchCondition['endDate'] = { $lt: currentDate };
    } 
  }
  await specialOfferModel
    .aggregate([
      {
        // $match: {
        //   isDeleted: false,
        //   isApproval: true,
        //   rejectedStatus: false,
        //   visibleStatus: true,
        // },
        $match: matchCondition
      },
      // {
      //   $addFields: {
      //     endDate: "$endDate"
      //   }
      // },
      {
        $project: {
          addedById: 0,
          status: 0,
          isDeleted: 0,
          createdOn: 0,
          updatedOn: 0,
          __v: 0,
        },
      },
    ])
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "get all offer fatch successfully",
        data: data.length,
      });
    })
    .catch((error) => {
      const errors = DBerror(error);
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error,Please try again",
        error: error,
      });
    });
};

const viewSpecialOffer = async (req, res) => {
  const { offer_type } = req.params;
  const currentDate = new Date();
  let matchCondition = {
    isDeleted: false,
    isApproval: true,
    rejectedStatus: false,
    visibleStatus: true,
  };

  if (offer_type) {
    if (offer_type === 'active') {
      matchCondition.endDate = { $gte: currentDate };
    } else if (offer_type === 'unactive') {
      matchCondition.endDate = { $lt: currentDate };
    } 
  }

  try {
    const data = await specialOfferModel
      .find(matchCondition)
      .select({
        addedById: 0,
        status: 0,
        isDeleted: 0,
        createdOn: 0,
        updatedOn: 0,
        __v: 0,
      });

    return res.status(ResponseCode.errorCode.success).json({
      status: true,
      message: "Get all offers successfully",
      data: data,
    });
  } catch (error) {
    const errors = DBerror(error);
    return res.status(ResponseCode.errorCode.serverError).json({
      status: false,
      message: "Server error, please try again",
      error: errors,
    });
  }
};


const editSpecialOffer = async (req, res) => {
  try {
    const offerData = {
      ...req.body
    }
    const { value, unit } = offerData.duration;
    let durationInMillis;
    if (unit === "hours") {
      durationInMillis = value * 60 * 60 * 1000;
    } else if (unit === "days") {
      durationInMillis = value * 24 * 60 * 60 * 1000;
    }
    else if (unit === "minutes") {
      durationInMillis = value * 60 * 1000;
    }
    const startDate = new Date(offerData.startDate);
    const endDate = new Date(startDate.getTime() + durationInMillis);
    offerData.endDate = endDate;

    const specialOffer = await specialOfferModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(req.params.id) },
      { ...offerData, updatedOn: new Date() },
      { new: true }
    );
    specialOffer.activityDetailsId.forEach(async (activityDetail) => {
      const activity = await activityDetails
        .findOne({ _id: activityDetail })
        .exec();
      const discountAmount =
        (activity.activityActualPrice * specialOffer.discountPercentage) / 100;
      const discountedPrice = activity.activityActualPrice - discountAmount;
      const discountChildAmount =
        (activity.actualChildPrice * specialOffer.discountPercentage) / 100;
      const discountedChildPrice =
        activity.actualChildPrice - discountChildAmount;

      activity.participentType.forEach((participantType) => {
        // console.log("participantType",participantType);
        const discPrice =
          participantType.price -
          (participantType.price * specialOffer.discountPercentage) / 100;
        participantType.discountPrice = discPrice;
        // console.log("discPrice", participantType.discountPrice);
      });

      await activityDetails.findOneAndUpdate(
        { _id: activityDetail },
        {
          $set: {
            specialOfferId: specialOffer._id,
            activityDiscountPrice: discountedPrice,
            discountChildPrice: discountedChildPrice,
            participentType: activity.participentType,
          },
        }
      );
    });

    res.status(ResponseCode.errorCode.success).json({
      status: true,
      message: "Offer updated successfully",
    });
  } catch (err) {
    const errors = DBerror(err);
    res.status(ResponseCode.errorCode.serverError).json({
      status: false,
      message: "Server error, please try again",
      error: errors,
    });
  }
};

const deleteSpecialOffer = async (req, res) => {
  console.log(req.params);
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(ResponseCode.errorCode.requiredError).json({
      status: false,
      error: "Invalid ID",
    });
  } else {
    await specialOfferModel
      .findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(req.params.id) },
        { isDeleted: true, visibleStatus: false }
      )
      .then(async (data) => {
        if (data) {
          data.activityDetailsId.forEach(async (activityDetail) => {
            // console.log("activityDetail", activityDetail);
            await activityDetails.findOneAndUpdate(
              { _id: new mongoose.Types.ObjectId(activityDetail) },

              {
                $set: {
                  specialOfferId: null,
                  activityDiscountPrice: 0,
                  "participentType.$[].discountPrice": 0,
                },
              }
            );
          });
          res.status(ResponseCode.errorCode.success).json({
            status: true,
            message: "offer deleted sucessfully",
          });
        }
      })
      .catch((error) => {
        const errors = DBerror(error);
        return res.status(ResponseCode.errorCode.serverError).json({
          status: false,
          message: "Server error,Please try again",
          error: errors,
        });
      });
  }
};

const viewMerchantApprovalSpecialOffer = async (req, res) => {
  await specialOfferModel
    .aggregate([
      {
        $match: {
          addedBy: "merchant",
          isDeleted: false,
          // isApproval: false,
          // visibleStatus: false,
          // rejectedStatus: false,
          // saveAsDraft: false,
        },
      },
      {
        $sort: {
          createdOn: -1
        }
      },
      {
        $project: {
          __v: 0,
          updatedOn: 0,
          isDeleted: 0,
        },
      },
    ])
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "get all offer approval request fetch successfully",
        data: data,
      });
    })
    .catch((error) => {
      const errors = DBerror(error);
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error,Please try again",
        error: error,
      });
    });
};

const approvalOfSpecialOfferstatus = async (req, res) => {
  if (req.body.isApproval == true && req.body.rejectedStatus == false) {
    console.log("hiiii")
    if (req.body.updatedStatus == true) {
      console.log("1")

      specialOfferModel
        .findOneAndUpdate(
          {
            _id: new mongoose.Types.ObjectId(req.body.specialOfferId),
          },
          { ...req.body, updatedStatus: false, updatedOn: new Date() }
        )
        .exec();

      // specialOfferModel
      //   .deleteOne({
      //     _id: new mongoose.Types.ObjectId(req.params.id),
      //   })
      //   .exec();

      calculateActivity(req.body.specialOfferId);



    } else {

      console.log("2")

      specialOfferModel
        .findOneAndUpdate(
          {
            _id: new mongoose.Types.ObjectId(req.params.id),
          },
          { ...req.body, updatedOn: new Date() }
        )
        .exec();

      calculateActivity(req.body.id);

    }


    res.status(ResponseCode.errorCode.success).json({
      status: true,
      message: "Offer Against Activity updated sucessfully",
    });





  } else if (req.body.isApproval == false && req.body.rejectedStatus == true) {
    // if (req.body.updatedStatus == true) {
    specialOfferModel
      .findOneAndUpdate(
        {
          _id: new mongoose.Types.ObjectId(req.params.id),
        },
        { ...req.body, updatedOn: new Date() }
      ).then(async (data) => {
        return res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "Successfully send approval for special offer to merchant"
        });
      })
      .catch((error) => {
        const errors = DBerror(error);
        return res.status(ResponseCode.errorCode.serverError).json({
          status: false,
          message: "Server error,Please try again",
          error: error,
        });
      });

  }



  //   await specialOfferModel
  //     .findOneAndUpdate(
  //       {
  //         _id: new mongoose.Types.ObjectId(req.params.id),
  //       },
  //       {
  //         ...req.body,
  //         updatedOn: new Date(),
  //       },
  //       {
  //         new: true,
  //       }
  //     )
  //     .then(async (data) => {
  //       return res.status(ResponseCode.errorCode.success).json({
  //         status: true,
  //         message: "Special offer updated successfully",
  //       });
  //     })
  //     .catch((error) => {
  //       const errors = DBerror(error);
  //       return res.status(ResponseCode.errorCode.serverError).json({
  //         status: false,
  //         message: "Server error,Please try again",
  //         error: error,
  //       });
  //     });
};

module.exports = {
  createSpecialOffer,
  singleSpecialOffer,
  viewSpecialOffer,
  editSpecialOffer,
  deleteSpecialOffer,
  viewMerchantApprovalSpecialOffer,
  approvalOfSpecialOfferstatus,
};
