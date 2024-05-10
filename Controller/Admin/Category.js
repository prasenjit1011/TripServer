const mongoose = require("mongoose");
// const Category = require("../../Models/Category");
const ResponseCode = require("../../service/responseCode");
// const category = require("../../Models/Category");
const { DBerror, InputError } = require("../../service/errorHandeler");
const category = require("../../Models/category")

const addCategory = async (req, res) => {
  new category({
    ...req.body,

  })
    .save()
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Category added successfully",
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

const viewCategory = async (req, res) => {
  category.aggregate([
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

const editCategory = async (req, res) => {
  await category
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
              message: "Category update successfully",
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

const deleteCategory = async (req, res) => {
  await category
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
              message: "Category delete successfully",
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
  addCategory,
  viewCategory,
  editCategory,
  deleteCategory,
};

