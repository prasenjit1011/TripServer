const mongoose = require("mongoose");
const cookiesPrefarenceModel = require("../../Models/cookiesAndMarketingPrefarence");
const ResponseCode = require("../../service/responseCode");
const { Validator } = require("node-input-validator");
const { DBerror, InputError } = require("../../service/errorHandeler");

const addCookiesPrefarence = async (req, res) => {
  const cookiesPrefarenceData = {
    ...req.body,
  };
  new cookiesPrefarenceModel(cookiesPrefarenceData)
    .save()
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "cookiesPrefarence added successfully",
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

const viewCookiesPrefarence = async (req, res) => {
  await cookiesPrefarenceModel
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
    ])
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "View cookiesPrefarence Notice",
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

const editCookiesPrefarence = async (req, res) => {
  await cookiesPrefarenceModel
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
        message: "cookiesPrefarence update successfully",
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

const deleteCookiesPrefarence = async (req, res) => {
  await cookiesPrefarenceModel
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
        message: "cookiesPrefarence delete successfully",
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
  addCookiesPrefarence,
  viewCookiesPrefarence,
  editCookiesPrefarence,
  deleteCookiesPrefarence,
};
