const mongoose = require("mongoose");
const contactModel = require("../../Models/contact");
const ContactUsIssue = require("../../Models/contactUsIssue");
const ResponseCode = require("../../service/responseCode");
const { Validator } = require("node-input-validator");
const { DBerror, InputError } = require("../../service/errorHandeler");

const addContact = async (req, res) => {
  //   await contactModel
  //     .aggregate([
  //       {
  //         $match: { status: true },
  //       },
  //       {
  //         $project: {
  //           _id: 1,
  //         },
  //       },
  //     ])
  //     .then((data) => {
  //       console.log("contactData", data);
  //       if (data.length > 0) {
  //         res.status(404).json({
  //           status: false,
  //         //   data: data,
  //           msg: "contact Already Exist",
  //         });
  //       } else {
  const contactData = {
    ...req.body,
  };
  new contactModel(contactData)
    .save()
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "contact added successfully",
      });
    })
    //   }
    // })
    .catch((error) => {
      const errors = DBerror(error);
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error,Please try again",
        error: errors,
      });
    });
};

const viewConatact = async (req, res) => {
  await contactModel
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
        message: "View contact Notice",
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

const editContact = async (req, res) => {
  await contactModel
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
        message: "contact update successfully",
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

const deleteContact = async (req, res) => {
  await contactModel
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

const viewAllContactIssue = (req, res) => {
  ContactUsIssue.aggregate([
    {
      $project: {
        __v: 0,
        isDeleted: 0,
      },
    },
  ])
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "View contact issues",
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
  addContact,
  viewConatact,
  editContact,
  deleteContact,
  viewAllContactIssue,
};
