const mongoose=require('mongoose')
const GiftQuestion = require('../../Models/giftQuestion')
const ResponseCode = require('../../service/responseCode')



const viewGiftQuestion =(req,res)=>{
    GiftQuestion.aggregate([
        {
            $match:{
                isDeleted:false
            }
        },
        {
            $project:{
                status:0,
                isDeleted:0,
                createdOn:0,
                __v:0,
            }
        }
    ]).then((data)=>{
        res.status(ResponseCode.errorCode.success).json({
            status:true,
            message:"View giftsQuestion successfully !",
            data:data
        })
    }).catch((error)=>{
        res.status(ResponseCode.errorCode.serverError).json({
            status:false,
            message:"Server error, please try again !",
        })
    })
}


module.exports={
viewGiftQuestion
}