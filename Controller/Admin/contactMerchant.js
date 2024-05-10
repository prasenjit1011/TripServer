const mongoose = require("mongoose");
const contactMarchentTopic = require("../../Models/contactMerchantTopic");
const contactQuestion = require("../../Models/contactMerchentQuestion");
const contactSubQuestion = require("../../Models/contactMerchentSubQuestion");
const { DBerror, InputError } = require("../../service/errorHandeler");
const ResponseCode = require("../../service/responseCode");
const { Validator } = require("node-input-validator");


const S3 = require("../../service/s3");

const contactImage = async (req, res) => {
  let uploadData = await S3.doUpload(req, "contact/image");
  if (uploadData.status) {
    res.send(uploadData);
  } else {
    res.send(uploadData);
  }
};

const addContactMerchantTopic = async (req, res) => {
  const topic = await contactMarchentTopic.find({topicName: req.body.topicName,isDeleted:false}).exec();
  if (topic.length > 0) {
    return res.status(ResponseCode.errorCode.dataExist).json({
      status: true,
      message: "topic already exist ",
    });
  } else {
    const contactData = {
      ...req.body,
    };
    new contactMarchentTopic(contactData)
      .save()
      .then((data) => {
        return res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "contact merchant related topic added successfully",
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

const editContactMerchantTopic = async (req, res) => {
    await contactMarchentTopic
        .findOneAndUpdate(
            {
                _id: new mongoose.Types.ObjectId(req.params.id),
            },
            {
                ...req.body,
            }
        )
        .then((data) => {
            return res.status(ResponseCode.errorCode.success).json({
                status: true,
                message: "contact merchant topic update successfully",
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

const viewContactMerchantTopic = async (req, res) => {
    await contactMarchentTopic
        .aggregate([
            {
                $match: {
                    isDeleted: false,

                },
            },
            {
                $project: {
                    createdOn: 0,
                    updatedOn: 0,
                    isDeleted: 0,
                    __v: 0,
                },
            },
            {
                $sort: {
                  _id: -1,
                  createdOn:-1
                },
              },
        ])
        .then((data) => {
            return res.status(ResponseCode.errorCode.success).json({
                status: true,
                message: "View all merchant contact topic list",
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

const deleteContactMerchantTopic = async (req, res) => {
  const updatedData = await contactMarchentTopic.findOneAndUpdate(
    { _id: req.params.id },
    { $set: { isDeleted: true } },
    { new: true }
  ).then(async(data)=>{
      const topicId = data._id;
      await contactQuestion.updateMany(
          { topicId: topicId },
          { $set: { isDeleted: true } }
        );
    
        await contactSubQuestion.updateMany(
          { topicId: topicId },
          { $set: { isDeleted: true } }
        );
    
        return res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "topic deleted successfully",
          // updatedData,
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

/*===========================question=============================*/

const addContactMerchentQuestion = async (req, res) => {
  const topic = await contactQuestion
    .find({ questions: req.body.questions, isDeleted: false })
    .exec();
  if (topic.length > 0) {
    return res.status(ResponseCode.errorCode.dataExist).json({
      status: false,
      message: "questions already exist ",
    });
  } else {
    const contactData = {
      ...req.body,
    };
    new contactQuestion(contactData)
      .save()
      .then((data) => {
        return res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "contact Merchent realated question added successfully",
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

const editContactMerchentQuestion = async (req, res) => {
  await contactQuestion
    .findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(req.params.id),
      },
      {
        ...req.body,
      }
    )
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "contact Merchent Question update successfully",
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

const viewContactMerchentQuestion = async (req, res) => {
  await contactQuestion
    .aggregate([
      {
        $match: {
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: "merchanttopics",
          localField: "topicId",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                topicName: 1,
              },
            },
          ],
          as: "topicDetails",
        },
      },
      {
        $unwind: { path: "$topicDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $addFields: {
          topic: "$topicDetails.topicName",
        },
      },

      {
        $project: {
          topicDetails: 0,
          createdOn: 0,
          updatedOn: 0,
          isDeleted: 0,
          __v: 0,
        },
      },
    ])
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "View contact data",
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

const deleteContactMerchentQuestion = async (req, res) => {
  await contactQuestion
    .findOneAndUpdate(
      {
        _id: req.params.id,
      },
      { isDeleted: true }
    )
    .then(async (data) => {

      await contactSubQuestion.updateMany(
        {
          questionId: { $in: [new mongoose.Types.ObjectId(data._id)] },
        },
        {
          isDeleted: true,
        }
      );
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "question deleted sucessfully",
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

/*===========================sub Question=============================*/

const addContactMerchentSubQuestion = async (req, res) => {
  const contactSubQuestionData = {
    ...req.body,
  };
  new contactSubQuestion(contactSubQuestionData)
    .save()
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "contact Merchent related subQuestion added successfully",
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

const editContactMerchentSubQuestion = async (req, res) => {
  await contactSubQuestion
    .findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(req.params.id),
      },
      {
        ...req.body,
      }
    )
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "contact Merchent Sub Question update successfully",
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

const viewContactMerchentSubQuestion = async (req, res) => {
  await contactSubQuestion
    .aggregate([
      {
        $match: {
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: "merchanttopics",
          localField: "topicId",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                topicName: 1,
              },
            },
          ],
          as: "topicDetails",
        },
      },
      {
        $unwind: { path: "$topicDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "merchentquestions",
          localField: "questionId",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                questions: 1,
              },
            },
          ],
          as: "questionDetails",
        },
      },
      {
        $unwind: { path: "$questionDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $addFields: {
          topic: "$topicDetails.topicName",
          questions: "$questionDetails.questions",
        },
      },
      {
        $project: {
          questionDetails: 0,
          topicDetails: 0,
          createdOn: 0,
          updatedOn: 0,
          isDeleted: 0,
          __v: 0,
        },
      },
    ])
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "View Contact Merchent SubQuestion data",
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

const deleteContactMerchentSubQuestion = async (req, res) => {
  contactSubQuestion
    .findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(req.params.id),
      },
      { isDeleted: true }
    )
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "sub question deleted sucessfully",
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
  contactImage,

  addContactMerchantTopic,
  editContactMerchantTopic,
  viewContactMerchantTopic,
  deleteContactMerchantTopic,

  addContactMerchentQuestion,
  editContactMerchentQuestion,
  viewContactMerchentQuestion,
  deleteContactMerchentQuestion,

  addContactMerchentSubQuestion,
  editContactMerchentSubQuestion,
  viewContactMerchentSubQuestion,
  deleteContactMerchentSubQuestion

};
