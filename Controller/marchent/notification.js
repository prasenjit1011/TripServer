const mongoose = require("mongoose");
let MarchentsnotificationModel = require("../../Models/marchentNotification");
const ResponseCode = require("../../service/responseCode");
const { DBerror, InputError } = require("../../service/errorHandeler");

const marchentsViewNotification = (req, res) => {
  MarchentsnotificationModel.aggregate([
    {
      $match: {
        isDeleted: false,
        marchentsID:req.user._id
      },
    },
    {
        $lookup:{
            from:"merchants",
            localField:"marchentsID",
            foreignField:"_id",
            as:"marchent",
            pipeline:[
                {
                    $match:{
                        isDeleted:false
                    }
                }
            ]
        }
    },
    {$unwind:"$marchent"},
    {
        $addFields:{
            firstName:"$marchent.firstName",
            lastName:"$marchent.lastName"
        }
    },
    {
        $project:{
            marchent:0,
            status:0,
            isDeleted:0,
            createdOn:0,
            __v:0
        }
    }
  ])
    .then((data) => {
      res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Notificationv view successfully !",
        data: data,
      });
    })
    .catch((error) => {
      res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Server error, please try again !",
      });
    });
};

module.exports = {
  marchentsViewNotification,
};
