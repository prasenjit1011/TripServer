const mongoose = require("mongoose");
const ActivityType = require("../../Models/activityType");
const ResponseCode = require("../../service/responseCode");
const { Validator } = require("node-input-validator");
const { DBerror, InputError } = require("../../service/errorHandeler");
const S3 = require("../../service/s3");

const activityImg = async (req, res) => {
  let actimg = await S3.doUpload(req, "activityType/image");

  res.status(ResponseCode.errorCode.success).json({
    status: true,
    data: actimg.url,
  });
};

const addActivityType = async (req, res) => {
  var check = await ActivityType.findOne({ name: req.body.name ,isDeleted: false}).exec();
  if (check == "" || check == null) { 
    new ActivityType({
      ...req.body,
    })
      .save()
      .then((data) => {
        return res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "New activity type  added successfully",
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
  } else {
    return res.status(ResponseCode.errorCode.dataExist).json({
      status: false,
      message: "name already exist",
    });
  }
};

const viewActivityType = async (req, res) => {
  ActivityType.aggregate([
    {
      $match: {
        isDeleted: false,
        status: true,
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
        message: "Activity type list",
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

const editActivityType = async (req, res) => {
  await ActivityType.findOneAndUpdate(
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
        message: "New activity type  updated  successfully",
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

const deleteActivityType = async (req, res) => {
  await ActivityType.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(req.params.id),
    },
    {
      isDeleted: true,
    }
  )
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: " activity Type  deleted  successfully",
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
  addActivityType,
  viewActivityType,
  activityImg,
  editActivityType,
  deleteActivityType,
};
