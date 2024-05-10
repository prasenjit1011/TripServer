const mongoose = require("mongoose");
const random = require("random-string-alphanumeric-generator");
const Merchants = require("../../Models/merchant");
const activityDetailsModel = require("../../Models/activityDetails");
const activitySite = require("../../Models/activitySite");
const availabilityModel = require("../../Models/availability");
var moment = require("moment");
const newActivityDetails = require("../../Models/newActivityDetails");
const specialOfferModel = require("../../Models/specialOffer");
const ResponseCode = require("../../service/responseCode");
const { DBerror, InputError } = require("../../service/errorHandeler");
const S3 = require("../../service/s3");
const Destination = require("../../Models/destination");
const nodemailer = require('nodemailer');
const tempActivityDetails = require("../../Models/tempActivityDetails");
const admin = require("../../Models/admin");
const merchant = require("../../Models/merchant");
const invoiceModel = require("../../Models/invoice");
const cron = require("node-cron");
const userBooking = require("../../Models/userBooking");
const activityDetails = require("../../Models/activityDetails");
const Merchant = require("../../Models/merchant");
const Siteconfig  = require("../../Models/siteConfig");

const { HtmlToPdf } = require("../../service/pdfGenerator");
const { doPDFUpload } = require("../../service/s3")
const schedule = require('node-schedule');
const activityDetailsImage = async (req, res) => {
  let uploadData = await S3.doUpload(req, "activityDetails/image");

  if (uploadData.status) {
    res.send(uploadData);
  } else {
    res.send(uploadData);
  }
};


const generateProductCode = async(req,res) => {
  let merchantDetails = await Merchant.findById(req.body.addedByid);
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
  var check = await activityDetailsModel
    .findOne({
      _id: new mongoose.Types.ObjectId(req.body.id),
      saveAsDraft: true,
    })
    .exec();

  if (check) {
    activityDetailsModel
      .findOneAndUpdate(
        { _id: check._id },
        { ...req.body },
        { saveAsDraft: req.body.saveAsDraft }
      )

      .then((data) => {
        return res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "activity update sucessfully",
        });
      })
      .catch((error) => {
        const errors = DBerror(error);
        res.status(ResponseCode.errorCode.serverError).json({
          status: false,
          message: errors,
          error: error,
        });
      });
  } 
  else {
    // for random activityMarchentCode generate 
    let activityMarchentCode = "";
    let code = await activityDetailsModel
      .findOne({}, { activityMarchentCode: 1 })
      .sort({ createdOn: -1 })
      .exec();

    let inputString = "T000001";
    if (code == null || code.activityMarchentCode == null || code.activityMarchentCode == "") {
      activityMarchentCode = inputString;
    } else {
      const substring = Number(code.activityMarchentCode.slice(1)) + 1;
      activityMarchentCode = "T" + String(substring).padStart(6, '0');
    }
    
    // return false

    const titlecheck = await activityDetailsModel
      .find({
        activityTitle: req.body.activityTitle,
        isDeleted: false,
        saveAsDraft: false,
      })
      .exec();
    if (titlecheck.length > 0) {
      res.status(ResponseCode.errorCode.dataExist).json({
        status: false,
        message: "activityTitle already exist",
      });
    } else {
      const prioritycheck = await activityDetailsModel
        .find({
          topPriority: req.body.topPriority,
          isDeleted: false,
        })
        .exec();

      

      if (prioritycheck.length > 0) {
        var activitylength = await activityDetailsModel.find({
          isDeleted: false,
        });
        
        var activity = activitylength.length;
        await activityDetailsModel.findOneAndUpdate(
          { _id: new mongoose.Types.ObjectId(prioritycheck[0]._id) },
          {
            $set: {
              topPriority: Number(activitylength.length) + 1,
            },
          }
        );
      }

      let prodCodeData = await generateProductCode(req, res).then(data=>data).catch(err=>console.log(err));
      const activityDetailsData = {
        ...req.body,
        productCode: prodCodeData.newProductCode,
        addedByid: req.body.addedByid,
        activityMarchentCode: activityMarchentCode,
        topPriority: req.body.topPriority,
        addedBy: req.body.addedBy,
        isApproval: true,
        visibleStatus: true,
        saveAsDraft: req.body.saveAsDraft || false,
        referenceCode: random.randomAlphanumeric(10, "uppercase"),
        currency: typeof  req.body.currency == 'object' ? req.body.currency : JSON.parse(req.body.currency),
      };
      new activityDetailsModel(activityDetailsData)
        .save()
        .then(async(data) => {
          await Siteconfig.findOneAndUpdate({configName:"productCode", configMeta:prodCodeData.marchentCode},{configValue:parseInt(prodCodeData.configValue)+1}, {upsert: true});

          return res.status(ResponseCode.errorCode.success).json({
            status: true,
            message: "Activity Details added successfully",
            data: data
          });
        })
        .catch((error) => {
          const errors = DBerror(error);
          res.status(ResponseCode.errorCode.serverError).json({
            status: false,
            message: errors,
            error: error,
          });
        });
    }
  }
};

// const editActivityDetails = async (req, res) => {
//   const activityDetails = await activityDetailsModel.findOne({
//     _id: new mongoose.Types.ObjectId(req.params.id),
//   });
//   const offer = await specialOfferModel
//     .findOne({ _id: activityDetails.specialOfferId })
//     .exec();
//   if (activityDetails.specialOfferId == null) {
//     await activityDetailsModel
//       .findOneAndUpdate(
//         { _id: new mongoose.Types.ObjectId(req.params.id) },
//         {
//           ...req.body,
//         }
//       )
//       .then((data) => {
//         return res.status(ResponseCode.errorCode.success).json({
//           status: true,
//           message: "Activity details updated successfully",
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

//     await activityDetailsModel
//       .findOneAndUpdate(
//         { _id: new mongoose.Types.ObjectId(req.params.id) },
//         {
//           ...req.body,
//           activityDiscountPrice: discountedPrice,
//         }
//       )
//       .then((data) => {
//         return res.status(ResponseCode.errorCode.success).json({
//           status: true,
//           message: "Activity details updated successfully",
//           // data: data,
//         });
//       })
//       .catch((error) => {
//         const errors = DBerror(error);
//         res.status(ResponseCode.errorCode.serverError).json({
//           status: false,
//           message: errors,
//           error: error,
//         });
//       });
//   }
// };

const editActivityDetails1 = async (req, res) => {
  function update(priority, id) {
    
    activityDetailsModel
      .findOneAndUpdate(
        { _id: id },
        {
          ...req.body,
          $set: {
            topPriority: priority,
          },
        }
      )
      .exec();
  }
  const acti = await activityDetailsModel.findOne({
    _id: new mongoose.Types.ObjectId(req.params.id),
  });

  

  if (req.body.priority != undefined || req.body.priority != "") {
    const activityDetails = await activityDetailsModel
      .findOne({
        topPriority: req.body.priority,
      })
      .exec();

    

    if (activityDetails) {
      update(acti.topPriority, activityDetails._id);

      update(activityDetails.topPriority, acti._id);
    } else {
      update(req.body.priority, acti._id);
    }

    return res.status(ResponseCode.errorCode.success).json({
      status: true,
      message: "Activity details updated successfully",
      // data: data,
    });
  } else {
    update(req.body.priority, acti._id);

    return res.status(ResponseCode.errorCode.success).json({
      status: true,
      message: "Activity details updated successfully",
      // data: data,
    });
  }
};

const editActivityDetails = async (req, res) => {

  if (req.body.topPriority != undefined || req.body.topPriority != "") {

    activityDetailsModel.aggregate([
      {
        $match: {
          isDeleted: false,
          topPriority: req.body.topPriority,
        }
      }
    ])
      .then(async (data) => {
        
        if (data.length > 0) {

          var updateId = data[0]._id;
          

          var prioData = await activityDetailsModel.aggregate([
            {
              $match: {
                _id: new mongoose.Types.ObjectId(req.params.id),
              }
            },
            {
              $project: {
                topPriority: 1
              }
            }
          ]).exec();

          var ownPriority = prioData[0].topPriority;


          activityDetailsModel.findOneAndUpdate(
            { _id: { $in: [new mongoose.Types.ObjectId(req.params.id)] } },
            {
              ...req.body,
              updatedOn: new Date(),
            },
          )
            .then(async (data1) => {
              await activityDetailsModel.findOneAndUpdate(
                { _id: { $in: [new mongoose.Types.ObjectId(updateId)] } },
                {
                  topPriority: ownPriority,
                  updatedOn: new Date(),
                },
              )

              res.status(ResponseCode.errorCode.success).json({
                status: true,
                message: "ActivityDetails updated successfully",
              });
            })
            .catch((error) => {
              
              const errors = DBerror(error);
              res.status(ResponseCode.errorCode.serverError).json({
                status: false,
                message: "Server error,Please try again",
                error: errors,
              });
            });


        } else {

          activityDetailsModel.findOneAndUpdate(
            { _id: { $in: [new mongoose.Types.ObjectId(req.params.id)] } },
            {
              ...req.body,
              updatedOn: new Date(),
            },
          )
            .then((data) => {
              res.status(ResponseCode.errorCode.success).json({
                status: true,
                message: "ActivityDetails updated successfully",
              });
            })
            .catch((error) => {

              const errors = DBerror(error);
              res.status(ResponseCode.errorCode.serverError).json({
                status: false,
                message: "Server error,Please try again",
                error: errors,
              });
            });

        }

        
        // res.status(ResponseCode.errorCode.success).json({
        //   status: true,
        //   message: "updated successfully",
        // });
      })
      .catch((error) => {
        
        const errors = DBerror(error);
        res.status(ResponseCode.errorCode.serverError).json({
          status: false,
          message: "Server error,Please try again",
          error: error,
        });
      });

  } else {

    activityDetailsModel.findOneAndUpdate(
      { _id: { $in: [mongoose.Types.ObjectId(req.params.id)] } },
      {
        ...req.body,
        updatedOn: new Date(),
      },
    )
      .then((data) => {
        res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "ActivityDetails updated successfully",
        });
      })
      .catch((error) => {
        const errors = DBerror(error);
        res.status(ResponseCode.errorCode.serverError).json({
          status: false,
          message: "Server error,Please try again",
          error: errors,
        });
      });


  }

};

// const viewActivityDetails = async (req, res) => {
//   await activityDetailsModel
//     .aggregate([
//       {
//         $match: {
//           // activityTypeId: req.params.activityTypeId,
//           isApproval: true,
//           isDeleted: false,
//           visibleStatus: true,
//           rejectedStatus: false,
//           saveAsDraft: false,
//         },
//       },

//       {
//         $lookup: {
//           from: "tourmodules",
//           localField: "tourModuleId",
//           foreignField: "_id",
//           as: "tourModules",
//         },
//       },
//       {
//         $unwind: { path: "$tourModules", preserveNullAndEmptyArrays: true },
//       },

//       {
//         $lookup: {
//           from: "specialoffers",
//           localField: "specialOfferId",
//           foreignField: "_id",
//           as: "offerDetails",
//         },
//       },
//       {
//         $unwind: { path: "$offerDetails", preserveNullAndEmptyArrays: true },
//       },
//       {
//         $lookup: {
//           from: "categories",
//           localField: "categoryId",
//           foreignField: "_id",
//           as: "catDetails",
//         },
//       },
//       {
//         $unwind: { path: "$catDetails", preserveNullAndEmptyArrays: true },
//       },
//       {
//         $lookup: {
//           from: "languages",
//           localField: "languageId",
//           foreignField: "_id",
//           as: "langDetails",
//         },
//       },
//       {
//         $unwind: { path: "$langDetails", preserveNullAndEmptyArrays: true },
//       },

//       {
//         $lookup: {
//           from: "activitytypes",
//           localField: "activityTypesId",
//           foreignField: "_id",
//           as: "activitytypeDetails",
//         },
//       },
//       {
//         $unwind: {
//           path: "$activitytypeDetails",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       {
//         $lookup: {
//           from: "sections",
//           localField: "sectionId",
//           foreignField: "_id",
//           as: "sectionsDetails",
//         },
//       },
//       {
//         $unwind: { path: "$sectionsDetails", preserveNullAndEmptyArrays: true },
//       },
//       {
//         $lookup: {
//           from: "activitysites",
//           localField: "activitySiteId",
//           foreignField: "_id",
//           as: "activitysiteDetails",
//         },
//       },
//       {
//         $unwind: {
//           path: "$activitysiteDetails",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       {
//         $lookup: {
//           from: "cities",
//           localField: "cityId",
//           foreignField: "_id",
//           as: "citiDetails",
//         },
//       },
//       {
//         $unwind: { path: "$citiDetails", preserveNullAndEmptyArrays: true },
//       },

//       {
//         $lookup: {
//           from: "countries",
//           localField: "countryId",
//           foreignField: "_id",
//           as: "country",
//         },
//       },
//       {
//         $unwind: { path: "$country", preserveNullAndEmptyArrays: true },
//       },

//       {
//         $lookup: {
//           from: "merchants",
//           localField: "addedByid",
//           foreignField: "_id",
//           pipeline: [
//             {
//               $addFields: {
//                 fullName:
//                   { $concat: ["$firstName", " ", "$lastName"] }

//               }
//             }
//           ],
//           as: "merchant",
//         },
//       },
//       {
//         $unwind: { path: "$merchant", preserveNullAndEmptyArrays: true },
//       },
//       {
//         $lookup: {
//           from: "destinations",
//           pipeline: [
//             {
//               $project: {
//                 status: 0,
//                 topPriority: 0,
//                 isDeleted: 0,
//                 createdOn: 0,
//                 updatedOn: 0,
//                 __v: 0
//               }
//             }
//           ],
//           localField: "destination",
//           foreignField: "_id",
//           as: "destinationData",
//         },
//       },
//       {
//         $unwind: { path: "$destinationData", preserveNullAndEmptyArrays: true },
//       },



//       {
//         $addFields: {
//           specialOfferName: "$offerDetails.specialOfferName",
//           discountPercentage: "$offerDetails.discountPercentage",
//           marchentFirstName: "$merDetails.firstName",
//           marchentLastName: "$merDetails.lastName",
//           cityName: "$citiDetails.cityName",
//           countryName: "$country.name",
//           activitySiteName: "$activitysiteDetails.siteName",
//           sectionTitle: "$sectionsDetails.sectionTitle",
//           activitytypeName: "$activitytypeDetails.name",
//           language: "$langDetails.name",
//           catDetails: "$catDetails.categoryName",
//           tourModuleName: "$tourModules.name",
//           addedByName: "$merchant.fullName",
//           // destinationsName: "$destinationData.name"

//         },
//       },
//       {
//         $project: {
//           citiDetails: 0,
//           langDetails: 0,
//           merDetails: 0,
//           // addedByid: 0,
//           merchant: 0,
//           country: 0,
//           activitytypeDetails: 0,
//           sectionsDetails: 0,
//           activitysiteDetails: 0,
//           citiDetails: 0,
//           offerDetails: 0,
//           tourModules: 0,
//           // destinationData: 0,
//           destination: 0,
//           // cityId: 0,
//           // activitySiteId: 0,
//           // categoryId: 0,
//           // activityTypesId: 0,
//           // countryId: 0,
//           // languageId: 0,
//           addedBy: 0,
//           isDeleted: 0,
//           __v: 0,
//           createdOn: 0,
//           updatedOn: 0,
//         },
//       },
//       {
//         $sort: {
//           _id: -1,
//           createdOn: -1,
//         },
//       },
//     ])
//     .then((data) => {
//       return res.status(ResponseCode.errorCode.success).json({
//         status: true,
//         message: "View Tours",
//         data: data,
//       });
//     })
//     .catch((error) => {
//       const errors = DBerror(error);
//       res.status(ResponseCode.errorCode.serverError).json({
//         status: false,
//         message: errors,
//         error: error,
//       });
//     });
// }; 

const viewActivityDetails = async (req, res) => {


  // Temporary Fixxing
  //const { product_type } = req.params;
  let product_type = 'bookable_products';
  if(req.params.product_type == 'expire_product'){
    product_type = 'expire_product';
  }
  
  const currentDate = moment().format("YYYY-MM-DD");
  let matchCondition = {
    //isApproval: true,
    isDeleted: false,
    //visibleStatus: true,
    rejectedStatus: false,
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
    // 19022024 :: Need to check
    // Add activityDetails filter
    if(activityDetailsIds.length>0){
      //matchCondition['_id'] = { $in: activityDetailsIds };
    }
  }
  // Fetch activity details based on the filtered activityDetailsIds
  const data = await activityDetailsModel
    .aggregate([
      {
        $match: matchCondition,
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
          // pipeline: [
          //   {
          //     $addFields: {
          //       fullName:
          //         { $concat: ["$firstName", " ", "$lastName"] }
          //     }
          //   }
          // ],
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
          //citiDetails: 0,
          langDetails: 0,
          merDetails: 0,
          // addedByid: 0,
          //merchant: 0,
          //country: 0,
          //activitytypeDetails: 0,
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

  return res.status(ResponseCode.errorCode.success).json({
    status: true,
    message: "View Tours",
    data: data,
  });
};

// Prasenjit Aluni-23/02/2024
const viewDraftActivityDetails = async (req, res) => {

  await activityDetailsModel
    .aggregate([
      {
        $match: {
          //addedByid: req.user._id,
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
        $unwind: { path: "$country", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "tourmodules",
          localField: "tourModuleId",
          foreignField: "_id",
          as: "tourmoduledetails",
        },
      },
      {
        $unwind: { path: "$tourmoduledetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "destinations",
          localField: "destination",
          foreignField: "_id",
          as: "destinationdetails",
        },
      },
      {
        $unwind: { path: "$destinationdetails", preserveNullAndEmptyArrays: true },
      },

      {
        $lookup: {
          from: "merchants",
          localField: "addedByid",
          foreignField: "_id",
          as: "merDetails",
        },
      },
      {
        $unwind: { path: "$merDetails", preserveNullAndEmptyArrays: true },
      },

      {
        $addFields: {
          specialOfferName: "$offerDetails.specialOfferName",
          discountPercentage: "$offerDetails.discountPercentage",
          marchentFirstName: "$merDetails.firstName",
          marchentLastName: "$merDetails.lastName",
          destinationName: "$destinationdetails.name",
          tourModuleName: "$tourmoduledetails.name",
          cityId: "$citiDetails._id",
          cityName: "$citiDetails.cityName",
          cityNewName: "$citiDetails.cityName",
          countryName: "$country.name",
          activitySiteName: "$activitysiteDetails.siteName",
          sectionTitle: "$sectionsDetails.sectionTitle",
          activitytypeName: "$activitytypeDetails.name",
          language: "$langDetails.name",
          catDetails: "$catDetails.categoryName",
          marchentId: "$merDetails._id",
          marchentName: { $concat: ["$merDetails.firstName"," ", "$merDetails.lastName"] }
        },
      },
      {
        $sort: {
          // _id: -1,
          createdOn: -1,
        },
      },
      {
        $project: {
          //citiDetails: 0,
          langDetails: 0,
          //merDetails: 0,
          // addedByid: 0,
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
          //addedBy: 0,
          isDeleted: 0,
          __v: 0,
          //createdOn: 0,
          updatedOn: 0,
          //merchantData: 0
        },
      },

    ])
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "View Draft Activity",
        data: data,
      });
    })
    .catch((error) => {
      const errors = DBerror(error);
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: errors,
        error: error,
      });
    });
};

const deleteActivityDetails = async (req, res) => {

  // const check= await activityDetailsModel.findOne
  const check = await activityDetailsModel
    .findOne({ _id: new mongoose.Types.ObjectId(req.params.id) })
    .exec();
  
  // return false
  if (check?.isDeleted) {
    return res.status(ResponseCode.errorCode.dataNotFound).json({
      status: false,
      message: "activityId Not found",
      // data:check
    });
  } else {
    await activityDetailsModel
      .findOneAndUpdate(
        {
          _id: new mongoose.Types.ObjectId(req.params.id),
        },
        {
          isDeleted: true,
        }
      )
      .then((data) => {
        return res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "ActivityDetails delete successfully",
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
};

const setActivityStatus = async (req, res) => { 
  console.log("product activity ")
  var id = req.params.id;
  await activityDetailsModel.findById({ _id: id }).then(async (data) => {
    // return false
    if (data.status === true) {
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
            // data: data,s
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
  });
};

const singleActivityDetails = async (req, res) => {
  
  await activityDetailsModel
    .aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.params.id),
          isDeleted: false,
          status: true,
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
        message: "View single Activity activity",
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

const viewMerchantApprovalActivity = async (req, res) => {

  // return res.status(ResponseCode.errorCode.serverError).json({
  //   status: false,
  //   message: "hello"
  // });

  await activityDetailsModel
    .aggregate([
      {
        $match: {
          addedBy: "merchant",
          isDeleted: false,
          //isApproval: true,
          saveAsDraft: false,
        },
      },

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
          path: "$tempActivityData", preserveNullAndEmptyArrays: true
        }
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
          from: "merchants",
          localField: "merchantId",
          foreignField: "_id",
          as: "merDetails",
        },
      },
      {
        $unwind: { path: "$merDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $addFields: {
          specialOfferName: "$offerDetails.specialOfferName",
          discountPercentage: "$offerDetails.discountPercentage",
          //marchentCode: "$merDetails.marchentCode",
          marchentFirstName: "$merDetails.firstName",
          marchentLastName: "$merDetails.lastName",
          cityName: "$citiDetails.cityName",
          countryName: "$country.name",
          activitySiteName: "$activitysiteDetails.siteName",
          sectionTitle: "$sectionsDetails.sectionTitle",
          activitytypeName: "$activitytypeDetails.name",
          language: "$langDetails.name",
          catDetails: "$catDetails.categoryName",
          tourModuleName: "$tourModule.name",

        },
      },
      {
        $project: {
          citiDetails: 0,
          langDetails: 0,
          merDetails: 0,
          country: 0,
          activitytypeDetails: 0,
          sectionsDetails: 0,
          activitysiteDetails: 0,
          citiDetails: 0,
          offerDetails: 0,
          isDeleted: 0,
          __v: 0,
          tourModule: 0,
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
        message: "View Merchent Activity Rquest",
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

// const updateApprovalActivityReq = async (req, res) => {
//   // console.log(req);
//   await newActivityDetails
//     .findOneAndUpdate(
//       {
//         _id: new mongoose.Types.ObjectId(req.params.id),
//       },
//       {
//         isApproval: true,
//       },
//       {
//         new: true,
//       }
//     )
//     .then(async (data) => {
//       // console.log("data",data);
//       // return false
//       if (data) {
//         await activityDetailsModel
//           .findOneAndUpdate(
//             {
//               _id: data.activityId,
//             },
//             {
//               categoryId: data.categoryId,
//               activityTypesId: data.activityTypesId,
//               activitySiteId: data.activitySiteId,
//               cityId: data.cityId,
//               countryId: data.countryId,
//               languageId: data.languageId,
//               tourModuleId: data.tourModuleId,
//               tourPerson: data.tourPerson,
//               tourDuration: data.tourDuration,
//               slug: data.slug,
//               activityTitle: data.activityTitle,
//               description: data.description,
//               image: data.image,
//               activityActualPrice: data.activityActualPrice,
//               tourActivity: data.tourActivity,
//               information: data.information,
//               meetingPoint: data.meetingPoint,
//               importentInfo: data.importentInfo,
//               activityCoordinates: data.activityCoordinates,
//               priority: data.priority,
//               participentType: data.participentType,
//               currency: data.currency,
//               startDate: data.startDate,
//               endDate: data.endDate,
//               isApproval: data.isApproval,
//               isDeleted:data.isDeleted
//             },
//             {
//               new: true,
//             }
//           )
//           // console.log(q);
//           .then((data) => {
//             // console.log("isApproval",data.isApproval);
//             res.status(200).json({
//               status: true,
//               message: "Activity Approval Updated Sucessfully",
//               // data: data,
//             });
//           });
//       }
//     })
//     .catch((error) => {
//       console.log(error);
//       const errors = DBerror(error);
//       return res.status(ResponseCode.errorCode.serverError).json({
//         status: false,
//         message: "Server error,Please try again",
//         error: errors,
//       });
//     });
// };

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

//Prasenjit Aluni
const updateApprovalActivityReq = async (req, res) => {
  let activitydata = req.body.activityDetailsId
  let activityDetail = await activityDetailsModel.findOne({ isDeleted: false, _id: new mongoose.Types.ObjectId(activitydata) }).exec()
  let merchantData = activityDetail.addedByid
  let mailfind = await Merchants.findOne({ isDeleted: false, _id: new mongoose.Types.ObjectId(merchantData) }).exec()
  let merchantMail = mailfind.email
  let firstName = mailfind.firstName
  let lastName = mailfind.lastName
  const mailOption = {
    from: "thingstodoo85@gmail.com",
    to: merchantMail,
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
          <p>Dear ${firstName} ${lastName},</p>
          <p>We are excited to inform you that your activity product has been Approved ,</p>
          <p>Best regards,</p>
          <p>ThingsToDo</p>
        </div>
        </body>
      </html>
    `,
  };
  const rejectmailOption = {
    from: "thingstodoo85@gmail.com",
    to: merchantMail,
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
          <p>Dear ${firstName} ${lastName},</p>
          <p>Sorry to say, your activity product has been rejected ,</p>
          <p>Best regards,</p>
          <p>ThingsToDo</p>
        </div>
        </body>
      </html>
    `,
  };

  if (req.body.isApproval == true && req.body.rejectedStatus == false) {
    if (req.body.updatedStatus == true) {
      activityDetailsModel
        .findOneAndUpdate(
          {
            _id: new mongoose.Types.ObjectId(req.body.activityDetailsId),
          },
          { ...req.body, updatedStatus: false, updatedOn: new Date() }
        )
        .exec();

      // Find and update tempActivityDetails based on activityDetailsId
      const tempActivtyDetailsData = await tempActivityDetails
        .findOneAndUpdate(
          { activityDetailsId: new mongoose.Types.ObjectId(req.body.activityDetailsId) },
          { isEdited: false },
          {  upsert: true } 
        )
        .exec();
      // activityDetailsModel
      //   .deleteOne({
      //     _id: new mongoose.Types.ObjectId(req.params.id),
      //   })
      //   .exec();

      // calculateActivity(req.body.specialOfferId);
    } else { activityDetailsModel.findOneAndUpdate(
          {
            _id: new mongoose.Types.ObjectId(req.params.id),
          },
          { ...req.body, updatedOn: new Date() }
        )
        .exec();
      // calculateActivity(req.body.id);
    }
    // Find and update tempActivityDetails based on activityDetailsId
    const tempActivtyDetailsData = await tempActivityDetails
      .findOneAndUpdate(
        { activityDetailsId: new mongoose.Types.ObjectId(req.params.id) },
        { isEdited: false },
        {  upsert: true } 
      )
      .exec();

    const newData = await tempActivityDetails
        .find(
          { activityDetailsId: new mongoose.Types.ObjectId(req.params.id) })
        .exec();


    if(newData.length && newData[0].isApproval){
      newData[0]._id        = req.params.id;
      newData[0].isApproval = true;
      newData[0].isEdited   = false;

      activityDetailsModel
        .deleteOne({_id: new mongoose.Types.ObjectId(req.params.id)})
        .then(function(){
            activityDetailsModel.insertMany(newData);
            console.log("Data deleted and Added"); // Success
        }).catch(function(error){
            console.log(error); // Failure
        });  
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
      message: "Activity updated sucessfully",
    });
  } else if (req.body.isApproval == false && req.body.rejectedStatus == true) {
    // if (req.body.updatedStatus == true) {
    activityDetailsModel
      .findOneAndUpdate(
        {
          _id: new mongoose.Types.ObjectId(req.params.id),
        },
        { ...req.body, updatedOn: new Date() }
      )
      .then(async (data) => {

        transporter.sendMail(rejectmailOption, function (error, info) {
          // console.log("mailOption===",mailOption);
          if (error) {
            console.log(error);
          } else {
            console.log("Email has been sent:- ", info.response);
          }
        });
        return res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "Activity details request rejected",
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
};

const addDestination = async (req, res) => {
  var checkCity = Destination.aggregate([
    {
      $match: {
        topPriority: req.body.topPriority,
        isDeleted: false,
      },
    },
  ])
    .then(async (data) => {
      if (data.length > 0) {
        var updateID = data[0]._id;

        var destinationName = await Destination.aggregate([
          {
            $match: {
              isDeleted: false,
            },
          },
          {
            $sort: {
              topPriority: -1,
            },
          },
          {
            $limit: 1,
          },
          {
            $project: {
              topPriority: 1,
            },
          },
        ]).exec();

        var priorityOld = destinationName[0].topPriority;
        var priorityNew = priorityOld + 1;

        new Destination({
          ...req.body,
          createdOn: new Date(),
        })
          .save()
          .then(async (result) => {
            await Destination.findOneAndUpdate(
              { _id: { $in: [new mongoose.Types.ObjectId(updateID)] } },
              {
                $set: {
                  topPriority: priorityNew,
                },
                updatedOn: new Date(),
              }
            ).exec();

            res.status(ResponseCode.errorCode.success).json({
              status: true,
              message: "destination added sucessfully",
            });
          })
          .catch((error) => {
            const errors = DBerror(error);
            res.status(ResponseCode.errorCode.serverError).json({
              status: false,
              message: errors,
              error: error,
            });
          });
      } else {
        new Destination({
          ...req.body,
          createdOn: new Date(),
        })
          .save()
          .then((data) => {
            res.status(ResponseCode.errorCode.success).json({
              status: true,
              message: "destination added sucessfully",
            });
          })
          .catch((error) => {
            const errors = DBerror(error);
            res.status(ResponseCode.errorCode.serverError).json({
              status: false,
              message: errors,
              error: error,
            });
          });
      }
    })
    .catch((error) => {
      const errors = DBerror(error);
      res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: errors,
        error: error,
      });
    });
};

const editDestination = async (req, res) => {

  const { id } = req.params
  try {
    const updatedData = await Destination.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id) },
      { ...req.body },
      { new: true }
    )
    res.status(200).json({ status: true, msg: "Data updated successfully ", data: updatedData })
  } catch (error) {
    res.status(500).json({ status: true, msg: "Server Error !!", data: error.message })
  }

}

const delDestination = async (req, res) => {
  const { id } = req.params
  try {
    const deleteData = await Destination.findOneAndDelete(
      { _id: new mongoose.Types.ObjectId(id) },
    )
    res.status(200).json({ status: true, msg: "Data Deleted successfully ", data: deleteData })
  } catch (error) {
    res.status(500).json({ status: true, msg: "Server Error !!", data: error.message })
  }
}

const viewDestintionAll = async (req, res) => {
  Destination.aggregate([
    {
      $lookup: {
        from: "activitysites",
        localField: "siteId",
        foreignField: "_id",
        as: 'sitedata'
      }
    },
    { $match: {} }   
  ])
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "view all of the destinations",
        data: data,
      });
    })
    .catch((error) => {
      const errors = DBerror(error);
      res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: errors,
        error: error,
      });
    });

}

const viewDestintion = async (req, res) => {
  Destination.aggregate([
    { $match: { siteId: new mongoose.Types.ObjectId(req.params.siteId) } },
  ])
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "view all destination",
        data: data,
      });
    })
    .catch((error) => {
      const errors = DBerror(error);
      res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: errors,
        error: error,
      });
    });
};

const siteNameAgainstCity = async (req, res) => {
  activitySite
    .aggregate([
      {
        $match: {
          cityId: new mongoose.Types.ObjectId(req.params.cityid),
          isDeleted: false
        },
      },
      {
        $project: {
          isDeleted: 0,
          status: 0,
          __v: 0,
          cityId: 0
        }
      }

    ])
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "view all sites againt city and country",
        data: data,
      });
    })
    .catch((error) => {
      const errors = DBerror(error);
      res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: errors,
        error: error,
      });
    });
};

const calenderwiseAvailability = async (req, res) => {
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

  availabilityModel.aggregate([
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
    {
      $match: {
        isDeleted: false,
        activityDetailsId: new mongoose.Types.ObjectId(req.body.id),
        year: year,
        $or: [
          { month: month1 },
          { month: month2 }
        ]

      },
    },
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
    }

  ]).then((data) => {
    //console.log({ data })

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

const marchantList = async (req, res) => {
  try {
    const adminData = await admin.findOne({ firstName: "SUPER" }, { _id: 1 });
    if (!adminData) {
      return "no admin found"
    }
    const adminId = adminData._id;
    const adminMarchantData = await merchant.find({
      addedBy: adminId,
      isApproval: true,
      isDeleted: false
    }, { _id: 1 });
    if (adminMarchantData.length === 0) {
      return "no marchant found"
    }
    const allMarchantId = adminMarchantData.map(item => item._id)
    console.log("allMarchantId====", allMarchantId);
    return allMarchantId;

  } catch (error) {
    console.log("error is===", error);
  }
};


const generateInvoiceNumber = async (length) => {
  const characters = "0123456789";
  let invoiceNumber = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    invoiceNumber += characters.charAt(randomIndex);
  }
  return invoiceNumber;
}



const aggregateBookingData = async (marchantId) => {
  const date = new Date();

  // console.log(req.user._id);
  const formattedDate = moment(date).format("YYYY-MM-DD");
  const currentMonth = date.getMonth() + 1; 
  console.log("formattedDate", formattedDate);
  return userBooking.aggregate([
    {
      $match: {
        isDeleted: false,
        bookingType: "activity",
        // bookingDate: { $gte: formattedDate },
         $expr: {
            $eq: [
              { $month: { $toDate: "$bookingDate" } },
              currentMonth,
            ],
          },
      },
    },
    {
      $lookup: {
        from: "activitydetails",
        localField: "activityDetailsId",
        foreignField: "_id",
        pipeline: [
          {
            $match: {
              addedByid: marchantId,
            },
          },
          {
            $addFields: {
              countryId: "$countryId",
            },
          },
          {
            $lookup: {
              from: "cxommissionpercentages",
              localField: "addedByid",
              foreignField: "merchantID",
              as: "addedBy",
              pipeline: [
                {
                  $match: {
                    isDeleted: false,
                  },
                },
                {
                  $project: {
                    _id: 0,
                  },
                },
              ],
            },
          },
          { $unwind: { path: "$addedBy", preserveNullAndEmptyArrays: true } },
          {
            $addFields: {
              marchentCommisonPercentage: {
                $switch: {
                  branches: [
                    {
                      case: { $eq: ["$addedBy.commissionType", "individualLevel"] },
                      then: "$addedBy.commissionPercentage",
                    },
                    {
                      case: { $eq: ["$addedBy.commissionType", "global"] },
                      then: "$addedBy.commissionPercentage",
                    },
                    {
                      case: {
                        $eq: [
                          "$addedBy.commissionType", "countryWise",
                        ],
                      },
                      then: {
                        $cond: {
                          if: {
                            $eq: [
                              "$addedBy.commissionType",
                              "countryWise",
                            ],
                          },
                          then: {
                            $let: {
                              vars: {
                                matchingCountry: {
                                  $arrayElemAt: [
                                    {
                                      $filter: {
                                        input: "$addedBy.countryWisePercentage",
                                        as: "country",
                                        cond: {
                                          $eq: [
                                            "$$country.countryID",
                                            "$countryId",
                                          ],
                                        },
                                      },
                                    },
                                    0,
                                  ],
                                },
                              },
                              in: {
                                $cond: {
                                  if: { $ne: ["$$matchingCountry", null] },
                                  then: "$$matchingCountry.commissionPercentage",
                                  else: null,
                                },
                              },
                            },
                          },
                          else: "$addedBy.commissionPercentage",
                        },
                      },
                    },
                  ],
                  default: null,
                },
              },
            },
          },
          {
            $project: {
              countryId: 1,
              marchentCommisonPercentage: 1,
              activityTitle: 1,
              referenceCode: 1,
              productCode: 1,
              createdOn: 1,
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
        from: "users",
        localField: "userId",
        foreignField: "_id",
        pipeline: [
          {
            $project: {
              firstName: 1,
              lastName: 1,
              email: 1,
              mobileNo: 1,
              fullName: { $concat: ["$firstName", " ", "$lastName"] },
            },
          },
        ],
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
      $addFields: {
        activityName: "$activity.activityTitle",
        activityReferenceID: "$activity.referenceCode",
        avtivtyProductCode: "$activity.productCode",
        activityDate: "$activity.createdOn",
        userName: "$userDetails.fullName",
        bookingRefId: "$alpfaNueID",
        bookingDate: "$bookingDate",
        bookingTime: "$bookingTime",
        bookingAmmount: "$amount",
        // bookingAmmount: {
        //   $round: ["$amount", 2],
        // },
        marchentCommisonPercentage: "$activity.marchentCommisonPercentage",
        marchentGetPrice: {
          $round: [
            {
              $subtract: [
                "$amount",
                {
                  $multiply: [
                    "$amount",
                    { $divide: ["$activity.marchentCommisonPercentage", 100] },
                  ],
                },
              ],
            },
            2,
          ],
        },
      },
    },
    {
      $addFields: {
        adminGetPrice: {
          $round: [
            {
              $subtract: [
                "$bookingAmmount",
                "$marchentGetPrice"
              ],
            },
            2,
          ],
        },
      },
    },

    {
      $sort: {
        createdOn: -1,
      },
    },
    {
      $project: {
        activity: 1,
        activityName: 1,
        activityReferenceID: 1,
        avtivtyProductCode: 1,
        activityDate: 1,
        userName: 1,
        bookingRefId: 1,
        bookingDate: 1,
        bookingTime: 1,
        bookingAmmount: 1,
        marchentCommisonPercentage: 1,
        marchentGetPrice: 1,
        adminGetPrice: 1
      },
    },
  ]);
};

const marchantInvoice = async (req, res) => {
  try {
    const marchantListData = await marchantList();

    if (marchantListData === "no admin found" || marchantListData === "no marchant found") {
      console.log(`Error: ${marchantListData}`);
      // return res.json({ message: "Invalid request" });
    }

    const invoices = [];

    for (const marchantId of marchantListData) {
      try {
        const data = await aggregateBookingData(marchantId);

        const result1 = data.filter((a) => a.activity !== null && a.activity !== undefined);
        console.log("result====", result1);
        // return false
        const bookingTotalAmmountWithOutRound = result1.reduce((total, item) => total + (item.bookingAmmount || 0), 0);
        const bookingTotalAmmount = parseFloat(bookingTotalAmmountWithOutRound.toFixed(2));

        const marchentTotalGetPriceWtihoutRound = result1.reduce((total, item) => total + (item.marchentGetPrice || 0), 0);
        const marchentTotalGetPrice = parseFloat(marchentTotalGetPriceWtihoutRound.toFixed(2));

        const adminTotalGetPriceWithoutRound = result1.reduce((total, item) => total + (item.adminGetPrice || 0), 0);

        const adminTotalGetPrice = parseFloat(adminTotalGetPriceWithoutRound.toFixed(2));


        var result = "";
        function formatDate(dateString) {
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep","Oct", "Nov", "Dec",];

          const date = new Date(dateString);
          const year = date.getFullYear();
          const month = months[date.getMonth()];
          const day = date.getDate();

          return `${month} ${day}, ${year}`;
        }


        const invoiceNumber = await generateInvoiceNumber(13);

        const inputDateString = new Date();
        const formattedDate = formatDate(inputDateString);
        console.log(formattedDate);
        var timestamp = `${new Date().getDate()}${new Date().getHours()}${new Date().getSeconds()}${new Date().getMilliseconds()}`;

        let options = {
          format: "A4",
          landscape: false,
        };

        var result = "";

        result +=
          `<section style="width: 100%; height: auto; padding: 30px 0px;">
        <div style="max-width: 95%; width: 100%; margin: 0px auto;">

            <div style="width: 80px; height: 60px;">
            <img src="https://i.ibb.co/Jj1Fg7v/things-to-doo-logo.png" alt="things-to-doo-logo"
            style="width: 100%; height: 100%;">
            </div>

            <div style="padding: 50px 0px;">
                <table style="width: 100%;">
                    <tr>
                        <td style="font-size: 15px; color: #000; width: 70%;">Finn Tours LTD</td>
                        <td style="font-size: 15px; color: #000; width: 15%; padding-left: 5%;">Receipt date:</td>
                        <td style="font-size: 15px; color: #000; text-align: end; width: 15%;">${formattedDate}</td>
                    </tr>

                    <tr>
                        <td style="width: 70%;">121 Fitzroy Ave, Belfast</td>
                        <td style="font-size: 15px; color: #000; width: 15%; padding-left: 5%;">Invoice no.:</td>
                        <td style="font-size: 15px; color: #000; text-align: end; width: 15%;">${invoiceNumber}</td>
                    </tr>

                    <tr>
                        <td style="font-size: 15px; color: #000; width: 70%;">BT71HU Belfast</td>
                        <td style="width: 15%;"></td>
                        <td style="width: 15%;"></td>
                    </tr>

                    <tr>
                        <td style="font-size: 15px; color: #000; width: 70%;">Northern Ireland</td>
                        <td style="width: 15%;"></td>
                        <td style="width: 15%;"></td>
                    </tr>

                    <tr>
                        <td style="font-size: 15px; color: #000; width: 70%;">United Kingdom</td>
                        <td style="width: 15%;"></td>
                        <td style="width: 15%;"></td>
                    </tr>
                </table>
            </div>

            <table style="width: 100%;">
                <tr>
                    <td style="font-size: 15px; font-weight: 600;">Invoice for payment generated until: ${formattedDate}</td>
                </tr>
                <tr>
                    <td></td>
                    <td style="text-align: end; font-size: 15px; color: #000; font-weight: 600;">Amount (GBP)</td>
                </tr>
                <tr>
                    <td style="font-size: 15px; color: #000;">Service Commission (in accordance with attached detail)</td>
                    <td style="text-align: end; font-size: 15px; color: #000;">${adminTotalGetPrice}</td>
                </tr>
            </table>

            <p style="font-size: 15px; font-weight: 600; margin-top: 50px;">Balance</p>

            <table style="width: 100%; border-bottom: 1px solid grey;">
                <tr>
                    <td></td>
                    <td style="text-align: end; font-size: 15px; color: #000; font-weight: 600;">Amount (GBP)</td>
                </tr>
                <tr>
                    <td style="font-size: 15px; color: #000;">Total Bookings</td>
                    <td style="text-align: end; font-size: 15px; color: #000;">${bookingTotalAmmount}</td>
                </tr>
                <tr>
                    <td style="font-size: 15px; color: #000;">./. our Commission</td>
                    <td style="text-align: end; font-size: 15px; color: #000;">-${adminTotalGetPrice}</td>
                </tr>
            </table>

            <table style="width: 100%; margin-top: 5px;">
                <tr>
                    <td style="font-weight: 600;">Net balance in your favor</td>
                    <td style="text-align: end; font-weight: 600;">${marchentTotalGetPrice}</td>
                </tr>
            </table>
            <p style="width: 50%; color: #000; font-size: 15px; line-height: 26px;">The payment is issued on every 5th working day of the following month. In case you
                opted in for the more frequent payment program, we also issue your payments on the 20th of every month.</p>

            <p style="color: #000; font-size: 15px; line-height: 26px;">Reverse Charge</p>


            <p style="padding-top: 100px; font-weight: 600; margin-bottom: 8px;">Thingstodooo Deutschland GmbH</p>
            
            <table style="width: 100%;">
                <tr>
                    <td style="border-right: 1px solid grey; vertical-align: top; width: 30%;">
                        <div>
                            <p style="margin: 5px 0px;">Sonnenburger Strasse 73</p>
                            <p style="margin: 5px 0px;">10437 Berlin</p>
                            <p style="margin: 5px 0px;">Germany</p>
                        </div>
                    </td>
                    <td style="border-right: 1px solid grey; vertical-align: top; width: 30%;">
                        <div style="padding: 0px 20%;">
                            <p style="margin: 5px 0px;">Phone: +49 30 568 394 45</p>
                            <p style="margin: 5px 0px;">supplier@Thingstodooo.com</p>
                            <p style="margin: 5px 0px;">www.Thingstodooo.com</p>
                        </div>
                    </td>
                    <td style="vertical-align: top; width: 30%;">
                        <div style="padding: 0px 20%;">
                            <p style="margin: 5px 0px;">Amtsgericht Charlottenburg</p>
                            <p style="margin: 5px 0px;">HRB 132059</p>
                            <p style="margin: 5px 0px;">VAT ID No. DE276456081</p>
                            <p style="margin: 5px 0px;">Managing Directors: Johannes Reck, Tao </p>
                            <p style="margin: 5px 0px;">Tao, Nils Chrestin</p>
                        </div>
                    </td>
                    <td style="vertical-align: bottom; width: 5%; text-align: end;">1/2</td>
                </tr>
            </table>
        </div>
        </section>`
        result +=
          `<section style="width: 100%; height: auto; padding: 30px 0px;">
        <div style="max-width: 95%; width: 100%; margin: 0px auto;">
            <div style="padding: 30px 0px;">
                <table style="width: 100%;">
                    <tr>
                        <td style="text-align: end; color: #000; font-size: 15px; font-weight: 500;">${formattedDate}
                        </td>
                    </tr>
                    <tr>
                        <td style="text-align: end; font-size: 15px; font-weight: 500;">${invoiceNumber}</td>
                    </tr>
                </table>

                <table style="width: 100%; padding-top: 30px;">
                    <tr style="background-color: #d7d7d7;">
                        <th style="color: #000; padding: 10px 5px; width: 20%;">Booking ID</th>
                        <th style="color: #000; padding: 10px 5px; width: 20%;">Date Of Activity</th>
                        <th style="color: #000; padding: 10px 5px; width: 20%;">Product Reference Code</th>
                        <th style="color: #000; padding: 10px 5px; width: 20%;">Retail Rate</th>
                        <th style="color: #000; padding: 10px 5px; width: 20%;">Retail rate minus
                            commission</th>
                    </tr>`;
        for (let index = 0; index < result1.length; index++) {

          result +=
            `<tr>
                <td style="text-align: center; font-size: 14px; padding: 10px 5px;">${result1[index].bookingRefId}</td>
                <td style="text-align: center; font-size: 14px; padding: 10px 5px;">${result1[index].bookingDate}</td>
                <td style="text-align: center; font-size: 14px; padding: 10px 5px;">${result1[index].activityReferenceID}</td>
                <td style="text-align: center; font-size: 14px; padding: 10px 5px;">${result1[index].bookingAmmount}</td>
                <td style="text-align: center; font-size: 14px; padding: 10px 5px;">${result1[index].adminGetPrice}</td>
           </tr>`
        }
        result +=
          `</table>

                <p style="padding-top: 100px; font-weight: 600; margin-bottom: 8px;">Thingstodooo Deutschland GmbH</p>

                <table style="width: 100%;">
                    <tr>
                        <td style="border-right: 1px solid grey; vertical-align: top; width: 30%;">
                            <div>
                                <p style="margin: 5px 0px;">Sonnenburger Strasse 73</p>
                                <p style="margin: 5px 0px;">10437 Berlin</p>
                                <p style="margin: 5px 0px;">Germany</p>
                            </div>
                        </td>
                        <td style="border-right: 1px solid grey; vertical-align: top; width: 30%;">
                            <div style="padding: 0px 20%;">
                                <p style="margin: 5px 0px;">Phone: +49 30 568 394 45</p>
                                <p style="margin: 5px 0px;">supplier@Thingstodooo.com</p>
                                <p style="margin: 5px 0px;">www.Thingstodooo.com</p>
                            </div>
                        </td>
                        <td style="vertical-align: top; width: 30%;">
                            <div style="padding: 0px 20%;">
                                <p style="margin: 5px 0px;">Amtsgericht Charlottenburg</p>
                                <p style="margin: 5px 0px;">HRB 132059</p>
                                <p style="margin: 5px 0px;">VAT ID No. DE276456081</p>
                                <p style="margin: 5px 0px;">Managing Directors: Johannes Reck, Tao </p>
                                <p style="margin: 5px 0px;">Tao, Nils Chrestin</p>
                            </div>
                        </td>
                        <td style="vertical-align: bottom; width: 5%; text-align: end;">2/2</td>
                    </tr>
                </table>
            </div>
        </div>
    </section>`;



        let file = result;
        let path = "pdf/" + timestamp + ".pdf"

        const pdfBuffer = await HtmlToPdf(file, options);
        console.log("pdf buffer file===", pdfBuffer);
        const uploadResult = await doPDFUpload(pdfBuffer, timestamp);

        // if (uploadResult.status) {
        //   return res.status(200).json({
        //     status: true,
        //     data: uploadResult.url,
        //     message: "Pdf Created and Uploaded Successfully",
        //   });
        // } else {
        //   return res.status(500).json({
        //     status: false,
        //     error: uploadResult.error,
        //     message: "Error uploading PDF to AWS S3",
        //   });
        // ;

        const invoiceUrl = uploadResult.url;
        const invoiceData = {
          invoiceUrl: invoiceUrl,
          marchantId: marchantId,
          invoiceNo: invoiceNumber,
          status: true,
          createdOn: new Date(),
          bookingTotalAmmount: parseFloat(bookingTotalAmmount.toFixed(2)),
          merchentGetAmmount: parseFloat(marchentTotalGetPrice.toFixed(2)),
          adminGetAmmount: parseFloat(adminTotalGetPrice.toFixed(2)),
        };

        const newInvoice = new invoiceModel(invoiceData);
        await newInvoice.save();
        invoices.push(invoiceData);
      } catch (error) {
        console.log("Error processing merchant ID", marchantId, ":", error);
      }
    }

    // return res.json({ message: "Invoices created successfully", invoices });
  } catch (error) {
    console.log("Error:", error);
    // return res.json({ message: "Server error, Please try again later" });
  }
};

// const scheduleInvoiceGenereateForMarchant = () => {
//   // Schedule the cron job to run every 24 hours
//   cron.schedule('*/1 * * * *', async () => {
//     console.log("hut====");
//     // await marchantInvoice();
//   });
// };

const scheduleInvoiceGenereateForMarchant = () => {
  // Schedule the cron job to run at 11:57 PM on the last day of every month
  const cronExpression = '57 23 L * *';

  const job = schedule.scheduleJob(cronExpression, async () => {
    console.log("Cron job triggered at 11:57 PM on the last day of the month");
    await marchantInvoice();
  });
};

const merchantActivityList = async (req, res) => {

  let merchantid = req.params.merchantid;
  console.log('-: merchantid :-', merchantid);

  const activityList = await activityDetails
                              .aggregate([
                                {
                                  $match: {
                                    addedByid: new mongoose.Types.ObjectId(merchantid),
                                    isDeleted: false,
                                    saveAsDraft: false,
                                    isApproval: true,
                                    visibleStatus: true,
                                    status: true,
                                  },
                                },
                                {
                                  $lookup:
                                  {
                                    from: "reviewratings", 
                                    foreignField: "activityDetailsId", 
                                    localField: "_id", 
                                    as: "reviews"
                                  }
                                },
                                {
                                  $addFields: {
                                    reviewAvgRating: { $sum: { $avg: "$reviews.avgRating" } },
                                  },
                                },
                                // {
                                //   "$project": {
                                //     _id: 1,
                                //     activityTitle: 1,
                                //     addedByid:1,
                                //     reviewCnt: { $size: "$reviews" },
                                //     reviews:1,
                                //     reviewAvgRating:1
                                //   }
                                // },
                            ]);

  return res.status(ResponseCode.errorCode.success).json({
    status: true,
    message: "Merchant Activity List",
    data:activityList
  });
}



module.exports = {
  merchantActivityList,
  activityDetailsImage,
  addActivityDetails,
  editActivityDetails,
  viewActivityDetails,
  deleteActivityDetails,
  setActivityStatus,
  singleActivityDetails,
  viewDraftActivityDetails,
  singleDraftActivity,
  viewMerchantApprovalActivity,
  updateApprovalActivityReq,
  addDestination,
  editDestination,
  delDestination,
  viewDestintionAll,
  viewDestintion,
  siteNameAgainstCity,
  calenderwiseAvailability,
  marchantInvoice,
  scheduleInvoiceGenereateForMarchant
};


