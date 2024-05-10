const mongoose = require("mongoose")
const availabilityModel = require("../../Models/availability")
const activitydetail = require("../../Models/activityDetails")
const ResponseCode = require("../../service/responseCode");
const tempAvailability = require('../../Models/tempAvailability')
const { DBerror, InputError } = require("../../service/errorHandeler");

var moment = require("moment");

const addAvailability = async (req, res) => {



  const promises = req.body.tourDate.map(async (element) => {
    try {
      console.log({ element });

        const availabilityDataPromises = req.body.timing.map(async (ele) => {
          try {

            const check = await availabilityModel.findOne({
              activityDetailsId: new mongoose.Types.ObjectId(req.body.activityDetailsId),
              tourDate: element,
              time : ele.time,
              createdOn:-1
            }).exec();
      
            console.log( "check>>>>>>>>>>>>>" ,check);
      
            if (check) {
              throw {
                status: ResponseCode.errorCode.dataExist,
                message: "Data already exists for this tour date",
              };
            }
            
            var shift = "";
            // console.log({ ele });


            const timeString = ele;
            const time24Hour = moment(timeString, 'h:mm A').format('HH:mm');

            const morningThreshold = moment('12:00 PM', 'h:mm A').format('HH:mm');
            const afternoonThreshold = moment('5:00 PM', 'h:mm A').format('HH:mm');

            if (moment(time24Hour, 'HH:mm').isBefore(moment(morningThreshold, 'HH:mm'))) {
              console.log("Morning");
              shift = "morning"
            } else if (moment(time24Hour, 'HH:mm').isBefore(moment(afternoonThreshold, 'HH:mm'))) {
              console.log("Afternoon");
              shift = "afternoon"

            } else {
              console.log("Evening");
              shift = "evening"

            }

            const availabilityData = {
              activityDetailsId: req.body.activityDetailsId,
              remeningUser: req.body.remeningUser,
              changePrice: req.body.changePrice,
              shift: shift,
              tourDate: element,
              addedById: req.user._id,
              time: ele.time,
              cutoffTime: ele.cutoffTime,
              isApprove:false
            };

            return new availabilityModel(availabilityData).save();
          } catch (innerError) {
            // Handle errors from inner async operations here
            console.error("Error in inner async operation:", innerError);
            throw innerError;
          }
        });

        return Promise.all(availabilityDataPromises);
      
    } catch (error) {
      // Handle errors from the outer async operation here
      console.error("Error in outer async operation:", error);
      throw error;
    }
  });

  Promise.all(promises)
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Availability added successfully",
        data:data
      });
    })
    .catch((error) => {
      return res.status(error.status || 500).json({
        status: false,
        message: error.message || "An error occurred",
      });
    });


  // const promises = req.body.tourDate.map(async (element) => {
  //   console.log({ element });
  //   const check = await availabilityModel
  //     .findOne({
  //       activityDetailsId: new mongoose.Types.ObjectId(
  //         req.body.activityDetailsId
  //       ),
  //       tourDate: element,
  //     })
  //     .exec();

  //   console.log({ check });

  //   if (check) {
  //     return Promise.reject({
  //       status: ResponseCode.errorCode.dataExist,
  //       message: "Data are added except existing one",
  //     });
  //   } else {
  //     const availabilityDataPromises =timing.map(async (ele) => {
  //       var shift = "";
  //       console.log({ ele });

  //       const timeString = ele;
  //       const time24Hour = moment(timeString, "h:mm A").format("HH:mm");

  //       const morningThreshold = moment("12:00 PM", "h:mm A").format("HH:mm");
  //       const afternoonThreshold = moment("5:00 PM", "h:mm A").format("HH:mm");

  //       if (
  //         moment(time24Hour, "HH:mm").isBefore(
  //           moment(morningThreshold, "HH:mm")
  //         )
  //       ) {
  //         console.log("Morning");
  //         shift = "morning";
  //       } else if (
  //         moment(time24Hour, "HH:mm").isBefore(
  //           moment(afternoonThreshold, "HH:mm")
  //         )
  //       ) {
  //         console.log("Afternoon");
  //         shift = "afternoon";
  //       } else {
  //         console.log("Evening");
  //         shift = "evening";
  //       }

  //       const availabilityData = {
  //         activityDetailsId: req.body.activityDetailsId,
  //         remeningUser: req.body.remeningUser,
  //         changePrice: req.body.changePrice,
  //         shift: shift,
  //         tourDate: element,
  //         addedById: req.user._id,
  //         time: ele.time,
  //         cutoffTime: ele.cutoffTime,
  //       };

  //       return new availabilityModel(availabilityData).save();
  //     });

  //     return Promise.all(availabilityDataPromises);
  //   }
  // });

  // Promise.all(promises)
  //   .then(() => {
  //     return res.status(ResponseCode.errorCode.success).json({
  //       status: true,
  //       message: "Availability added successfully",

  //     });
  //   })
  //   .catch((error) => {
  //     return res.status(error.status).json({
  //       status: false,
  //       message: error.message,
  //     });
  //   });
};

// const addAvailability = async (req, res) => {

//     var check = await availabilityModel
//       .findOne({
//         activityDetailsId: new mongoose.Types.ObjectId(
//           req.body.activityDetailsId
//         ),
//         addedById: req.user._id,
//         tourDate: req.body.tourDate,
//       })
//       .exec();

//     if (check) {
//       return res.status(ResponseCode.errorCode.dataExist).json({
//         status: false,
//         message: "data exist",
//       });

//     } else {



//       req.body.timimg.forEach(ele => {
//         var shift=""
//         // console.log(ele)

//         const timeString = ele;
//         const time24Hour = moment(timeString, 'h:mm A').format('HH:mm');

//         const morningThreshold = moment('12:00 PM', 'h:mm A').format('HH:mm');
//         const afternoonThreshold = moment('5:00 PM', 'h:mm A').format('HH:mm');

//         if (moment(time24Hour, 'HH:mm').isBefore(moment(morningThreshold, 'HH:mm'))) {
//           console.log("Morning");
//           shift="morning"
//         } else if (moment(time24Hour, 'HH:mm').isBefore(moment(afternoonThreshold, 'HH:mm'))) {
//           console.log("Afternoon");
//           shift="afternoon"

//         } else {
//           console.log("Evening");
//           shift="evening"

//         }


//         const availabilityData = {
//           ...req.body,
//           shift:shift,
//           addedById: req.user._id,
//           time: ele.time,
//           cutoffTime:ele.cutoffTime

//         };
//         new availabilityModel(availabilityData)
//           .save()

//       });


//       return res.status(ResponseCode.errorCode.success).json({
//         status: true,
//         message: "Availability added successfully",
//       });


//     }
//   };

const editAvailability000 = async (req, res) => {

  availabilityModel.findOneAndUpdate({ _id: new mongoose.Types.ObjectId(req.params.id) },
  {
    $set:{
      isApprove:false
    }
  }
  )
    // { ...req.body,
    //  })

    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Update availability",

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

}
// const viewAvalability = async (req, res) => {

//     availabilityModel.aggregate([
//         {
//             $match: {
//                 isDeleted: false,
//                 activityDetailsId: new mongoose.Types.ObjectId(req.params.id),
//                 tourDate: {
//                     : moment.utc(req.body.tourDate).startOf("date").toDate(),
//                     $lte: moment.utc(req.body.tourDate).endOf("date").toDate(),
//                   },
//                 addedById:req.user._id
//             }
//         },
//         {
//             $lookup: {
//                 from: "activitydetails",
//                 localField: "activityDetailsId",
//                 foreignField: "_id",
//                 pipeline: [
//                     {
//                         $lookup: {
//                             from: "specialoffers",
//                             localField: "specialOfferId",
//                             foreignField: "_id",
//                             as: "offerDetails",
//                         },
//                     },
//                     {
//                         $unwind: { path: "$offerDetails", preserveNullAndEmptyArrays: true },
//                     },
//                     {
//                         $lookup: {
//                             from: "categories",
//                             localField: "categoryId",
//                             foreignField: "_id",
//                             as: "catDetails",
//                         },
//                     },
//                     {
//                         $unwind: { path: "$catDetails", preserveNullAndEmptyArrays: true },
//                     },
//                     {
//                         $lookup: {
//                             from: "languages",
//                             localField: "languageId",
//                             foreignField: "_id",
//                             as: "langDetails",
//                         },
//                     },
//                     {
//                         $unwind: { path: "$langDetails", preserveNullAndEmptyArrays: true },
//                     },

//                     {
//                         $lookup: {
//                             from: "activitytypes",
//                             localField: "activityTypesId",
//                             foreignField: "_id",
//                             as: "activitytypeDetails",
//                         },
//                     },
//                     {
//                         $unwind: {
//                             path: "$activitytypeDetails",
//                             preserveNullAndEmptyArrays: true,
//                         },
//                     },
//                     {
//                         $lookup: {
//                             from: "sections",
//                             localField: "sectionId",
//                             foreignField: "_id",
//                             as: "sectionsDetails",
//                         },
//                     },
//                     {
//                         $unwind: { path: "$sectionsDetails", preserveNullAndEmptyArrays: true },
//                     },
//                     {
//                         $lookup: {
//                             from: "activitysites",
//                             localField: "activitySiteId",
//                             foreignField: "_id",
//                             as: "activitysiteDetails",
//                         },
//                     },
//                     {
//                         $unwind: {
//                             path: "$activitysiteDetails",
//                             preserveNullAndEmptyArrays: true,
//                         },
//                     },
//                     {
//                         $lookup: {
//                             from: "cities",
//                             localField: "cityId",
//                             foreignField: "_id",
//                             as: "citiDetails",
//                         },
//                     },
//                     {
//                         $unwind: { path: "$citiDetails", preserveNullAndEmptyArrays: true },
//                     },

//                     {
//                         $lookup: {
//                             from: "countries",
//                             localField: "countryId",
//                             foreignField: "_id",
//                             as: "country",
//                         },
//                     },
//                     {
//                         $unwind: { path: "$country", preserveNullAndEmptyArrays: true },
//                     },

//                     {
//                         $addFields: {
//                             specialOfferName: "$offerDetails.specialOfferName",
//                             discountPercentage: "$offerDetails.discountPercentage",
//                             cityName: "$citiDetails.cityName",
//                             countryName: "$country.name",
//                             activitySiteName: "$activitysiteDetails.siteName",
//                             sectionTitle: "$sectionsDetails.sectionTitle",
//                             activitytypeName: "$activitytypeDetails.name",
//                             language: "$langDetails.name",
//                             catDetails: "$catDetails.categoryName",
//                         },
//                     },
//                     {
//                         $project: {
//                             specialOfferName:1,
//                             discountPercentage: 1,
//                             cityName: 1,
//                             countryName:1,
//                             activitySiteName: 1,
//                             sectionTitle:1,
//                             activitytypeName: 1,
//                             language:1,
//                             catDetails: 1,
//                             slug:1,
//                             referenceCode:1,
//                             activityTitle:1,
//                             activityDiscountPrice:1,
//                             description:1,
//                             image:1,
//                             activityActualPrice:1,
//                             tourActivity:1,
//                             tourPerson:1,
//                             meetingPoint:1,
//                             information:1,
//                             importentInfo:1,
//                             activityCoordinates:1,
//                             tOriginal:1,
//                             priority:1,
//                             status:1

//                         },
//                       },

//                 ],
//                 as: "activity_details"
//             }
//         },
//         {
//             $project: {
//               citiDetails: 0,
//               langDetails: 0,
//               addedByid: 0,
//               country: 0,
//               activitytypeDetails: 0,
//               sectionsDetails: 0,
//               activitysiteDetails: 0,
//               citiDetails: 0,
//               offerDetails: 0,       
//               addedBy: 0,
//               addedById:0,
//               isDeleted: 0,
//               __v: 0,
//               activityDetailsId:0,
//               createdOn: 0,
//               updatedOn: 0,
//             },
//           },


//     ]).then((data) => {
//         return res.status(ResponseCode.errorCode.success).json({
//             status: true,
//             message: "view All availability",
//             data: data,
//         });
//     })
//         .catch((error) => {
//             return res.status(ResponseCode.errorCode.serverError).json({
//                 status: false,
//                 message: "Error occur",
//                 error: error,
//             });
//         });


// }


const editAvailability = async (req, res) => {
  try {
    const activityDetails = await availabilityModel
      .findOne({
        _id: new mongoose.Types.ObjectId(req.params.id),
        isApprove: false, 
      },
      // {
      //   $set:{
      //     isApprove:false
      //   }
      // }
      )
      .exec();

    // If activityDetails exists
    if (activityDetails != null || activityDetails != "") {
      console.log("reqbody is", req.body);

      const tempAvailabilityData = await tempAvailability
        .findOneAndUpdate(
          { availablityID: new mongoose.Types.ObjectId(req.params.id) },
          { ...req.body,
            isApprove: false
           },
          {  upsert: true, new: true } 
        )
        .exec();

        // Find and update ActivityDetails based on activityDetailsId
      const ActivtyDetailsData = await availabilityModel
      .findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(req.params.id) },
        { upsert: true }
      )
      .exec();

      // Return success response with updated/created data
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Availity details update request sent successfully",
        data: tempAvailabilityData,
      });
    } else {
      res.status(ResponseCode.errorCode.success).json({
        status: false,
        message:
          "You cannot update availability details until the activity is approved by admin",
      });
    }
  } catch (error) {
    console.log("error is==", error);
    const errors = DBerror(error);
    return res.status(ResponseCode.errorCode.serverError).json({
      status: false,
      message: "Server error. Please try again",
      error: error.message,
    });
  }
};




const viewAvalability1 = async (req, res) => {
  availabilityModel.aggregate([
    {
      $match: {
        isDeleted: false,
        activityDetailsId: new mongoose.Types.ObjectId(req.body.id),
        // tourDate: {
        //     $gte: moment.utc(req.body.tourDate).startOf("date").toDate(),
        //     $lte: moment.utc(req.body.tourDate).endOf("date").toDate(),
        //   },
        addedById: req.user._id,
        tourDate: {
          $eq: req.body.tourDate
          // $lte: moment.utc(req.body.tourDate).endOf("date").toDate(),
        },
      }
    },
    // {
    //     $lookup: {
    //         from: "activitydetails",
    //         localField: "activityDetailsId",
    //         foreignField: "_id",
    //         pipeline: [
    //             {
    //                 $lookup: {
    //                     from: "specialoffers",
    //                     localField: "specialOfferId",
    //                     foreignField: "_id",
    //                     as: "offerDetails",
    //                 },
    //             },
    //             {
    //                 $unwind: { path: "$offerDetails", preserveNullAndEmptyArrays: true },
    //             },
    //             {
    //                 $lookup: {
    //                     from: "categories",
    //                     localField: "categoryId",
    //                     foreignField: "_id",
    //                     as: "catDetails",
    //                 },
    //             },
    //             {
    //                 $unwind: { path: "$catDetails", preserveNullAndEmptyArrays: true },
    //             },
    //             {
    //                 $lookup: {
    //                     from: "languages",
    //                     localField: "languageId",
    //                     foreignField: "_id",
    //                     as: "langDetails",
    //                 },
    //             },
    //             {
    //                 $unwind: { path: "$langDetails", preserveNullAndEmptyArrays: true },
    //             },

    //             {
    //                 $lookup: {
    //                     from: "activitytypes",
    //                     localField: "activityTypesId",
    //                     foreignField: "_id",
    //                     as: "activitytypeDetails",
    //                 },
    //             },
    //             {
    //                 $unwind: {
    //                     path: "$activitytypeDetails",
    //                     preserveNullAndEmptyArrays: true,
    //                 },
    //             },
    //             {
    //                 $lookup: {
    //                     from: "sections",
    //                     localField: "sectionId",
    //                     foreignField: "_id",
    //                     as: "sectionsDetails",
    //                 },
    //             },
    //             {
    //                 $unwind: { path: "$sectionsDetails", preserveNullAndEmptyArrays: true },
    //             },
    //             {
    //                 $lookup: {
    //                     from: "activitysites",
    //                     localField: "activitySiteId",
    //                     foreignField: "_id",
    //                     as: "activitysiteDetails",
    //                 },
    //             },
    //             {
    //                 $unwind: {
    //                     path: "$activitysiteDetails",
    //                     preserveNullAndEmptyArrays: true,
    //                 },
    //             },
    //             {
    //                 $lookup: {
    //                     from: "cities",
    //                     localField: "cityId",
    //                     foreignField: "_id",
    //                     as: "citiDetails",
    //                 },
    //             },
    //             {
    //                 $unwind: { path: "$citiDetails", preserveNullAndEmptyArrays: true },
    //             },

    //             {
    //                 $lookup: {
    //                     from: "countries",
    //                     localField: "countryId",
    //                     foreignField: "_id",
    //                     as: "country",
    //                 },
    //             },
    //             {
    //                 $unwind: { path: "$country", preserveNullAndEmptyArrays: true },
    //             },

    //             {
    //                 $addFields: {
    //                     specialOfferName: "$offerDetails.specialOfferName",
    //                     discountPercentage: "$offerDetails.discountPercentage",
    //                     cityName: "$citiDetails.cityName",
    //                     countryName: "$country.name",
    //                     activitySiteName: "$activitysiteDetails.siteName",
    //                     sectionTitle: "$sectionsDetails.sectionTitle",
    //                     activitytypeName: "$activitytypeDetails.name",
    //                     language: "$langDetails.name",
    //                     catDetails: "$catDetails.categoryName",
    //                 },
    //             },
    //             {
    //                 $project: {
    //                     specialOfferName:1,
    //                     discountPercentage: 1,
    //                     cityName: 1,
    //                     countryName:1,
    //                     activitySiteName: 1,
    //                     sectionTitle:1,
    //                     activitytypeName: 1,
    //                     language:1,
    //                     catDetails: 1,
    //                     slug:1,
    //                     referenceCode:1,
    //                     activityTitle:1,
    //                     activityDiscountPrice:1,
    //                     description:1,
    //                     image:1,
    //                     activityActualPrice:1,
    //                     tourActivity:1,
    //                     tourPerson:1,
    //                     meetingPoint:1,
    //                     information:1,
    //                     importentInfo:1,
    //                     activityCoordinates:1,
    //                     tOriginal:1,
    //                     priority:1,
    //                     status:1

    //                 },
    //               },

    //         ],
    //         as: "activity_details"
    //     }
    // },
    {
      $project: {
        citiDetails: 0,
        langDetails: 0,
        addedByid: 0,
        country: 0,
        activitytypeDetails: 0,
        sectionsDetails: 0,
        activitysiteDetails: 0,
        citiDetails: 0,
        offerDetails: 0,
        addedBy: 0,
        addedById: 0,
        isDeleted: 0,
        __v: 0,
        activityDetailsId: 0,
        createdOn: 0,
        updatedOn: 0,
      },
    },
    {
      $sort: {
        time: 1
      },
    },
  ]).then((data) => {
    return res.status(ResponseCode.errorCode.success).json({
      status: true,
      message: "view All availability",
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


}

// const viewAvalability = async (req, res) => {
//   activitydetail.aggregate([
//     {
//       $match: {
//         isDeleted: false,
//         addedByid: req.user._id,
//         _id: new mongoose.Types.ObjectId(req.body.id),
//       }
//     },
//     {
//       $lookup: {
//         from: "availabilities",
//         localField: "_id",
//         foreignField: "activityDetailsId",
//         pipeline: [
//           {
//             $match: {
//               tourDate: {
//                 $eq: req.body.tourDate
//               },
//             }
//           },
//           {
//             $project: {
//               isDeleted: 0,
//               status: 0,
//               createdOn: 0,
//               updatedOn: 0,
//               __v: 0,
//             }
//           }
//         ],
//         as: "availabilityData"
//       }
//     },
//     {
//       $project: {
//         availabilityData: 1,
//         _id: 0
//       },
//     },

//   ]).then((data) => {
//     return res.status(ResponseCode.errorCode.success).json({
//       status: true,
//       message: "view All availability",
//       // data: data,
//       data: data[0]?.availabilityData,
//     });
//   })
//     .catch((error) => {
//       console.log("error is===",error);
//       const errors = DBerror(error);
//       return res.status(ResponseCode.errorCode.serverError).json({
//         status: false,
//         message: "Server error,Please try again",
//         error: errors,
//       });
//     });


// }

const viewAvalability = async (req, res) => {
  activitydetail.aggregate([
    {
      $match: {
        isDeleted: false,
        addedByid: req.user._id,
        // _id: new mongoose.Types.ObjectId(req.body.id),
      }
    },
    {
      $lookup: {
        from: "availabilities",
        localField: "_id",
        foreignField: "activityDetailsId",
        pipeline: [
          {
            $match: {
              tourDate: {
                $eq: req.body.tourDate
              },
            }
          },
          {
            $lookup:{
              from:"tempavailabilities",
              localField:"_id",
              foreignField:"availablityID",
              as:"tempAvailability",
              pipeline:[
                {
                  $match:{
                    isDeleted:false
                  }
                },
              ]
            }
          },
          {
            $project: {
              isDeleted: 0,
              // status: 0,
              createdOn: 0,
              updatedOn: 0,
              __v: 0,
            }
          }
        ],
        as: "availabilityData"
      }
    },
    // {
    //   $project: {
    //     availabilityData: 1,
    //     _id: 0
    //   },
    // },

  ]).then((data) => {
    return res.status(ResponseCode.errorCode.success).json({
      status: true,
      message: "view All availability",
      data: data,
      data: data[0]?.availabilityData,
      // data:data
    });
  })
    .catch((error) => {
      console.log("error is===", error);
      const errors = DBerror(error);
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error,Please try again",
        error: errors,
      });
    });


}


const viewMonthwiseAvailability = async (req, res) => {
  var { month, year } = req.body;

  availabilityModel
    .aggregate([
      {
        $addFields: {
          book: "$tourDate",
          year: { $year: { $toDate: "$tourDate" } },
          month: { $month: { $toDate: "$tourDate" } },
        },
      },
      {
        $match: {
          isDeleted: false,
          activityDetailsId: new mongoose.Types.ObjectId(req.body.id),
          year: year,
          month: month,
        },
      },
      {
        $sort: {
          tourDate: 1,
        },
      },
      {
        $group: {
          _id: "$tourDate",
          statuses: { $push: "$status" }, // Collect all status values in an array
          remainingUsers: { $sum: "$remeningUser" },
        },
      },
      {
        $addFields: {
          allActive: {
            $not: {
              $in: [false, "$statuses"], // Check if false is not in the array
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          _id: "$_id",
          allActive: 1,
          remainingUsers: 1,
        },
      },
    ])
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "View All availability",
        data: data,
      });
    })
    .catch((error) => {
      console.log(error);
      const errors = DBerror(error);
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error, Please try again",
        error: errors,
      });
    });
};


const deleteAvailabilityDatewise = async (req, res) => {

  var avaldate = await availabilityModel
    .find(
      {
        activityDetailsId: {
          $in: [new mongoose.Types.ObjectId(req.params.id)],
        },
        tourDate: {
          $in: req.body.dateRange,
        }

      },
      { tourDate: 1 }
    )
    .exec();

  // console.log("avaldate", avaldate)

  // return false;

  avaldate.forEach((ele) => {
    console.log(ele._id);
    availabilityModel
      .deleteOne({ _id: new mongoose.Types.ObjectId(ele._id) })
      .exec();
  });

  res.status(ResponseCode.errorCode.success).json({
    status: true,
    message: "Deleted successfully",
  });

  // .then((data) => {
  //   res.status(ResponseCode.errorCode.success).json({
  //     status: true,
  //     message: "Deleted successfully",
  //     data: data
  //   })
  // })
  // .catch((error) => {
  //   res.status(ResponseCode.errorCode.errorCode).json({
  //     status: false,
  //     message: "Server error, please try again later",

  //   })
  // })
};





module.exports = {
  addAvailability,
  editAvailability,
  viewAvalability,
  viewMonthwiseAvailability,
  deleteAvailabilityDatewise
}