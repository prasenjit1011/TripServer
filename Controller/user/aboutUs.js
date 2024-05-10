const mongoose = require("mongoose");
const AboutUs = require("../../Models/aboutUs");
const LegalNotice = require("../../Models/legalNotice");
const termsConditionsModel = require("../../Models/termsConditions");
const PrivacyPolicy = require("../../Models/privacyPolicy");
const ResponseCode = require("../../service/responseCode");
const { DBerror } = require("../../service/errorHandeler");


const aboutUs = async (req, res) => {

    await AboutUs.aggregate([
        {
            $match: {
                isDeleted: false,
                status: true,
            },
        },
        {
            $project: {
                isDeleted: 0,
                status: 0,
                createdOn: 0,
                updatedOn: 0,
                __v: 0
            }
        }
    ])
    .then((data)=> {
        res.status(ResponseCode.errorCode.success).json({
            status: true,
            message: "Get all the data",
            data: data[0]
        })
    })
    .catch((error)=> {
        const errors = DBerror(error);
        res.status(ResponseCode.errorCode.serverError).json({
            status: false,
            message: "Server error, Please try again later",
            error: errors
        })
    })
}

const viewLegalNotice = async (req, res) => {
    await LegalNotice
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
            isDeleted:0,
            status:0,
            __v: 0,
          },
        },
      ])
      .then((data) => {
        return res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "View legal Notice",
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

  const viewPrivacyPolicy = async (req, res) => {
    await PrivacyPolicy
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
            isDeleted:0,
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





module.exports = {
    aboutUs,
    viewLegalNotice,
    viewTermsConditions,
    viewPrivacyPolicy
}