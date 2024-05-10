const mongoose = require("mongoose");
const HomePageBanner = require("../../Models/homePageBanner");
const ResponseCode = require("../../service/responseCode");
const { Validator } = require("node-input-validator");
const { DBerror, InputError } = require("../../service/errorHandeler");
const S3 = require("../../service/s3");
const VS3 = require("../../service/videos3");

const addHomePageBanner0000 = async (req, res) => {
  const check = await HomePageBanner.find({
    activityTypeId: new mongoose.Types.ObjectId(req.body.activityTypeId),
    countryId: new mongoose.Types.ObjectId(req.body.countryId),
    isDeleted: false,
  }).exec();
  if (check.length > 0) {
    return res.status(ResponseCode.errorCode.dataExist).json({
      status: false,
      message: "Banner for this activity type and country already exists",
      // data:check
    });
  } else {
    new HomePageBanner({
      ...req.body,
    })
      .save()
      .then((data) => {
        return res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "Home page banner added successfully",
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

const addHomePageBanner = async (req, res) => {
  console.log("jhfsfsfhgshfghgsf", req.body);
  const check = await HomePageBanner.find({
    activityTypeId: new mongoose.Types.ObjectId(req.body.activityTypeId),
    //countryId: new mongoose.Types.ObjectId(req.body.countryId),
    isDeleted: false,
  }).exec();
  console.log("check11", check);
  if (check.length > 0) {
    const updateImage = await HomePageBanner.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(check[0]._id),
        activityTypeId: new mongoose.Types.ObjectId(check[0].activityTypeId),
      },
      {
        $set: {
          bannerImg: req.body.bannerImg,
          bannerTitle: req.body.bannerTitle,
          bannerDesc: req.body.bannerDesc,
          bannerVdo: req.body.bannerVdo,
          updatedOn: new Date(),
        },
      },
    );
    return res.status(ResponseCode.errorCode.success).json({
      status: true,
      message: "update successfully",
    });
  } else {
    let alldata = await new HomePageBanner({
      ...req.body,
    })
      .save()
      .then(async (data) => {
        // console.log("allData", data);
        return res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "Home page banner added successfully",
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



// const addHomePageBanner = async (req, res) => {
//   try {
//     const check = await HomePageBanner.find({
//       activityTypeId: new mongoose.Types.ObjectId(req.body.activityTypeId),
//       countryId: new mongoose.Types.ObjectId(req.body.countryId),
//       isDeleted: false,
//     }).exec();

//     if (check.length > 0) {
//       const updateImage = await HomePageBanner.findOneAndUpdate(
//         {
//           _id: new mongoose.Types.ObjectId(check[0]._id),
//           activityTypeId: new mongoose.Types.ObjectId(req.body.activityTypeId),
//           countryId: new mongoose.Types.ObjectId(req.body.countryId),
//         },
//         {
//           $set: {
//             bannerImg: req.body.bannerImg,
//             bannerTitle: req.body.bannerTitle,
//             bannerDesc: req.body.bannerDesc,
//             bannerVdo: req.body.bannerVdo,
//             updatedOn: new Date(),
//           },
//         },
//       )
//       res.status(ResponseCode.errorCode.success).json({
//         status: true,
//         message: "Update successful",
//         // data: updateImage,
//       });
//     } else {
//       const newBanner = new HomePageBanner({
//         ...req.body,
//       });

//       const savedBanner = await newBanner.save();

//       return res.status(ResponseCode.errorCode.success).json({
//         status: true,
//         message: "Home page banner added successfully",
//         data: savedBanner,
//       });
//     }
//   } catch (error) {
//     const errors = DBerror(error);
//     return res.status(ResponseCode.errorCode.serverError).json({
//       status: false,
//       message: "Server error, Please try again",
//       error: errors,
//     });
//   }
// };



const uploadbannerImage = async (req, res) => {
  var uploads = await S3.doUpload(req, "homebanner/image");
  return res.status(ResponseCode.errorCode.success).json({
    status: true,
    data: uploads.url,
  });
};

const bannerVdo = async (req, res) => {
  // Check if a file was uploaded
  if (!req.file) {
    return res.status(ResponseCode.errorCode.requiredError).json({
      status: false,
      message: "No file uploaded.",
    });
  }
  const fileSizeInBytes = req.file.size;
  // console.log("fileSizeInBytes",fileSizeInBytes);
  const maxSizeInBytes = 2.5 * 1024 * 1024;
  // console.log("maxSizeInBytes",maxSizeInBytes);
  if (fileSizeInBytes > maxSizeInBytes) {
    return res.status(ResponseCode.errorCode.requiredError).json({
      status: false,
      message: "Video upload failed. The maximum allowed file size is 2.5 MB.",
    });
  } else {
    // console.log(req.file)
    const vdoUpload = await S3.doUpload(req, "/homebanner/video");
    return res.status(ResponseCode.errorCode.success).json({
      status: true,
      data: vdoUpload.url,
    });
  }
};

const viewBanner = async (req, res) => {
  HomePageBanner.aggregate([
    {
      $match: {
        isDeleted: false,
        active: true,
      },
    },
    {
      $lookup: {
        from: "activitydetails",
        localField: "activityId",
        foreignField: "_id",
        pipeline: [
          {
            $project: {
              activityTitle: 1,
            },
          },
        ],
        as: "activityName",
      },
    },
    {
      $unwind: {
        path: "$activityName",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $lookup: {
        from: "activitytypes",
        localField: "activityTypeId",
        foreignField: "_id",
        pipeline: [
          {
            $project: {
              _id: 0,
              name: 1,
            },
          },
        ],
        as: "activity",
      },
    },
    {
      $unwind: {
        path: "$activity",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "countries",
        localField: "countryId",
        foreignField: "_id",
        pipeline: [
          {
            $project: {
              _id: 0,
              name: 1,
            },
          },
        ],
        as: "country",
      },
    },
    {
      $unwind: {
        path: "$country",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        country_name: "$country.name",
        activity_Type: "$activity.name",
        activityId: "$activityName._id",
        activityname: "$activityName.activityTitle",
      },
    },
    {
      $project: {
        __v: 0,
        isDeleted: 0,
        createdOn: 0,
        country: 0,
        activity: 0,
        activityName: 0,

        // countryId: 0,
        // activityTypeId: 0,
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
        message: "Banner",
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

const editBanner = async (req, res) => {
  await HomePageBanner.findOneAndUpdate(
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
        message: "Banner updated successfully",
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

const deleteBanner = async (req, res) => {
  HomePageBanner.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(req.params.id),
    },
    { isDeleted: true }
  )
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Successfully retrieved banners",
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
  addHomePageBanner,
  uploadbannerImage,
  bannerVdo,
  viewBanner,
  editBanner,
  deleteBanner,
};
