const mongoose = require('mongoose')
const AdminTab = require('../../Models/adminTab')
const ResponseCode = require("../../service/responseCode");


const addAdminTab =async(req,res)=>{
  let addData = {
    ...req.body,
  }
  await new AdminTab(addData).save()
  .then((data)=>{
    res.status(ResponseCode.errorCode.success).json({
        status:true,
        message:"Admin tab created successfully"
    })
  }).catch((error)=>{
    res.status(ResponseCode.errorCode.serverError).json({
        status:false,
        message:"Server error, please try again"
    })
  })
}

module.exports={
    addAdminTab
}