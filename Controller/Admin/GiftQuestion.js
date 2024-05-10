const mongoose = require("mongoose");
const GiftQuestion = require("../../Models/giftQuestion");
const ResponseCode = require("../../service/responseCode");

const addGiftQuestion = async (req, res) => {
  new GiftQuestion({
    ...req.body,
    createdOn: Date.now(),
  })
    .save()
    .then((data) => {
      res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Gift question added !",
      });
    })
    .catch((error) => {
      res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error please try again !",
      });
    });
};

const viewGiftQuestion = (req, res) => {
  GiftQuestion.aggregate([
    {
      $match: {
        isDeleted: false,
      },
    },
    {
      $project: {
        status: 0,
        isDeleted: 0,
        createdOn: 0,
        __v: 0,
      },
    },
  ])
    .then((data) => {
      res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "View giftsQuestion successfully !",
        data: data,
      });
    })
    .catch((error) => {
      res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error, please try again !",
      });
    });
};

const updateGiftQuestion = (req, res) => {
  GiftQuestion.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(req.params.id),
    },
    {
      $set: {
        ...req.body,
        updatedOn: new Date(),
      },
    }
  )
    .then((data) => {
      res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Update successfully!",
      });
    })
    .catch((error) => {
      res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error, please try again!",
      });
    });
};

const deleteGiftQuestion = (req, res) => {
  GiftQuestion.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(req.params.id),
    },
    {
      $set: {
        isDeleted: true,
        updatedOn: new Date(),
      },
    }
  )
    .then((data) => {
      res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Deleted successfully!",
      });
    })
    .catch((error) => {
      res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error, please try again!",
      });
    });
};

module.exports = {
  addGiftQuestion,
  viewGiftQuestion,
  updateGiftQuestion,
  deleteGiftQuestion,
};
