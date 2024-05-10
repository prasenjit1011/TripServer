const mongoose = require("mongoose");
const contactUserTopic = require("../../Models/contactUserTopic");
const contactQuestion = require("../../Models/contactUserQuestion");
const contactAnswer = require("../../Models/contactUserAnswer ");
const ResponseCode = require("../../service/responseCode");
const { Validator } = require("node-input-validator");
const { DBerror, InputError } = require("../../service/errorHandeler");
const S3 = require("../../service/s3");

const contactImage = async (req, res) => {
  let uploadData = await S3.doUpload(req, "contact/image");
  if (uploadData.status) {
    res.send(uploadData);
  } else {
    res.send(uploadData);
  }
};

/*===========================topic=============================*/
const addContactUserTopic = async (req, res) => {
  const topic = await contactUserTopic
    .find({ topicName: req.body.topicName, isDeleted: false })
    .exec();
  if (topic.length > 0) {
    return res.status(ResponseCode.errorCode.dataExist).json({
      status: false,
      message: "topic already exist ",
    });
  } else {
    const contactTopicData = {
      ...req.body,
    };
    new contactUserTopic(contactTopicData)
      .save()
      .then((data) => {
        return res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "contact user related topic added successfully",
        });
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
  }
};

const editContactUserTopic = async (req, res) => {
  await contactUserTopic
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
        message: "contact user topic update successfully",
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

const viewConatactTopic = async (req, res) => {
  await contactUserTopic
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
          createdOn: -1,
        },
      },
    ])
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "View all user contact topic list",
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

const deleteContactUserTopic = async (req, res) => {
  const updatedData = await contactUserTopic
    .findOneAndUpdate(
      { _id: req.params.id },
      { $set: { isDeleted: true } },
      { new: true }
    )
    .then(async (data) => {
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

/*===========================question=============================*/

const addContactUserQuestion = async (req, res) => {
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
          message: "contact user realated question added successfully",
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

const editContactUserQuestion = async (req, res) => {
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
        message: "contact user Question update successfully",
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

const viewContactUserQuestion = async (req, res) => {
  await contactQuestion
    .aggregate([
      {
        $match: {
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: "usertopics",
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

const deleteContactUserQuestion = async (req, res) => {
  await contactQuestion
    .findOneAndUpdate(
      {
        _id: req.params.id,
      },
      { isDeleted: true }
    )
    .then(async (data) => {
      // await contactSubQuestion.updateMany(
      //   {
      //     questionId: { $in: [new mongoose.Types.ObjectId(data._id)] },
      //   },
      //   {
      //     isDeleted: true,
      //   }
      // );
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "question deleted sucessfully",
      });
    })
    .catch((error) => {
      console.log(error)
      const errors = DBerror(error);
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error,Please try again",
        error: errors,
      });
    });
};

const searchContactQuestion = async (req, res) => {
  var regex = new RegExp(req.params.question, "i");

  await contactQuestion
    .aggregate([
      {
        $match: {
          isDeleted: false,
          questions: regex,
          // $regex: ".*" + req.params.question + ".*",
          // $options: "i",
        },
      },
      {
        $lookup: {
          from: "useranswers",
          localField: "_id",
          foreignField: "questionId",
          pipeline: [
            {
              $lookup: {
                from: "usertopics",
                localField: "topicId",
                foreignField: "_id",
                pipeline:[
                  {
                    $project: {
                      topicName: 1,
                    },
                  },

                ],
                as: "topic",
              },
            },           
            {
              $unwind: {
                path: "$topic",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                answer:1,
                topic: 1,
              },
            },

          ],
          as: "answer",
        },
      },
      {
        $unwind: { path: "$answer", preserveNullAndEmptyArrays: true },
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
      res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "View contact questions",
        data: data,
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
};

/*===========================Answer=============================*/

const addContactUserAnswer = async (req, res) => {
  const contactAnswerData = {
    ...req.body,
  };
  new contactAnswer(contactAnswerData)
    .save()
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "contact user related answer added successfully",
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

const editContactUserAnswer = async (req, res) => {
  await contactAnswer
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
        message: "contact user answer updated successfully",
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

const viewContactUserAnswer = async (req, res) => {
  await contactAnswer
    .aggregate([
      {
        $match: {
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: "usertopics",
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
          from: "userquestions",
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
        message: "View Contact User answer data",
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

const deleteContactUserAnswer = async (req, res) => {
  contactAnswer
    .deleteOne({
      _id: new mongoose.Types.ObjectId(req.params.id),
    })
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Answer deleted sucessfully",
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
  addContactUserTopic,
  editContactUserTopic,
  viewConatactTopic,
  deleteContactUserTopic,

  addContactUserQuestion,
  editContactUserQuestion,
  viewContactUserQuestion,
  deleteContactUserQuestion,
  searchContactQuestion,

  addContactUserAnswer,
  editContactUserAnswer,
  viewContactUserAnswer,
  deleteContactUserAnswer,
};
