const mongoose = require("mongoose");
const Gift = require("../../Models/gift");
const ResponseCode = require("../../service/responseCode");
const { DBerror, InputError } = require("../../service/errorHandeler");

const addGift = async (req, res) => {
    new Gift({
        ...req.body,
      
    })
        .save()
        .then((data) => {
            return res.status(ResponseCode.errorCode.success).json({
                status: true,
                message: "Gift added successfully",
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

const viewGift = async (req, res) => {
    await Gift.aggregate([
        {
            $match: {
                isDeleted: false,
                status: true,
            },
        },

        {
            $project: {
                __v: 0,
                isDeleted: 0,
                createdOn: 0,
            },
        },
        {
            $sort: {
              _id: -1,
              createdOn:-1
            },
          },
    ])
        .then((data) => {
            return res.status(ResponseCode.errorCode.success).json({
                status: true,
                message: "gift viewed sucessfully",
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

const editGift = async (req, res) => {
    await Gift.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(req.params.id) },
        { ...req.body, }
    )
        .then((data) => {
            return res.status(ResponseCode.errorCode.success).json({
                status: true,
                message: "Gift updated",
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

const deleteGift = async (req, res) => {
    await Gift.findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(req.params.id) },
        { isDeleted: true }
    )
        .then((data) => {
            return res.status(ResponseCode.errorCode.success).json({
                status: true,
                message: "Gift deleted",
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
    addGift,
    viewGift,
    editGift,
    deleteGift
};
