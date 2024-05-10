const mongoose = require('mongoose')
const MarchentsDashboardTab = require('../../Models/marchentsDashbordTab')
const ResponseCode = require("../../service/responseCode");
const Merchants = require('../../Models/merchant')

const viewMarchentDashboardTab = (req,res)=>{
  MarchentsDashboardTab.aggregate([
    {
      $match:{
        isDeleted:false
      }
    },
    {
      $project:{
        __v:0,
        createdOn:0,
        status:0,
        isDeleted:0
      }
    }
  ]).then((data)=>{
    res.status(ResponseCode.errorCode.success).json({
      status:true,
      message:"Marchent Dashboard get successfully !",
      data:data
    })
  }).catch((error)=>{
    res.status(ResponseCode.errorCode.serverError).json({
      status:false,
      message:"Server error, please try again !"
    })
  })
}

// const viewmarchatnPayment = (req,res)=>{
//   Merchants
// }


module.exports={
  viewMarchentDashboardTab
}