const mongoose = require("mongoose");
const pressModel = require("../../Models/press");
const ResponseCode = require("../../service/responseCode");
const { Validator } = require("node-input-validator");
const { DBerror, InputError } = require("../../service/errorHandeler");
const S3 = require('../../service/s3')

const pressImage = async (req, res) => {
    let uploadData = await S3.doUpload(req, "press/image");
    if (uploadData.status) {
        res.send(uploadData);
    } else {
        res.send(uploadData);
    }
};

const addPress = async (req, res) => {
    const pressData = {
        ...req.body,
    };
    new pressModel(pressData)
        .save()
        .then((data) => {
            return res.status(ResponseCode.errorCode.success).json({
                status: true,
                message: "press added successfully",
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

const viewPress = async (req, res) => {
    await pressModel
        .aggregate([
            {
                $match: {
                    isDeleted: false,
                    status: true,
                },
            },
            {
                $sort: {createdOn: -1}
            },
            {
                $project: {
                    // createdOn: 0,
                    updatedOn: 0,
                    __v: 0,
                },
            },

        ])
        .then((data) => {
            return res.status(ResponseCode.errorCode.success).json({
                status: true,
                message: "View aboutUs Notice",
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

const editPress = async (req, res) => {
    await pressModel
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
                message: "Press update successfully",
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

const deletePress = async (req, res) => {
    await pressModel
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
                message: "Press delete successfully",
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
    pressImage,
    addPress,
    viewPress,
    editPress,
    deletePress,
};
