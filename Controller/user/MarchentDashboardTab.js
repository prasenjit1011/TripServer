const mongoose = require('mongoose')
const MarchentsDashboardTab = require('../../Models/marchentsDashbordTab')
const ResponseCode = require("../../service/responseCode");


const addMarchentDashboardTab =async(req,res)=>{
  let addData = {
    ...req.body,
  }
  await new MarchentsDashboardTab(addData).save()
  .then((data)=>{
    res.status(ResponseCode.errorCode.success).json({
        status:true,
        message:"MarchentsDashboard tab created successfully"
    })
  }).catch((error)=>{
    res.status(ResponseCode.errorCode.serverError).json({
        status:false,
        message:"Server error, please try again"
    })
  })
}

module.exports={
    addMarchentDashboardTab
}