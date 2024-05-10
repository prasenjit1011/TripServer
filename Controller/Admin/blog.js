const mongoose = require("mongoose");
const blogModel = require("../../Models/blog");
const blogCategory = require("../../Models/blogCategory");
const CategoryType = require("../../Models/categoryType");
const ResponseCode = require("../../service/responseCode");
const { Validator } = require("node-input-validator");
const { DBerror, InputError } = require("../../service/errorHandeler");
const S3 = require("../../service/s3");

const blogImage = async (req, res) => {
  let uploadData = await S3.doUpload(req, "blog/image");
  if (uploadData.status) {
    res.send(uploadData);
  } else {
    res.send(uploadData);
  }
};

const addBlogCategory = async (req, res) => {
  var check = await blogCategory.findOne({ categoryName: req.body.name }).exec();
  console.log(check);
  if (check) {
    await blogCategory
      .findOneAndUpdate(
        {
          _id: check._id,
        },
        {
          ...req.body,
        }
      )
      .then((data) => {
        return res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "Blog category update successfully",
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
    const blogData = {
      ...req.body,
      
    };
    new blogCategory(blogData)
      .save()
      .then((data) => {
        return res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "Blog category added successfully",
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
const viewBlogCategory = async (req, res) => {
  await blogCategory
    .aggregate([
      {
        $match: {
          isDeleted: false,
          status: true,
        },
      },
      {
        $lookup:{
          from:"categorytypes",
          localField:"typeId",
          foreignField:"_id",
          as:"types"
        }
      },
      {
        $unwind:{
          path:"$types",preserveNullAndEmptyArrays:true
        }
      },
   
      {
        $project: {
          createdOn: 0,
          updatedOn: 0,
          isDeleted: 0,
          status: 0,
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
        message: "View Blogs",
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

const deleteBlogCategory = async (req, res) => {
  await blogCategory
    .deleteOne({
      _id: new mongoose.Types.ObjectId(req.params.id),
    })
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Blog category deleted successfully",
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

const addBlog = async (req, res) => {
  const blogData = {
    ...req.body,
  };
  new blogModel(blogData)
    .save()
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "blog added successfully",
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

const viewBlog = async (req, res) => {
  await blogModel
    .aggregate([
      {
        $match: {
          isDeleted: false,
          status: true,
        },
      },
      {
        $lookup: {
          from: "blogcategories",
          localField: "categoryId",
          foreignField: "_id",
          pipeline:[
            {
              $lookup:{
                from:"categorytypes",
                localField:"typeId",
                foreignField:"_id",
                as:"types"
              }
            },
            {
              $unwind:{
                path:"$types",preserveNullAndEmptyArrays:true
              }
            }
          ],
          as: "category",
        },
      },
      // {
      //   $addFields: {
      //     categoryName: { $arrayElemAt: ["$category.name", 0] },
          


      //   },
      // },
      {
        $project: {
          createdOn: 0,
          categoryId: 0,
          updateOn: 0,
          __v: 0,
          // category: 0,
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
        data: data,
      });
    })
    .catch((error) => {

      // console.log(error)
      const errors = DBerror(error);
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error,Please try again",
        error: errors,
      });
    });
};

const editBlog = async (req, res) => {
  await blogModel
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
        message: "Blog updated successfully",
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

const deleteBlog = async (req, res) => {
  await blogModel
    .deleteOne({
      _id: new mongoose.Types.ObjectId(req.params.id),
    })
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Blog deleted successfully",
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

const addType = async (req, res) => {
  const blogData = {
    ...req.body,
  };
  new CategoryType(blogData)
    .save()
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Type added successfully",
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

const viewtype = async (req, res) => {
  await CategoryType.aggregate([
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

const editType = async (req, res) => {
  await CategoryType.findOneAndUpdate(
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
        message: "Type updated successfully",
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

const deleteType = async (req, res) => {
  await CategoryType.deleteOne({
    _id: new mongoose.Types.ObjectId(req.params.id),
  })
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Type deleted successfully",
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
  blogImage,
  addBlogCategory,
  viewBlogCategory,
  deleteBlogCategory,
  addBlog,
  viewBlog,
  editBlog,
  deleteBlog,
  addType,
  viewtype,
  editType,
  deleteType,
};
