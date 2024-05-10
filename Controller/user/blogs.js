const mongoose = require("mongoose");
const blogModel = require("../../Models/blog");
const blogCategory = require("../../Models/blogCategory");
const Categorytype = require("../../Models/categoryType");

const ResponseCode = require("../../service/responseCode");
const { Validator } = require("node-input-validator");
const { DBerror, InputError } = require("../../service/errorHandeler");


const viewtype = async (req, res) => {
  await Categorytype.aggregate([
    {
      $match: {
        isDeleted: false,
        status: true,
      },
    },
    // {
    //   $lookup:{
    //       from:"blogcategories",
    //       localField:"categoryId",
    //       foreignField:"_id",
    //       as:"category"
    //   }
    // },
    // {
    //   $addFields: {
    //     categoryName: { $arrayElemAt: ["$category.name", 0] }
    //   }
    // },
    {
      $project: {
        createdOn: 0,
        categoryId: 0,
        updateOn: 0,
        __v: 0,
        category: 0,
      },
    },
    // {
    //   $sort: {
    //     _id: -1,
    //     createdOn: -1,
    //   },
    // },
  ])
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "View types",
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


const viewBlogCategory = async (req, res) => {
  await blogCategory
    .aggregate([
      {
        $match: {
          isDeleted: false,
          status: true,
          typeId:new mongoose.Types.ObjectId(req.params.id)
        },
      },

      {
        $lookup: {
          from: "categorytypes",
          localField: "typeId",
          foreignField: "_id",
          as: "types",
        },
      },
      {
        $unwind: {
          path: "$types",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "blogs",
          localField: "_id",
          foreignField: "categoryId",
          as: "blogs",
        },
      },
      {
        $unwind: {
          path: "$blogs",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          blogImage: "$blogs.image",
          blogAuthorName: "$blogs.authorName",
          blogAuthorImage: "$blogs.authorImage",
          categoryType: "$types.name",

        },
      },
      {
        $project: {
          updatedOn: 0,
          isDeleted: 0,
          status: 0,
          __v: 0,
          blogs: 0,
          types:0
        },
      },
      {
        $sort: {
          createdOn: -1,
        },
      },
    ])
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "View Blogs",
        data: data,
      });
    })
    .catch((error) => {
      console.log(error);
      const errors = DBerror(error);
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error,Please try again",
        error: errors,
      });
    });
};

const viewSingleBlog = async (req, res) => {
  await blogModel
    .aggregate([
      {
        $match: {
          isDeleted: false,
          status: true,
          categoryId: new mongoose.Types.ObjectId(req.params.id),
        },
      },
      //   {
      //     $lookup: {
      //       from: "blogcategories",
      //       localField: "categoryId",
      //       foreignField: "_id",
      //       as: "category",
      //     },
      //   },
      //   {
      //     $addFields: {
      //       categoryName: { $arrayElemAt: ["$category.name", 0] },
      //     },
      //   },
      {
        $project: {
          categoryId: 0,
          updateOn: 0,
          __v: 0,
          category: 0,
          isDeleted: 0,
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
        message: "View Blogs",
        data: data[0],
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
  viewBlogCategory,
  viewtype,
  viewSingleBlog,
};
