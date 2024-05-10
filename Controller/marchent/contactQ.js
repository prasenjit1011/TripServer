const mongoose = require("mongoose");
// const contactsub = require("../../Models/contactQuestion");
const contactissue = require("../../Models/contactIssue");
const contactSub = require("../../Models/contactMerchentSubQuestion");
const contactTopic=require("../../Models/contactMerchantTopic")
const ResponseCode = require("../../service/responseCode");
const { Validator } = require("node-input-validator");
const { DBerror, InputError } = require("../../service/errorHandeler");
const S3 = require("../../service/s3");

const viewTopic=async(req,res)=>{
    contactTopic.aggregate([
        {
            $match:{
                isDeleted:false
            }
        },
        {
            $project:{
                topicName:1
            }
        }
    ]).then((data)=>{
        return res.status(ResponseCode.errorCode.success).json({
            status: true,
            message: "topic view successfully",
            data: data,
          });
    }).catch((error) => {
        const errors = DBerror(error);
        return res.status(ResponseCode.errorCode.serverError).json({
          status: false,
          message: "Server error,Please try again",
          error: errors,
        });
      });
}

const viewContactQuestion = async (req, res) => {
  await contactSub
    .aggregate([
      {
        $match: {
          isDeleted: false,
        },
      },
      { $group: { _id: "$topicId" } },
      {
        $lookup: {
          from: "merchentquestions",
          localField: "_id",
          foreignField: "topicId",
          pipeline: [
            {
              $lookup: {
                from: "merchentsubquestions",
                localField: "_id",
                foreignField: "questionId",
                pipeline: [
                  {
                    $match: {
                      isDeleted: false,
                    },
                  },
                  {
                    $project: {
                      topicId: 0,
                      questionId: 0,
                      __v: 0,
                      isDeleted: 0,
                      createdOn: 0,
                      updatedOn: 0,
                    },
                  },
                ],
                as: "subquestions",
              },
            },
            
            {
                $unwind: { path: "$subquestions", preserveNullAndEmptyArrays: true },
              },

            {
              $lookup: {
                from: "merchanttopics",
                localField: "topicId",
                foreignField: "_id",
                pipeline: [
                  {
                    $match: {
                      isDeleted: false,
                    },
                  },
                  {
                    $project: {
                      topicName: 1,
                    },
                  },
                ],
                as: "topics",
              },
            },
            {
              $unwind: { path: "$topics", preserveNullAndEmptyArrays: true },
            },
            {
                $project:{
                    isDeleted:0,
                    __v:0,
                    createdOn:0,
                    updatedOn:0,
                    topicId:0
                }
            }
          ],
          as: "questions",
        },
      },
      {
        $unwind: { path: "$questions", preserveNullAndEmptyArrays: true },
      },
    ])
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Question view successfully",
        data: data,
      });
    }).catch((error) => {
        const errors = DBerror(error);
        return res.status(ResponseCode.errorCode.serverError).json({
          status: false,
          message: "Server error,Please try again",
          error: errors,
        });
      });
};

const uploadFiles = async (req, res) => {
  let uploadData = await S3.doUpload(req, "contact/issue");
  if (uploadData.status) {
    res.send(uploadData);
  } else {
    res.send(uploadData);
  }
};

const addissue = async (req, res) => {
  const aboutUsData = {
    ...req.body,
    merchantId: req.user._id,
    createdOn: new Date(),
  };
  new contactissue(aboutUsData)
    .save()
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "issue added successfully",
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
  viewContactQuestion,
  uploadFiles,
  addissue,
  viewTopic
};
