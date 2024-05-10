const mongoose = require("mongoose");
const Language = require("../../Models/language");
const ResponseCode = require("../../service/responseCode");
const { Validator } = require("node-input-validator");
const { DBerror, InputError } = require("../../service/errorHandeler");

const viewAllLanguage = async (req, res) => {
    Language.aggregate([
      {
        $match: {
          status: true,
          isDeleted: false,
        },
      },
      {
        $project: {
          __v: 0,
        //   status: 0,
          createdAt:0,
          updatedAt:0,
          isDeleted:0
        },
      },
    ])
      .then((data) => {
        return res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "All language get  successfully",
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

  module.exports={
    viewAllLanguage
  }