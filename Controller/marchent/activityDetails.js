const mongoose = require("mongoose");
const random = require("random-string-alphanumeric-generator");
// const activityDetailsModel = require("../../Models/activityDetails");
const newActivityDetails = require("../../Models/newActivityDetails");
const specialOfferModel = require("../../Models/specialOffer");
const activityDetailsModel = require("../../Models/activityDetails");
 const availabilityModel = require("../../Models/availability")
const ResponseCode = require("../../service/responseCode");
const { DBerror, InputError } = require("../../service/errorHandeler");
var moment = require("moment");
const S3 = require("../../service/s3");
const tempActivityDetails = require("../../Models/tempActivityDetails");
const tempAvailability = require("../../Models/tempAvailability");
const Merchant = require("../../Models/merchant");
const Siteconfig  = require("../../Models/siteConfig");

const activityDetailsImage = async (req, res) => {
  let uploadData = await S3.doUpload(req, "activityDetails/image");
  if (uploadData.status) {
    res.send(uploadData);
  } else {
    res.send(uploadData);
  }
};


const generateProductCode = async(req,res) => {
  let merchantDetails = await Merchant.findById(req.user._id);
  if(merchantDetails.marchentCode == undefined || merchantDetails.marchentCode == null){
    return res.status(ResponseCode.errorCode.success).json({
      status: false,
      message: "Merchant code not found!"
    });
  }

  let codeStr = '';
  let newProductCode = null;    
  let merchantProdCode = await Siteconfig.findOne({configName:"productCode", configMeta:merchantDetails.marchentCode});
  if(!merchantProdCode){
    codeStr = '1';
  }
  else{
    codeStr = merchantProdCode?.configValue;
  }
  newProductCode = merchantDetails.marchentCode+"P"+codeStr.padStart(4, '0')

  return {marchentCode:merchantDetails.marchentCode, configValue:codeStr, newProductCode:newProductCode};
};


const addActivityDetails = async (req, res) => {
  try {
    var priorityCheck = await activityDetailsModel.aggregate([
      {
        $match: {
          isDeleted: false
        }
      },
      {
        $project: {
          topPriority: 1
        }
      },
      {
        $sort:{
          topPriority: -1
        } 
      }
    ])
    .exec();

    // var newPriority = priorityCheck[0];


    if(priorityCheck.length > 0 && priorityCheck[0]?.topPriority) {
      var newPriority = priorityCheck[0].topPriority+1;
    } else {
      var newPriority = 0;
    }

    // return false;
    
    // console.log("id is==",req.body._id);
    var check = await activityDetailsModel
      .findOne({
        _id: new mongoose.Types.ObjectId(req.body._id),
        saveAsDraft: true,
      })
      // .exec();
      // console.log("check data is==",check);

    if (check) {
      await activityDetailsModel.findOneAndUpdate(
        { _id: check._id },
        { ...req.body, updatedStatus: true },
        { saveAsDraft: req.body.saveAsDraft }
      );

      // const q = await newActivityDetails
      //   .findOne({ referenceCode: check.referenceCode, saveAsDraft: true })
      //   .exec();

      // if (q) {
      //   await newActivityDetails.findOneAndUpdate(
      //     { _id: q._id },
      //     { ...req.body },
      //     { saveAsDraft: check.saveAsDraft }
      //   );
      // }
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Activity updated request sent sucessfully",
      });
    } else {

      // for random activityMarchentCode generate 
      let activityMarchentCode = "";
      let code = await activityDetailsModel
      .findOne({}, { activityMarchentCode: 1 })
      .sort({ createdOn: -1 })
      .exec();
      console.log("code is", code);
        
      let inputString = "T000001";
      if (code == null || code.activityMarchentCode == null || code.activityMarchentCode == "") {
        activityMarchentCode = inputString;
      } else {
        const substring = Number(code.activityMarchentCode.slice(1)) + 1;
        console.log("substring ===", substring);
        activityMarchentCode = "T" + String(substring).padStart(6, '0');
      }
      console.log("activityMarchentCode code is==", activityMarchentCode);
      // return false

      const titlecheck = await activityDetailsModel
        .find({ activityTitle: req.body.activityTitle, isDeleted: false , saveAsDraft: false})
        .exec();

      if (titlecheck.length > 0) {
        return res.status(ResponseCode.errorCode.dataExist).json({
          status: false,
          message: "ActivityTitle already exists",
        });
      } else {

      let prodCodeData = await generateProductCode(req, res).then(data=>data).catch(err=>console.log(err));

      const activityDetailsData = {
          ...req.body,
          productCode: prodCodeData.newProductCode,
          addedByid: req.user._id,
          addedBy: "merchant",
          activityMarchentCode: activityMarchentCode,
          saveAsDraft: req.body.saveAsDraft || false,
          topPriority:newPriority,
          referenceCode: random.randomAlphanumeric(10, "uppercase"),
        };

        const activityDetails = await new activityDetailsModel(
          activityDetailsData
        ).save().then(async data=>{
          await Siteconfig.findOneAndUpdate({configName:"productCode", configMeta:prodCodeData.marchentCode},{configValue:parseInt(prodCodeData.configValue)+1}, {upsert: true});
          return data;
        });

        // const activityData = {
        //   ...req.body,
        //   reasonType: "Add",
        //   activityId: activityDetails._id,
        //   merchantId: activityDetails.addedByid,
        //   addedBy: activityDetails.addedBy,
        //   referenceCode: activityDetails.referenceCode,
        //   saveAsDraft: activityDetails.saveAsDraft,
        //   isDeleted: activityDetails.isDeleted
        // };
        // console.log("activityData",activityData);
        // return false

        // await new newActivityDetails(activityData).save();

        return res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "Activity Details Add Request Sent Sucessfully",
        });
      }
    }
  } catch (error) {
    console.log(error)
    const errors = DBerror(error); 
    return res.status(ResponseCode.errorCode.serverError).json({
      status: false,
      message: "Server error, please try again ",
      error: errors,
    });
  }
};

// const editActivityDetailsOld = async (req, res) => {
//   // console.log(req.body);
//   const activityDetails = await newActivityDetails.findOne({
//     _id: new mongoose.Types.ObjectId(req.params.id),
//   });
//   const offer = await specialOfferModel
//     .findOne({ _id: activityDetails.specialOfferId })
//     .exec();
//   console.log("activityDetails", activityDetails.specialOfferId);
//   // return false
//   if (activityDetails.specialOfferId == null) {
//     await newActivityDetails
//       .findOneAndUpdate(
//         {
//           _id: new mongoose.Types.ObjectId(req.params.id),
//           merchantId: new mongoose.Types.ObjectId(req.user._id),
//         },
//         {
//           ...req.body,
//           reasonType: "Edit",
//           isApproval: false

//         },

//         {
//           new: true
//         }
//       )
//       .then((data) => {
//         // console.log("data",data);
//         // return false
//         return res.status(ResponseCode.errorCode.success).json({
//           status: true,
//           message: "Activity details change request sent sucessfully",
//           // data: data,
//         });
//       });
//   } else if (activityDetails.specialOfferId) {
//     const discountAmount =
//       (req.body.activityActualPrice * offer.discountPercentage) / 100;
//     const discountedPrice = req.body.activityActualPrice - discountAmount;

//     req.body.participentType.forEach((participantType) => {
//       const discountedPrice =
//         participantType.price -
//         (participantType.price * offer.discountPercentage) / 100;
//       participantType.discountPrice = discountedPrice;
//     });

//     await newActivityDetails
//       .findOneAndUpdate(
//         {
//           _id: new mongoose.Types.ObjectId(req.params.id),
//           merchantId: new mongoose.Types.ObjectId(req.user._id),
//         },
//         {
//           ...req.body,
//           isApproval: false,
//           reasonType: "Edit",
//           activityDiscountPrice: discountedPrice,
//         }
//       )
//       .then((data) => {
//         // console.log("data",data);
//         // return false
//         return res.status(ResponseCode.errorCode.success).json({
//           status: true,
//           message: "Activity details change request sent sucessfully",
//           // data: data,
//         });
//       })
//       .catch((error) => {
//         const errors = DBerror(error);
//         return res.status(ResponseCode.errorCode.serverError).json({
//           status: false,
//           message: "Server error,Please try again",
//           error: errors,
//         });
//       });
//   }
// };

// const editActivityDetails = async (req, res) => {
//   const activityDetails = await activityDetailsModel
//     .findOne({
//       _id: new mongoose.Types.ObjectId(req.params.id),
//       isApproval: true,
//       visibleStatus: true,
//     })
//     .exec();

//   if (activityDetails != null || activityDetails != "") {
//     console.log("c1");

//     // await activityDetailsModel
//     //   .findOne({
//     //     _id: new mongoose.Types.ObjectId(req.params.id),
//     //     isApproval: false,
//     //     visibleStatus: false,
//     //     rejectedStatus: false,
//     //   })
//     //   .then((data) => {
//     //     if (data) {
//     //       console.log("c2");

//     //       res.status(ResponseCode.errorCode.success).json({
//     //         status: false,
//     //         message:
//     //           "You can not update activity details until previous one is approved by admin",
//     //       });
//     //     } else {
//     // console.log("c3");

//     activityDetailsModel
//       .findOneAndUpdate(
//         { _id: new mongoose.Types.ObjectId(req.params.id) },
//         {
//           ...req.body,
//         }
//       )
//       .exec();

//     // const activityDetailsData = {
//     //   ...req.body,
//     //   addedByid: req.user._id,
//     //   activityDetailsId: new mongoose.Types.ObjectId(req.params.id),
//     //   addedBy: "merchant",
//     //   updatedStatus: true,
//     //   saveAsDraft: req.body.saveAsDraft || false,
//     //   referenceCode: random.randomAlphanumeric(10, "uppercase"),
//     // };

//     // const activityDetails = new activityDetailsModel(
//     //   activityDetailsData
//     // ).save();
//     return res.status(ResponseCode.errorCode.success).json({
//       status: true,
//       message: "Activity details update request sent sucessfully",
//       // data: data,
//     });
//     // }
//     // })
//     // .catch((error) => {
//     //   const errors = DBerror(error);
//     //   return res.status(ResponseCode.errorCode.serverError).json({
//     //     status: false,
//     //     message: "Server error,Please try again",
//     //     error: errors,
//     //   });
//     // });
//   } else {
//     console.log("c4");

//     res.status(ResponseCode.errorCode.success).json({
//       status: false,
//       message:
//         "You can not update activity details until activity is approved by admin",
//     });
//   }
// };

const editActivityDetails = async (req, res) => {
  try { 
    
    const activityDetails = await activityDetailsModel
      .findOne({
        _id: new mongoose.Types.ObjectId(req.params.id),
        isApproval: true, 
        visibleStatus: true,
      })
      .exec();

    // If activityDetails exists
    if (activityDetails != null || activityDetails != "") {
     
      const tempActivtyDetailsData = await tempActivityDetails
        .findOneAndUpdate(
          { activityDetailsId: new mongoose.Types.ObjectId(req.params.id) },
          { ...req.body, isEdited: true },
          {  upsert: true, new: true }
        )
        .exec();

      
      const ActivtyDetailsData = await activityDetailsModel
      .findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(req.params.id) },
        { isEdited: true },
        { upsert: true } // Create a new document if not found
      )
      .exec();

      // Return success response with updated/created data
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Activity details update request sent successfully krishna ",
        data: tempActivtyDetailsData,
      });
    } else {
      res.status(ResponseCode.errorCode.success).json({
        status: false,
        message:
          "You cannot update activity details until the activity is approved by admin",
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

const viewActivityDetails = async (req, res) => {
  const { product_type } = req.params;
  // console.log("product_type-===", product_type)
  console.log(req.user._id)
  const currentDate = moment().format("YYYY-MM-DD");

  let matchCondition = {
    addedByid: new mongoose.Types.ObjectId(req.user._id),
    // isApproval:true,
    isDeleted: false,
    saveAsDraft: false,
  };

  let activityDetailsIds; // Declare the variable here

  // If product_type is provided, add availabilities filter
  if (product_type) {
    // Find maximum tourDate for each activity
    const maxTourDates = await availabilityModel
      .aggregate([
        {
          $match: {
            activityDetailsId: { $in: await activityDetailsModel.find(matchCondition).distinct('_id') },
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: "$activityDetailsId",
            maxTourDate: { $max: "$tourDate" },
          },
        },
      ]);
    // console.log("maxTourDates-===", maxTourDates)

    // Extract activityDetailsIds based on maximum tourDates
    if (product_type === 'bookable_products') {
      activityDetailsIds = maxTourDates
        .filter(item => moment(item.maxTourDate).isSameOrAfter(currentDate))
        .map(item => item._id);
    } else if (product_type === 'expire_product') {
      activityDetailsIds = maxTourDates
        .filter(item => moment(item.maxTourDate).isBefore(currentDate))
        .map(item => item._id);
    }

    // Add activityDetails filter
    matchCondition['_id'] = { $in: activityDetailsIds };
    // matchCondition['addedByid'] = new mongoose.Types.ObjectId(req.user._id)  ///\/\/
  }

  // Fetch activity details based on the filtered activityDetailsIds
  const data = await activityDetailsModel
    .aggregate([
      {
        $match: matchCondition,
      },
      // fetching temporary activity data
      {
        $lookup: {
          from: "tempactivitydetails",
          localField: "_id",
          foreignField: "activityDetailsId",
          as: "tempActivityData"
        }
      },
      {
        $unwind: {
          path: "$tempActivityData", preserveNullAndEmptyArrays : true
        }
      },

      {
        $lookup: {
          from: "tourmodules",
          localField: "tourModuleId",
          foreignField: "_id",
          as: "tourModules",
        },
      },
      {
        $unwind: { path: "$tourModules", preserveNullAndEmptyArrays: true },
      },

      {
        $lookup: {
          from: "specialoffers",
          localField: "specialOfferId",
          foreignField: "_id",
          as: "offerDetails",
        },
      },
      {
        $unwind: { path: "$offerDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "catDetails",
        },
      },
      {
        $unwind: { path: "$catDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "languages",
          localField: "languageId",
          foreignField: "_id",
          as: "langDetails",
        },
      },
      {
        $unwind: { path: "$langDetails", preserveNullAndEmptyArrays: true },
      },

      {
        $lookup: {
          from: "activitytypes",
          localField: "activityTypesId",
          foreignField: "_id",
          as: "activitytypeDetails",
        },
      },
      {
        $unwind: {
          path: "$activitytypeDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "sections",
          localField: "sectionId",
          foreignField: "_id",
          as: "sectionsDetails",
        },
      },
      {
        $unwind: { path: "$sectionsDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "activitysites",
          localField: "activitySiteId",
          foreignField: "_id",
          as: "activitysiteDetails",
        },
      },
      {
        $unwind: {
          path: "$activitysiteDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "cities",
          localField: "cityId",
          foreignField: "_id",
          as: "citiDetails",
        },
      },
      {
        $unwind: { path: "$citiDetails", preserveNullAndEmptyArrays: true },
      },

      {
        $lookup: {
          from: "countries",
          localField: "countryId",
          foreignField: "_id",
          as: "country",
        },
      },
      {
        $unwind: { path: "$country", preserveNullAndEmptyArrays: true },
      },

      {
        $lookup: {
          from: "merchants",
          localField: "addedByid",
          foreignField: "_id",
          pipeline: [
            {
              $addFields: {
                fullName:
                  { $concat: ["$firstName", " ", "$lastName"] }

              }
            }
          ],
          as: "merchant",
        },
      },
      {
        $unwind: { path: "$merchant", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "destinations",
          pipeline: [
            {
              $project: {
                status: 0,
                topPriority: 0,
                isDeleted: 0,
                createdOn: 0,
                updatedOn: 0,
                __v: 0
              }
            }
          ],
          localField: "destination",
          foreignField: "_id",
          as: "destinationData",
        },
      },
      {
        $unwind: { path: "$destinationData", preserveNullAndEmptyArrays: true },
      },

      



      {
        $addFields: {
          specialOfferName: "$offerDetails.specialOfferName",
          discountPercentage: "$offerDetails.discountPercentage",
          marchentFirstName: "$merDetails.firstName",
          marchentLastName: "$merDetails.lastName",
          cityName: "$citiDetails.cityName",
          countryName: "$country.name",
          activitySiteName: "$activitysiteDetails.siteName",
          sectionTitle: "$sectionsDetails.sectionTitle",
          activitytypeName: "$activitytypeDetails.name",
          language: "$langDetails.name",
          catDetails: "$catDetails.categoryName",
          tourModuleName: "$tourModules.name",
          addedByName: "$merchant.fullName",
          // destinationsName: "$destinationData.name"

        },
      },

      {
        $project: {
          citiDetails: 0,
          langDetails: 0,
          merDetails: 0,
          // addedByid: 0,
          merchant: 0,
          country: 0,
          activitytypeDetails: 0,
          sectionsDetails: 0,
          activitysiteDetails: 0,
          citiDetails: 0,
          offerDetails: 0,
          tourModules: 0,
          // destinationData: 0,
          destination: 0,
          // cityId: 0,
          // activitySiteId: 0,
          // categoryId: 0,
          // activityTypesId: 0,
          // countryId: 0,
          // languageId: 0,
          // addedBy: 0,
          isDeleted: 0,
          __v: 0,
          createdOn: 0,
          updatedOn: 0,
        },
      },
      {
        $sort: {
          _id: -1,
          createdOn: -1,
        },
      },
    ])

  return res.status(ResponseCode.errorCode.success).json({
    status: true,
    message: "View Tours",
    data: data,
  });
  
  // await activityDetailsModel
  
  //   .aggregate([
  //     {
  //       $match: {
  //         addedByid: new mongoose.Types.ObjectId(req.user._id),
  //         // isApproval:true,
  //         isDeleted: false,
  //         saveAsDraft: false,
  //       },
  //     },
  //     {
  //       $lookup: {
  //         from: "specialoffers",
  //         localField: "specialOfferId",
  //         foreignField: "_id",
  //         as: "offerDetails",
  //       },
  //     },
  //     {
  //       $unwind: { path: "$offerDetails", preserveNullAndEmptyArrays: true },
  //     },
  //     {
  //       $lookup: {
  //         from: "categories",
  //         localField: "categoryId",
  //         foreignField: "_id",
  //         as: "catDetails",
  //       },
  //     },
  //     {
  //       $unwind: { path: "$catDetails", preserveNullAndEmptyArrays: true },
  //     },
  //     {
  //       $lookup: {
  //         from: "languages",
  //         localField: "languageId",
  //         foreignField: "_id",
  //         as: "langDetails",
  //       },
  //     },
  //     {
  //       $unwind: { path: "$langDetails", preserveNullAndEmptyArrays: true },
  //     },

  //     {
  //       $lookup: {
  //         from: "activitytypes",
  //         localField: "activityTypesId",
  //         foreignField: "_id",
  //         as: "activitytypeDetails",
  //       },
  //     },
  //     {
  //       $unwind: {
  //         path: "$activitytypeDetails",
  //         preserveNullAndEmptyArrays: true,
  //       },
  //     },
  //     {
  //       $lookup: {
  //         from: "sections",
  //         localField: "sectionId",
  //         foreignField: "_id",
  //         as: "sectionsDetails",
  //       },
  //     },
  //     {
  //       $unwind: { path: "$sectionsDetails", preserveNullAndEmptyArrays: true },
  //     },
  //     {
  //       $lookup: {
  //         from: "activitysites",
  //         localField: "activitySiteId",
  //         foreignField: "_id",
  //         as: "activitysiteDetails",
  //       },
  //     },
  //     {
  //       $unwind: {
  //         path: "$activitysiteDetails",
  //         preserveNullAndEmptyArrays: true,
  //       },
  //     },
  //     {
  //       $lookup: {
  //         from: "cities",
  //         localField: "cityId",
  //         foreignField: "_id",
  //         as: "citiDetails",
  //       },
  //     },
  //     {
  //       $unwind: { path: "$citiDetails", preserveNullAndEmptyArrays: true },
  //     },

  //     {
  //       $lookup: {
  //         from: "countries",
  //         localField: "countryId",
  //         foreignField: "_id",
  //         as: "country",
  //       },
  //     },
  //     {
  //       $unwind: { path: "$country", preserveNullAndEmptyArrays: true },
  //     },
  //     {
  //       $lookup: {
  //         from: "destinations",
  //         localField: "destination",
  //         foreignField: "_id",
  //         as: "destination",
  //       },
  //     },
  //     {
  //       $unwind: { path: "$destination", preserveNullAndEmptyArrays: true },
  //     },
  //     {
  //       $lookup: {
  //         from: "tourmodules",
  //         localField: "tourModuleId",
  //         foreignField: "_id",
  //         as: "tourModule",
  //       },
  //     },
  //     {
  //       $unwind: { path: "$tourModule", preserveNullAndEmptyArrays: true },
  //     },

  //     {
  //       $addFields: {
  //         specialOfferName: "$offerDetails.specialOfferName",
  //         discountPercentage: "$offerDetails.discountPercentage",
  //         cityName: "$citiDetails.cityName",
  //         countryName: "$country.name",
  //         destinationName: "$destination.name",
  //         tourModuleName: "$tourModule.name",
  //         activitySiteName: "$activitysiteDetails.siteName",
  //         sectionTitle: "$sectionsDetails.sectionTitle",
  //         activitytypeName: "$activitytypeDetails.name",
  //         language: "$langDetails.name",
  //         catDetails: "$catDetails.categoryName",
  //         currencyName: "$currency.name",

  //       },
  //     },
  //     {
  //       $project: {
  //         citiDetails: 0,
  //         langDetails: 0,
  //         addedByid: 0,
  //         country: 0,
  //         activitytypeDetails: 0,
  //         sectionsDetails: 0,
  //         activitysiteDetails: 0,
  //         citiDetails: 0,
  //         offerDetails: 0,
  //         tourModule:0,
  //         destination:0,
  //         // currency:0,
  //         // cityId: 0,
  //         // activitySiteId: 0,
  //         // categoryId: 0,
  //         // activityTypesId: 0,
  //         // countryId: 0,
  //         // languageId: 0,
  //         addedBy: 0,
  //         isDeleted: 0,
  //         __v: 0,
  //         createdOn: 0,
  //         updatedOn: 0,
  //       },
  //     },
  //     {
  //       $sort: {
  //         _id: -1,
  //         createdOn: -1,
  //       },
  //     },
  //   ])
  //   .then((data) => {
  //     return res.status(ResponseCode.errorCode.success).json({
  //       status: true,
  //       message: "View Tours",
  //       data: data,
  //     });
  //   })
  //   .catch((error) => {
  //     const errors = DBerror(error);
  //     return res.status(ResponseCode.errorCode.serverError).json({
  //       status: false,
  //       message: "Server error,Please try again",
  //       error: errors,
  //     });
  //   });


};

// const deleteActivityDetails = async (req, res) => {
//   const check = await newActivityDetails
//     .findOne({ _id: new mongoose.Types.ObjectId(req.params.id) })
//     .exec();

//   if (check.isDeleted == true) {
//     return res.status(ResponseCode.errorCode.dataNotFound).json({
//       status: false,
//       message: "activity Not found",
//       // data:check
//     });
//   } else {
//     await newActivityDetails
//       .findOneAndUpdate(
//         {
//           merchantId: new mongoose.Types.ObjectId(req.user._id),
//           _id: new mongoose.Types.ObjectId(req.params.id),
//         },
//         {
//           isDeleted: true,
//         },
//         {
//           new: true
//         }
//       )
//       .then(async (data) => {
//         // console.log("data",data);
//         // return false
//         await activityDetailsModel
//           .findOneAndUpdate(
//             {
//               _id: data.activityId,
//             },
//             {
//               isDeleted: data.isDeleted
//             }
//           )
//         return res.status(ResponseCode.errorCode.success).json({
//           status: true,
//           message: "Activity details delete sucessfully",
//         });
//       })
//       .catch((error) => {
//         const errors = DBerror(error);
//         return res.status(ResponseCode.errorCode.serverError).json({
//           status: false,
//           message: "Server error,Please try again",
//           error: errors,
//         });
//       });
//   }
// };

const setActivityStatus = async (req, res) => {
  var id = req.params.id;
  await activityDetailsModel.findById({ _id: id }).then(async (data) => {
    // console.log("data",data);
    // return false
    if (data.status === true) {
      console.log(true);
      await activityDetailsModel
        .findOneAndUpdate(
          { _id: id },
          { $set: { status: false } },
          { new: true }
        )
        .then((data) => {
          res.status(200).json({
            status: true,
            message: "activityDetails has been made inactive.",
            // data: data,
          });
        });
    } else {
      await activityDetailsModel
        .findOneAndUpdate(
          { _id: id },
          { $set: { status: true } },
          { new: true }
        )
        .then((data) => {
          res.status(200).json({
            status: true,
            message: "activityDetails has been made active.",
            // data: data,
          });
        })
        .catch((error) => {
          const errors = DBerror(error);
          return res.status(ResponseCode.errorCode.serverError).json({
            status: false,
            message: "Invalid id. Server error.",
            error: errors,
          });
        });

    }
  });
}; 


const deleteActivityDetails = async (req, res) => {
  const check = await activityDetailsModel
    .find({ _id: new mongoose.Types.ObjectId(req.params.id) })
    .exec();

  if (check.length > 0) {
    await activityDetailsModel
      .deleteOne({
        addedByid: new mongoose.Types.ObjectId(req.user._id),
        _id: new mongoose.Types.ObjectId(req.params.id),
      })
      .then((data) => {
        return res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "Activity details deleted sucessfully",
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
  } else {
    return res.status(ResponseCode.errorCode.dataNotFound).json({
      status: false,
      message: "Activity not found",
    });
  }
}; 

const singleDraftActivity = async (req, res) => {
  await activityDetailsModel
    .aggregate([
      {
        $match: {
          addedByid: new mongoose.Types.ObjectId(req.user._id),
          _id: new mongoose.Types.ObjectId(req.params.id),
          isDeleted: false,
          // status: true,
          saveAsDraft: true,
        },
      },
      {
        $lookup: {
          from: "specialoffers",
          localField: "specialOfferId",
          foreignField: "_id",
          as: "offerDetails",
        },
      },
      {
        $unwind: { path: "$offerDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "catDetails",
        },
      },
      {
        $unwind: { path: "$catDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "languages",
          localField: "languageId",
          foreignField: "_id",
          as: "langDetails",
        },
      },
      {
        $unwind: { path: "$langDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "activitytypes",
          localField: "activityTypesId",
          foreignField: "_id",
          as: "activitytypeDetails",
        },
      },
      {
        $unwind: {
          path: "$activitytypeDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "sections",
          localField: "sectionId",
          foreignField: "_id",
          as: "sectionsDetails",
        },
      },
      {
        $unwind: { path: "$sectionsDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "activitysites",
          localField: "activitySiteId",
          foreignField: "_id",
          as: "activitysiteDetails",
        },
      },
      {
        $unwind: {
          path: "$activitysiteDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "cities",
          localField: "cityId",
          foreignField: "_id",
          as: "citiDetails",
        },
      },
      {
        $unwind: { path: "$citiDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "countries",
          localField: "countryId",
          foreignField: "_id",
          as: "country",
        },
      },
      {
        $unwind: { path: "$country", preserveNullAndEmptyArrays: true },
      },
      {
        $addFields: {
          specialOfferName: "$offerDetails.specialOfferName",
          discountPercentage: "$offerDetails.discountPercentage",
          cityName: "$citiDetails.cityName",
          countryName: "$country.name",
          activitySiteName: "$activitysiteDetails.siteName",
          sectionTitle: "$sectionsDetails.sectionTitle",
          activitytypeName: "$activitytypeDetails.name",
          language: "$langDetails.name",
          catDetails: "$catDetails.categoryName",
        },
      },
      {
        $project: {
          citiDetails: 0,
          langDetails: 0,
          merDetails: 0,
          addedByid: 0,
          country: 0,
          activitytypeDetails: 0,
          sectionsDetails: 0,
          activitysiteDetails: 0,
          citiDetails: 0,
          offerDetails: 0,
          // cityId:0,
          // activitySiteId:0,
          // categoryId:0,
          // activityTypesId:0,
          // countryId:0,
          // languageId:0,
          addedBy: 0,
          isDeleted: 0,
          __v: 0,
          createdOn: 0,
          updatedOn: 0,
        },
      },
    ])
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "View single draft  activity",
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

const singleActivityDetails = async (req, res) => {
  await activityDetailsModel
    .aggregate([
      {
        $match: {
          addedByid: new mongoose.Types.ObjectId(req.user._id),
          _id: new mongoose.Types.ObjectId(req.params.id),
          isDeleted: false,
          // status: true,
        },
      },
      {
        $lookup: {
          from: "specialoffers",
          localField: "specialOfferId",
          foreignField: "_id",
          as: "offerDetails",
        },
      },
      {
        $unwind: { path: "$offerDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "catDetails",
        },
      },
      {
        $unwind: { path: "$catDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "languages",
          localField: "languageId",
          foreignField: "_id",
          as: "langDetails",
        },
      },
      {
        $unwind: { path: "$langDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "activitytypes",
          localField: "activityTypesId",
          foreignField: "_id",
          as: "activitytypeDetails",
        },
      },
      {
        $unwind: {
          path: "$activitytypeDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "sections",
          localField: "sectionId",
          foreignField: "_id",
          as: "sectionsDetails",
        },
      },
      {
        $unwind: { path: "$sectionsDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "activitysites",
          localField: "activitySiteId",
          foreignField: "_id",
          as: "activitysiteDetails",
        },
      },
      {
        $unwind: {
          path: "$activitysiteDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "cities",
          localField: "cityId",
          foreignField: "_id",
          as: "citiDetails",
        },
      },
      {
        $unwind: { path: "$citiDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "countries",
          localField: "countryId",
          foreignField: "_id",
          as: "country",
        },
      },
      {
        $unwind: { path: "$country", preserveNullAndEmptyArrays: true },
      },
      {
        $addFields: {
          specialOfferName: "$offerDetails.specialOfferName",
          discountPercentage: "$offerDetails.discountPercentage",
          cityName: "$citiDetails.cityName",
          countryName: "$country.name",
          activitySiteName: "$activitysiteDetails.siteName",
          sectionTitle: "$sectionsDetails.sectionTitle",
          activitytypeName: "$activitytypeDetails.name",
          language: "$langDetails.name",
          catDetails: "$catDetails.categoryName",
        },
      },
      {
        $project: {
          citiDetails: 0,
          langDetails: 0,
          merDetails: 0,
          addedByid: 0,
          country: 0,
          activitytypeDetails: 0,
          sectionsDetails: 0,
          activitysiteDetails: 0,
          citiDetails: 0,
          offerDetails: 0,
          // cityId:0,
          // activitySiteId:0,
          // categoryId:0,
          // activityTypesId:0,
          // countryId:0,
          // languageId:0,
          addedBy: 0,
          isDeleted: 0,
          __v: 0,
          createdOn: 0,
          updatedOn: 0,
        },
      },
    ])
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "View single  activity",
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


const viewDraftActivityDetails = async (req, res) => {
  await activityDetailsModel
    .aggregate([
      {
        $match: {
          addedByid: new mongoose.Types.ObjectId(req.user._id),
          isDeleted: false,
          saveAsDraft: true,
        },
      },

      {
        $lookup: {
          from: "specialoffers",
          localField: "specialOfferId",
          foreignField: "_id",
          as: "offerDetails",
        },
      },
      {
        $unwind: { path: "$offerDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "catDetails",
        },
      },
      {
        $unwind: { path: "$catDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "languages",
          localField: "languageId",
          foreignField: "_id",
          as: "langDetails",
        },
      },
      {
        $unwind: { path: "$langDetails", preserveNullAndEmptyArrays: true },
      },

      {
        $lookup: {
          from: "activitytypes",
          localField: "activityTypesId",
          foreignField: "_id",
          as: "activitytypeDetails",
        },
      },
      {
        $unwind: {
          path: "$activitytypeDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "sections",
          localField: "sectionId",
          foreignField: "_id",
          as: "sectionsDetails",
        },
      },
      {
        $unwind: { path: "$sectionsDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "activitysites",
          localField: "activitySiteId",
          foreignField: "_id",
          as: "activitysiteDetails",
        },
      },
      {
        $unwind: {
          path: "$activitysiteDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "cities",
          localField: "cityId",
          foreignField: "_id",
          as: "citiDetails",
        },
      },
      {
        $unwind: { path: "$citiDetails", preserveNullAndEmptyArrays: true },
      },

      {
        $lookup: {
          from: "countries",
          localField: "countryId",
          foreignField: "_id",
          as: "country",
        },
      },
      {
        $lookup: {
          from: "tourmodules",
          localField: "tourModuleId",
          foreignField: "_id",
          as: "tourModule",
        },
      },
      {
        $unwind: { path: "$tourModule", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "destinations",
          localField: "destination",
          foreignField: "_id",
          as: "destination",
        },
      },
      {
        $unwind: { path: "$destination", preserveNullAndEmptyArrays: true },
      },
      {
        $unwind: { path: "$country", preserveNullAndEmptyArrays: true },
      },

      {
        $addFields: {
          specialOfferName: "$offerDetails.specialOfferName",
          discountPercentage: "$offerDetails.discountPercentage",
          marchentFirstName: "$merDetails.firstName",
          marchentLastName: "$merDetails.lastName",
          cityName: "$citiDetails.cityName",
          tourModuleName : "$tourModule.name",
          destinationName: "$destination.name",
          countryName: "$country.name",
          activitySiteName: "$activitysiteDetails.siteName",
          sectionTitle: "$sectionsDetails.sectionTitle",
          activitytypeName: "$activitytypeDetails.name",
          language: "$langDetails.name",
          catDetails: "$catDetails.categoryName",
        },
      },
      {
        $project: {
          //citiDetails: 0,
          langDetails: 0,
          merDetails: 0,
          addedByid: 0,
          country: 0,
          activitytypeDetails: 0,
          sectionsDetails: 0,
          activitysiteDetails: 0,
          //citiDetails: 0,
          offerDetails: 0,
          //cityId: 0,
          // activitySiteId: 0,
          // categoryId: 0,
          // activityTypesId: 0,
          // countryId: 0,
          // languageId: 0,
          addedBy: 0,
          isDeleted: 0,
          __v: 0,
          createdOn: 0,
          updatedOn: 0,
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
        message: "View Tours....",
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







const editAvailability = async (req, res) => {
  try {
    const activityDetails = await availabilityModel
      .findOne({
        _id: new mongoose.Types.ObjectId(req.params.id),
        isApprove: false, 
        // visibleStatus: true,
      })
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

module.exports = {
  activityDetailsImage,
  addActivityDetails,
  editActivityDetails,
  viewActivityDetails,
  deleteActivityDetails,
  setActivityStatus,
  singleActivityDetails,
  viewDraftActivityDetails,
  singleDraftActivity,
  editAvailability
};
