const mongoose = require("mongoose");
const specialOfferModel = require("../../Models/specialOffer");
const newSpecialOffer = require("../../Models/newSpecialOffer");
const activityDetails = require("../../Models/activityDetails");
const newActivityDetails = require("../../Models/newActivityDetails");
const ResponseCode = require("../../service/responseCode");
const { DBerror, InputError } = require("../../service/errorHandeler");
const { PutObjectRequestFilterSensitiveLog } = require("@aws-sdk/client-s3");



// const createSpecialOffer =async(req,res)=>{
//   const offerData = {
//     ...req.body,
//     addedById: req.user._id,
//     isApproval:false,
//     visibleStatus:false,
//     addedBy: "merchant",
//     createdOn:new Date()
//   };
//   const { value, unit } = offerData.duration;
//   let durationInMillis;
//   if (unit === "hours") {
//     durationInMillis = value * 60 * 60 * 1000;
//   } else if (unit === "days") {
//     durationInMillis = value * 24 * 60 * 60 * 1000;
//   }
//   const startDate = new Date(offerData.startDate);
//   const endDate = new Date(startDate.getTime() + durationInMillis);
//   offerData.endDate = endDate;
//   new specialOfferModel(offerData).save().then(async (data) => {
//     const newOfferData={
//       ...req.body,
//       specialOfferId:data._id,
//       merchantId:data.addedById,
//       isApproval:data.isApproval,
//       addedBy:data.addedBy
//     }
//     new newSpecialOffer(newOfferData).save().then((data)=>{
//       if (data.activityDetailsId) {
//         data.activityDetailsId.forEach(async (activityDetail) => {
//           // console.log("activityDetail", activityDetail);
//           // console.log("data", data);
//           var activitydet = await activityDetails
//             .findOne({ _id: new mongoose.Types.ObjectId(activityDetail) })
//             .exec();

//           const discountAmount =
//             (activitydet.activityActualPrice * data.discountPercentage) / 100;
//           const discountChildAmount =
//             (activitydet.actualChildPrice * data.discountPercentage) / 100;
//           const discountedPrice =
//             activitydet.activityActualPrice - discountAmount;
//           const discountedChildPrice =
//             activitydet.actualChildPrice - discountChildAmount;

//           activitydet.participentType.forEach((participantType) => {
//             // console.log("participantType",participantType);
//             const discPrice =
//               participantType.price -
//               (participantType.price * data.discountPercentage) / 100;
//             participantType.discountPrice = discPrice;
//             // console.log("discPrice", participantType.discountPrice);
//           });
//           await newActivityDetails.findOneAndUpdate(
//             { _id: new mongoose.Types.ObjectId(activityDetail) },
//             {
//               $set: {
//                 specialOfferId: data._id,
//                 activityDiscountPrice: discountedPrice,
//                 discountChildPrice: discountedChildPrice,
//                 participentType: activitydet.participentType,
//               },
//             },
//             {
//               new: true,
//             }
//           );
//         });
//         res.status(ResponseCode.errorCode.success).json({
//           status: true,
//           message: "offer Against Activity create sucessfully",
//         });
//         }
//       })

//     }).catch((error)=>{

//       const errors = DBerror(error);
//       return res.status(ResponseCode.errorCode.serverError).json({
//         status: false,
//         message: "Server error, please try again",
//         error: errors,
//       });
//     })

//     }

const createSpecialOffer = async (req, res) => {

  try {
    //  const name = req.body.offerType 
    //  if(["limitedTimeOffer" ,"earlyBirdOffer" ,"lastMinuteOffer"].indexOf(name) == -1){
    //   return res.status(400).json({
    //     status:false , 
    //     msg:"offerType name spelling is not maintain properLy ,limitedTimeOffer or earlyBirdOffer or lastMinuteOffer " ,
        
    //   })
    //  }

     const offerData = {
      ...req.body,
      addedById: req.user._id,
      isApproval: false,
      visibleStatus: false,
      addedBy: "merchant",
      createdOn: new Date(),
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
  
      .then((data) => {
        return res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "Request for special offer is send successfully",
        });
      })
      .catch((error) => {
        console.log(error);
        return res.status(ResponseCode.errorCode.serverError).json({
          status: false,
          message: "Server error,Please try again",
          error: error,
        });
      });
      


  }catch(error) {
    console.log(error);
        return res.status(ResponseCode.errorCode.serverError).json({
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
          addedById: req.user._id,
          _id: new mongoose.Types.ObjectId(req.params.id),
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
                pipeline: [
                  {
                    $project: {
                      cityName: 1,
                      picture: 1,
                    },
                  },
                ],
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
                from: "activitytypes",
                localField: "activityTypesId",
                foreignField: "_id",
                pipeline: [
                  {
                    $project: {
                      name: 1,
                    },
                  },
                ],
                as: "type",
              },
            },
            {
              $unwind: {
                path: "$type",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "activitysites",
                localField: "activitySiteId",
                foreignField: "_id",
                pipeline: [
                  {
                    $project: {
                      siteName: 1,
                      image: 1,
                    },
                  },
                ],
                as: "site",
              },
            },
            {
              $unwind: {
                path: "$site",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "categories",
                localField: "categoryId",
                foreignField: "_id",
                pipeline: [
                  {
                    $project: {
                      categoryName: 1,
                    },
                  },
                ],
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
              $lookup: {
                from: "countries",
                localField: "countryId",
                foreignField: "_id",
                pipeline: [
                  {
                    $project: {
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
                from: "languages",
                localField: "languageId",
                foreignField: "_id",
                pipeline: [
                  {
                    $project: {
                      name: 1,
                      image: 1,
                      slug: 1,
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
              $project: {
                _id: 0,
                cityId: 0,
                activitySiteId: 0,
                activityTypesId: 0,
                countryId: 0,
                categoryId: 0,
                languageId: 0,
                addedByid: 0,
                addedBy: 0,
                isDeleted: 0,
                createdOn: 0,
                updatedOn: 0,
                __v: 0,
              },
            },
          ],
          as: "included_activity",
        },
      },
      {
        $project: {
          status: 0,
          addedById: 0,
          activityDetailsId: 0,
          addedBy: 0,
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
        message: "single offer fetch successfully",
        data: data,
      });
    })
    .catch((error) => {
      console.log(error);
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error,Please try again",
        error: error,
      });
    });
};

const editSpecialOffer = async (req, res) => {
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

  var check = await specialOfferModel
    .findOne({
      specialOfferId: new mongoose.Types.ObjectId(req.params.id),
      isApproval: true,
      visibleStatus: true,
    })
    .exec();

  if (check) {
    specialOfferModel
      .findOneAndUpdate(
        { specialOfferId: new mongoose.Types.ObjectId(req.params.id) },
        {
          ...offerData,
          isApproval: false,
          // visibleStatus: false,
          updatedOn: new Date(),
        }
      )
      .then((data) => {
        res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "update special offer",
        });
      })
      .catch((error) => {
        console.log(error);
        const errors = DBerror(error);
        res.status(ResponseCode.errorCode.serverError).json({
          status: false,
          message: "Server error, please try again",
          error: errors,
        });
      });
  } else {

    res.status(ResponseCode.errorCode.dataNotFound).json({
      status: false,
      message: "data not found or special offer is not approved by admin"
    });
    // new specialOfferModel({
    //   addedById: req.user._id,
    //   specialOfferId: new mongoose.Types.ObjectId(req.params.id),
    //   isApproval: false,
    //   visibleStatus: false,
    //   addedBy: "merchant",
    //   createdOn: new Date(),
    // })
    //   .save()
    //   .then((data) => {
    //     res.status(ResponseCode.errorCode.success).json({
    //       status: true,
    //       message: "Request send for change special offer details",
    //     });
    //   })
    //   .catch((error) => {
    //     console.log("hiii", error);

    //     const errors = DBerror(error);
    //     res.status(ResponseCode.errorCode.serverError).json({
    //       status: false,
    //       message: "Server error, please try again",
    //       error: errors,
    //     });
    //   });
  }
};

const editSpecialOffer1 = async (req, res) => {
  var check = await specialOfferModel
    .findOne({
      _id: new mongoose.Types.ObjectId(req.params.id),
      isApproval: true,
      visibleStatus: true,
    })
    .exec();



  if (check) {

    // console.log("check")
    await specialOfferModel
      .findOne({
        specialOfferId: new mongoose.Types.ObjectId(req.params.id),
        isApproval: false,
        visibleStatus: false,
      }).then((data) => {
        if (data) {

          // console.log("check2")

          res.status(ResponseCode.errorCode.success).json({
            status: true,
            message:
              "You can not update special offer  until previous one is approved by admin",
          });
        } else {

          // console.log("check3")


          const offerData = {
            ...req.body,
            addedById: req.user._id,
            specialOfferId: new mongoose.Types.ObjectId(req.params.id),
            updatedStatus: true,
            isApproval: false,
            visibleStatus: false,
            addedBy: "merchant",
            createdOn: new Date(),
          };
          const { value, unit } = offerData.duration;
          let durationInMillis;
          if (unit === "hours") {
            durationInMillis = value * 60 * 60 * 1000;
          } else if (unit === "days") {
            durationInMillis = value * 24 * 60 * 60 * 1000;
          }
          const startDate = new Date(offerData.startDate);
          const endDate = new Date(startDate.getTime() + durationInMillis);
          offerData.endDate = endDate;

          new specialOfferModel(offerData)
            .save()
            .then((data) => {
              res.status(ResponseCode.errorCode.success).json({
                status: true,
                message: "Request send for change special offer details",
              });
            })
            .catch((error) => {
              // console.log("hiii", error);

              const errors = DBerror(error);
              res.status(ResponseCode.errorCode.serverError).json({
                status: false,
                message: "Server error, please try again",
                error: errors,
              });
            });

        }





      }).catch((error) => {

        const errors = DBerror(error);
        res.status(ResponseCode.errorCode.serverError).json({
          status: false,
          message: "Server error, please try again",
          error: errors,
        });


      })




  } else {
    res.status(ResponseCode.errorCode.success).json({
      status: true,
      message:
        "You can not update special offer  until previous one is approved by admin",
    });
  }
};

// const editSpecialOffer = async (req, res) => {
//   try {
//     const specialOffer = await specialOfferModel.findOneAndUpdate(
//       {
//         _id: new mongoose.Types.ObjectId(req.params.id),
//         addedById: new mongoose.Types.ObjectId(req.user._id)
//       },
//       { ...req.body },
//       { new: true }
//     );

//     specialOffer.activityDetailsId.forEach(async (activityDetail) => {
//       const activity = await activityDetails
//         .findOne({ _id: activityDetail })
//         .exec();
//       const discountAmount =
//         (activity.activityActualPrice * specialOffer.discountPercentage) / 100;
//       const discountedPrice = activity.activityActualPrice - discountAmount;
//       const discountChildAmount =
//         (activity.actualChildPrice * specialOffer.discountPercentage) / 100;
//       const discountedChildPrice =
//         activity.actualChildPrice - discountChildAmount;

//       activity.participentType.forEach((participantType) => {
//         // console.log("participantType",participantType);
//         const discPrice = participantType.price - (participantType.price * specialOffer.discountPercentage) / 100;
//         participantType.discountPrice = discPrice;
//         // console.log("discPrice", participantType.discountPrice);
//       });

//       await activityDetails.findOneAndUpdate(
//         { _id: activityDetail },
//         {
//           $set: {
//             specialOfferId: specialOffer._id,
//             activityDiscountPrice: discountedPrice,
//             discountChildPrice: discountedChildPrice,
//             participentType: activity.participentType,
//           },
//         }
//       );
//     });

//     res.status(ResponseCode.errorCode.success).json({
//       status: true,
//       message: "Offer updated successfully",
//     });
//   } catch (error) {
//     const errors = DBerror(error);
//     res.status(ResponseCode.errorCode.serverError).json({
//       status: false,
//       message: "Server error, please try again",
//       error: errors,
//     });
//   }

// };

const deleteSpecialOffer = async (req, res) => {
  console.log(req.params);
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(ResponseCode.errorCode.requiredError).json({
      status: false,
      error: "Invalid ID",
    });
  } else {
    // var check=await specialOfferModel.findOne({_id:new mongoose.Types.ObjectId(req.params.id)}).exec()
    await specialOfferModel
      .deleteOne(
        {
          _id: new mongoose.Types.ObjectId(req.params.id),
          addedById: req.user._id,
        },
        {
          $set: {
            isDeleted: true,
            visibleStatus: false,
          },
        }
      )
      .then(async (data) => {
        data.activityDetailsId.forEach(async (activityDetail) => {
          console.log("activityDetail", activityDetail);

          let kbc = await activityDetails
            .findOneAndUpdate(
              { _id: new mongoose.Types.ObjectId(activityDetail) },

              {
                $set: {
                  specialOfferId: null,
                  activityDiscountPrice: 0,
                  "participentType.$[].discountPrice": 0,
                },
                updatedOn: new Date(),
              },
              { multi: true }
            )
            .exec();

          // await newActivityDetails
          //   .findOneAndUpdate(
          //     { activityId: new mongoose.Types.ObjectId(activityDetail) },

          //     {
          //       $set: {
          //         specialOfferId: null,
          //         activityDiscountPrice: 0,
          //         "participentType.$[].discountPrice": 0,
          //       },
          //       updatedOn: new Date(),
          //     },
          //     { multi: true }
          //   )
          //   .exec();
        });
        res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "offer deleted sucessfully",
        });
      })
      .catch((error) => {
        const errors = DBerror(error);
        console.log(error);
        return res.status(ResponseCode.errorCode.serverError).json({
          status: false,
          message: "Server error,Please try again",
          error: errors,
        });
      });
  }
};

const viewSpecialOffer = async (req, res) => {
  console.log(req.user._id)
  const { offer_type } = req.params;
console.log("offer_type----",offer_type);
  const currentDate = new Date();
  console.log("currentDate===",currentDate);
  let matchCondition = {
    isDeleted: false,
    addedById: req.user._id,
  };

  if (offer_type) {
    if (offer_type === 'active') {
      matchCondition["endDate"] = { $gte: currentDate };
    } else if (offer_type === 'unactive') {
      matchCondition["endDate"] = { $lt: currentDate };
    } 
  }

  await specialOfferModel
    .aggregate([
      {
        // $match: {
        //   isDeleted: false,
        //   addedById: req.user._id,
        // },
        $match: matchCondition
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
                pipeline: [
                  {
                    $project: {
                      cityName: 1,
                      picture: 1,
                    },
                  },
                ],
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
                from: "activitytypes",
                localField: "activityTypesId",
                foreignField: "_id",
                pipeline: [
                  {
                    $project: {
                      name: 1,
                    },
                  },
                ],
                as: "type",
              },
            },
            {
              $unwind: {
                path: "$type",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "activitysites",
                localField: "activitySiteId",
                foreignField: "_id",
                pipeline: [
                  {
                    $project: {
                      siteName: 1,
                      image: 1,
                    },
                  },
                ],
                as: "site",
              },
            },
            {
              $unwind: {
                path: "$site",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "categories",
                localField: "categoryId",
                foreignField: "_id",
                pipeline: [
                  {
                    $project: {
                      categoryName: 1,
                    },
                  },
                ],
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
              $lookup: {
                from: "countries",
                localField: "countryId",
                foreignField: "_id",
                pipeline: [
                  {
                    $project: {
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
                from: "languages",
                localField: "languageId",
                foreignField: "_id",
                pipeline: [
                  {
                    $project: {
                      name: 1,
                      image: 1,
                      slug: 1,
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
              $project: {
                _id: 0,
                cityId: 0,
                activitySiteId: 0,
                activityTypesId: 0,
                countryId: 0,
                categoryId: 0,
                languageId: 0,
                addedByid: 0,
                addedBy: 0,
                isDeleted: 0,
                createdOn: 0,
                updatedOn: 0,
                __v: 0,
              },
            },
          ],
          as: "included_activity",
        },
      },
      {
        $project: {
          status: 0,
          addedById: 0,
          activityDetailsId: 0,
          addedBy: 0,
          isDeleted: 0,
          createdOn: 0,
          updatedOn: 0,
          __v: 0,
        },
      },
      {
        $sort: {
          _id: -1,
          createdOn: -1,
        },
      },
    ])
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "get all offer fatch successfully",
        data: data  ,
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
  createSpecialOffer,
  singleSpecialOffer,
  viewSpecialOffer,
  editSpecialOffer,
  deleteSpecialOffer,
};
