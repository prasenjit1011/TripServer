const mongoose = require("mongoose");
const privacyModel = require("../../Models/privacyPolicy");
const ResponseCode = require("../../service/responseCode");
const { Validator } = require("node-input-validator");
const { DBerror, InputError } = require("../../service/errorHandeler");

const addPrivacy = async (req, res) => {
  await privacyModel
    .find({})
    .then((data) => {
      if (data.length > 0) {
        privacyModel
          .findOneAndUpdate(
            {
              _id: data[0]._id,
            },
            {
              ...req.body,
            }
          )
          .then((data) => {
            return res.status(ResponseCode.errorCode.success).json({
              status: true,
              message: "privacyPolicy update successfully",
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
        const privacyData = {
          ...req.body,
        };
        new privacyModel(privacyData)
          .save()
          .then((data) => {
            return res.status(ResponseCode.errorCode.success).json({
              status: true,
              message: "privacyPolicy added successfully",
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

const viewPrivacyPolicy = async (req, res) => {
  await privacyModel
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
        message: "View privacyPolicy Notice",
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

const editPrivacyPolicy = async (req, res) => {
  await privacyModel
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
        message: "privacyPolicy update successfully",
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

const deletePrivacyPolicy = async (req, res) => {

  await privacyModel.deleteOne({
    _id: new mongoose.Types.ObjectId(req.params.id),
  })
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "privacyPolicy delete successfully",
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



module.exports = {
  addPrivacy,
  viewPrivacyPolicy,
  editPrivacyPolicy,
  deletePrivacyPolicy,
};
