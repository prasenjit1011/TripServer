const mongoose = require("mongoose");
const termsConditionsModel = require("../../Models/termsConditions");
const ResponseCode = require("../../service/responseCode");
const { Validator } = require("node-input-validator");
const { DBerror, InputError } = require("../../service/errorHandeler");

const addTermsConditions = async (req, res) => {
  termsConditionsModel
    .find({})
    .then((data) => {
      if (data.length > 0) {
        termsConditionsModel
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
              message: "TermsConditions update successfully",
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
        const termsConditionsData = {
          ...req.body,
        };
        new termsConditionsModel(termsConditionsData)
          .save()
          .then((data) => {
            return res.status(ResponseCode.errorCode.success).json({
              status: true,
              message: "termsConditions added successfully",
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
    .catch((error) => {});
};

const viewTermsConditions = async (req, res) => {
  await termsConditionsModel
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
        message: "View termsConditions Notice",
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

const editTermsConditions = async (req, res) => {
  await termsConditionsModel
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
        message: "TermsConditions update successfully",
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

const deleteTermsConditions = async (req, res) => {
  await termsConditionsModel
    .deleteOne({
      _id: new mongoose.Types.ObjectId(req.params.id),
    })
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "termsConditions delete successfully",
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
  addTermsConditions,
  viewTermsConditions,
  editTermsConditions,
  deleteTermsConditions,
};
