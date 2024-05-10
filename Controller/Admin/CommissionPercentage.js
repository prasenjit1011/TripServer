const mongoose = require("mongoose");
const CommissionPercentage = require("../../Models/commissionPercentage");
const merchantModel = require("../../Models/merchant");
const ResponseCode = require("../../service/responseCode");
const UserBooking = require("../../Models/userBooking");

const { DBerror, InputError } = require("../../service/errorHandeler");

const addCommissionPercentage = async (req, res) => {
  // Progress : Add Commission Percentage
  console.log('\n\n\n\n-------------------------------\n\n');



  let commissionData = {
    ...req.body,
    createdOn: new Date(),
  };


  /*
  console.log('Body Data : ',req.body.countryWisePercentage);


  commissionData = {
    merchantID: req.body.merchantID,
    commissionType: req.body.commissionType,
    countryID: null,
    commissionPercentage:req.body.commissionPercentage
  }



  /*if(commissionData.commissionType != 'countryWise'){
    commissionData.countryWisePercentage = null;
  }
  console.log(commissionData.countryWisePercentage)*/
  //console.log(commissionData)
  




  await CommissionPercentage(commissionData)
    .save()
    .then((data) => {
      res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "commission added successfully !",
      });
    })
    .catch((error) => {
      res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error , please try again !",
      });
    });
};

const marchentListWithoutCommission = async (req, res) => {
  try {
    const commissionMerchantIDs = await CommissionPercentage.find({}, { merchantID: 1 });
    const commissionMerchantIDArray = commissionMerchantIDs.map(item => item.merchantID);

    const marchentList = await merchantModel.find({
      isDeleted: false,
      isApproval: true,
      _id: { $nin: commissionMerchantIDArray }
    }, {fullName: {$concat: ["$firstName", " ", "$lastName"] }});

    res.status(ResponseCode.errorCode.success).json({
      status: true,
      message: "Merchant list fetched successfully!",
      data: marchentList, 
    });

  } catch (error) {
    console.log("Error is:", error);
    res.status(ResponseCode.errorCode.serverError).json({
      status: false,
      message: "Server error, please try again!",
    });
  }
}


// const viewCommissionPercentage = (req, res) => {
//   CommissionPercentage.aggregate([
//     {
//       $match: {
//         isDeleted: false
//       },
//     },
//         {
//       $lookup: {
//         from: 'merchants',
//         localField: "merchantID",
//         foreignField: "_id",
//         pipeline: [
//           {
//             $project: {
//               fullName: {
//                 $concat: ["$firstName", " ", "$lastName"]
//               }
//             }
//           }
//         ],
//         as: "marchantDetails"
//       }
//     },
//     {
//       $unwind: {path: "$marchantDetails", preserveNullAndEmptyArrays: true}
//     },
//     {
//       $addFields: {fullName: "$marchantDetails.fullName"}
//     },


//     {
//       $project: {
//         updatedOn: 0,
//         createdOn: 0,
//         isDeleted: 0,
//         status: 0,
//       },
//     },
//   ])
//     .then((data) => {
//       res.status(ResponseCode.errorCode.success).json({
//         status: true,
//         message: "View successfully !",
//         data: data,
//       });
//     })
//     .catch((error) => {
//       res.status(ResponseCode.errorCode.serverError).json({
//         status: false,
//         message: "Server error,please try again!",
//       });
//     });
// };

// {
//   $lookup: {
//     from: 'countries',
//     localField: "countryWisePercentage.countryID",
//     foreignField: "_id",
//     pipeline: [
//       {
//         $project: {
//           name: 1
//         },
//       }
//     ],
//     as: "couontryDetails"
//   }
// },
// {
//   $unwind: {path: "$couontryDetails", preserveNullAndEmptyArrays: true}
// },
// {
//   $addFields: {countryName: "$couontryDetails.name"}
// },


const viewCommissionPercentageList = (req, res) => {
  CommissionPercentage.aggregate([
    {
      $lookup: {
        from: 'merchants',
        localField: 'merchantID',
        foreignField: '_id',
        pipeline: [
          {
            $project: {
              fullName: {
                $concat: ['$firstName', ' ', '$lastName']
              }
            }
          }
        ],
        as: 'marchantDetails'
      }
    },
  ])
  .then((data) => {
    res.status(ResponseCode.errorCode.success).json({
      status: true,
      message: 'View successfully!',
      data: data,
    });
  })
  .catch((error) => {
    res.status(ResponseCode.errorCode.serverError).json({
      status: false,
      message: 'Server error, please try again!',
    });
  });;


}




const viewCommissionPercentage = (req, res) => {
  CommissionPercentage.aggregate([
    {
      $match: {
        isDeleted: false
      },
    },
    {
      $lookup: {
        from: 'merchants',
        localField: 'merchantID',
        foreignField: '_id',
        pipeline: [
          {
            $project: {
              fullName: {
                $concat: ['$firstName', ' ', '$lastName']
              }
            }
          }
        ],
        as: 'marchantDetails'
      }
    },
    {
      $unwind: { path: '$marchantDetails', preserveNullAndEmptyArrays: true }
    },
    {
      $addFields: { fullName: '$marchantDetails.fullName' }
    },
    {
      $unwind: '$countryWisePercentage'
    },
    {
      $lookup: {
        from: 'countries',
        localField: 'countryWisePercentage.countryID',
        foreignField: '_id',
        as: 'countryDetails'
      }
    },
    {
      $unwind: { path: '$countryDetails', preserveNullAndEmptyArrays: true }
    },
    {
      $addFields: {
        'countryWisePercentage.countryName': '$countryDetails.name'
      }
    },
    {
      $group: {
        _id: '$_id',
        merchantID: { $first: '$merchantID' },
        commissionType: { $first: '$commissionType' },
        countryWisePercentage: { $push: '$countryWisePercentage' },
        marchantDetails: { $first: '$marchantDetails' },
        fullName: { $first: '$fullName' }
      }
    },
    {
      $project: {
        updatedOn: 0,
        createdOn: 0,
        isDeleted: 0,
        status: 0,
      },
    },
  ])
    .then((data) => {
      res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: 'View successfully!',
        data: data,
      });
    })
    .catch((error) => {
      res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: 'Server error, please try again!',
      });
    });
};


const deleteCommissionPercentage = (req, res) => {
  CommissionPercentage.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(req.params.id),
    },
    {
      $set: {
        isDeleted: true,
      },
    }
  )
    .then((data) => {
      res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Deleted successfull!",
      });
    })
    .catch((error) => {
      res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error, please try again!",
      });
    });
};

const updateCommissionPercentageOld = async (req, res) => {
  const {
    commissionType,
    countryWisePercentage,
    merchentWisePercentage,
    merchantID,
  } = req.body;
  console.log("updatedData", countryWisePercentage);
  console.log("commissionType", commissionType);

  try {
    let updatedData;
    if (commissionType === "CountryWise") {
      const updatedData = await Promise.all(
        countryWisePercentage.map(
          async ({ countryID, commissionPercentage }) => {
            return CommissionPercentage.findOneAndUpdate(
              { "countryWisePercentage.countryID": countryID },
              {
                $set: {
                  "countryWisePercentage.$.commissionPercentage":
                    commissionPercentage,
                },
              },
              { new: true }
            );
          }
        )
      );
    } else if (commissionType === "Individuallevel") {
      const updatedData = await Promise.all(
        merchentWisePercentage.map(
          async ({ merchantID, commissionPercentage }) => {
            return CommissionPercentage.findOneAndUpdate(
              { "merchentWisePercentage.merchantID": merchantID },
              {
                $set: {
                  "merchentWisePercentage.$.commissionPercentage":
                    commissionPercentage,
                },
              },
              { new: true }
            );
          }
        )
      );
    } else if (commissionType === "Global") {
      const updatedData = await CommissionPercentage.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(req.params.id) },
        { $set: { commissionPercentage: req.body.commissionPercentage } },
        { new: true }
      );
    }

    res.status(ResponseCode.errorCode.success).json({
      status: true,
      data: updatedData,
      message: "Update successfull!",
    });
  } catch (error) {
    res.status(ResponseCode.errorCode.serverError).json({
      status: false,
      message: "Server error, please try again!",
    });
  }
}

const updateCommissionPercentage = async (req, res) => {
  try {
    const commissionId = new mongoose.Types.ObjectId(req.params.id);
    console.log("commissionId==",commissionId);
    let commissionData = {
      ...req.body,
      updatedOn: new Date(),
    };
    const updatedData = await CommissionPercentage.updateOne(
      { _id: commissionId },
      { $set: commissionData }
    );

    // Check if any document is updated
    if (updatedData.nModified === 0) {
      return res.status(ResponseCode.errorCode.notFound).json({
        status: false,
        message: "Commission record not found",
      });
    }

    res.status(ResponseCode.errorCode.success).json({
      status: true,
      data: updatedData,
      message: "Update successful!",
    });
  } catch (error) {
    console.log("error is===",error);
    res.status(ResponseCode.errorCode.serverError).json({
      status: false,
      message: "Server error, please try again!",
    });
  }
};

const viewMerchantslist = (req,res)=>{
  merchantModel.aggregate([
    {
      $match:{
        isDeleted:false,
        isApproval:true
      }
    },
    {
      $lookup:{
        from:"activitydetails",
        localField:"_id",
        foreignField:"addedByid",
        as:"activityDetails",
        pipeline:[
          {
            $match:{
              isDeleted:false
            }
          },
          {
            $lookup:{
              from:"userbookings",
              localField:"_id",
              foreignField:"activityDetailsId",
              as:"userBooking"
            }
          }
        ]
      }
    }
  

  ]).then((data)=>{
    res.status(ResponseCode.errorCode.success).json({
      status:true,
      message:"View successfully",
      data:data
    })
  }).catch((error)=>{
    res.status(ResponseCode.errorCode.success).json({
      status:true,
      message:"Server error, please try again!",
    })
  })


}


module.exports = {
  addCommissionPercentage,
  updateCommissionPercentage,
  viewCommissionPercentageList,
  viewCommissionPercentage,
  deleteCommissionPercentage,
  marchentListWithoutCommission,
  viewMerchantslist
};
