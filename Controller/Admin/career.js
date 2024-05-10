const mongoose = require("mongoose");
const careerModel = require("../../Models/career");
const ResponseCode = require("../../service/responseCode");
const { Validator } = require("node-input-validator");
const { DBerror, InputError } = require("../../service/errorHandeler");
const S3 = require("../../service/s3");

const careerImage = async (req, res) => {
  let uploadData = await S3.doUpload(req, "career/image");
  if (uploadData.status) {
    res.send(uploadData);
  } else {
    res.send(uploadData);
  }
};

const addCareer = async (req, res) => {
  const careerData = {
    ...req.body,
  };
  new careerModel(careerData)
    .save()
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "careerData added successfully",
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

const viewCarrer = async (req, res) => {
  await careerModel
    .aggregate([
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
        message: "View Career",
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

const editCareer = async (req, res) => {
  await careerModel
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
        message: "careerData update successfully",
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

const deleteCareer = async (req, res) => {
  await careerModel
    .findOneAndUpdate(
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
        message: "CareerData delete successfully",
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
  careerImage,
  addCareer,
  viewCarrer,
  editCareer,
  deleteCareer,
};
