const mongoose = require("mongoose");
const Country = require("../../Models/country");
const ResponseCode = require("../../service/responseCode");

const viewCountry = async (req, res) => {
    Country.aggregate([
      {
        $match: {
          
          isDeleted: false,
          status: true,
        },
      },
      {
        $sort: {
          topPriority: 1
        }
      },
      {
        $project: {
          createdOn: 0,
          updatedOn: 0,
          isDeleted:0,
          __v: 0,
        },
      },
    ])
      .then((data) => {
        return res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "Country list",
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
    viewCountry
  }