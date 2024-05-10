const mongoose = require("mongoose");
const Language = require("../../Models/language");
const ResponseCode = require("../../service/responseCode");
const { Validator } = require("node-input-validator");
const { DBerror, InputError } = require("../../service/errorHandeler");
const S3 = require("../../service/s3");

const uploadlangImage = async (req, res) => {
  var uploads = await S3.doUpload(req, "language/image");
  // console.log(uploads)
  return res.status(ResponseCode.errorCode.success).json({
    status: true,
    data: uploads.url,
  });
};


const addLanguage = async (req, res) => {
  var check = await Language.findOne({ name: req.body.name, isDeleted: false }).exec()

  if (check == null || check == '') {
    await new Language({
      ...req.body,
    })
      .save()
      .then((data) => {
        return res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "Language added successfully",
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
      message: "Language already exists",

    });

  }

};

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
        // status: 0,
        createdOn: 0,
        updatedOn: 0,
        isDeleted: 0,
        status: 0
      },
    },
    {
      $sort: {
        _id: -1,
        createdOn: -1
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

const editLanguage = async (req, res) => {

  var check = await Language
    .findOne({ name: req.body.name, isDeleted: false })
    .exec();
  if (check) {
    return res.status(ResponseCode.errorCode.dataExist).json({
      status: false,
      message: "Language already exists",
    });
  } else {
    await Language.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(req.params.id),
      },
      {
        ...req.body
      }
    )
      .then((data) => {
        return res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "language update Sucessfully",
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

};

const deleteLanguage = async (req, res) => {
  Language.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(req.params.id),
    },
    {
      isDeleted: true
    }
  )
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "language delete Sucessfully",
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
  uploadlangImage,
  addLanguage,
  viewAllLanguage,
  editLanguage,
  deleteLanguage
};
