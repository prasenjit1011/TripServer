const mongoose = require("mongoose");
const ActivitySite = require("../../Models/activitySite");
const ActivityType = require("../../Models/activityType");
const Section = require("../../Models/section");
const ResponseCode = require("../../service/responseCode");
const { Validator } = require("node-input-validator");
const { DBerror, InputError } = require("../../service/errorHandeler");
const Tour = require("../../Models/tour");
// import { ActivitySite } from '../../Models/ActivitySite'

const S3 = require("../../service/s3");

const activitySiteImg = async (req, res) => {
  let actimg = await S3.doUpload(req, "activitySite/image");

  res.status(ResponseCode.errorCode.success).json({
    status: true,
    data: actimg.url,
  });
};

const addActivitySite = async (req, res) => {
  const activitySiteData = {
    ...req.body,
  };
  new ActivitySite(activitySiteData)
    .save()
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "New activity site  added successfully",
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

const viewActivitySite = async (req, res) => {
  await ActivitySite.aggregate([
    {
      $match: {
        isDeleted: false,
        status: true,
      },
    },
    {
      $lookup: {
        from: "cities",
        localField: "cityId",
        foreignField: "_id",
        pipeline: [
          {
            $lookup: {
              from: "countries",
              localField: "countryId",
              foreignField: "_id",
              pipeline:[
                {
                  $project:{
                    name: 1
                  }
                }
              ],
              as: "countryData"
            }
          },
          {$unwind:{
            path:"$countryData",preserveNullAndEmptyArrays:true
          }},
          {
            $addFields:{
              countyname: "$countryData.name",
              countryId:"$countryData._id"
            }
          }
        ],
        as: "city",
      },
    },
    {$unwind:{
      path:"$city",preserveNullAndEmptyArrays:true
    }},
    {$addFields:{
      cityName:"$city.cityName",
      country: "$city.countyname",
      countryId:"$city.countryId"
    }},

    {
      $project: {
        createdOn: 0,
        updatedOn: 0,
        isDeleted: 0,
        status: 0,
        __v: 0,
        city:0
      },
    },
    {
      $sort: {
        _id: -1,
        // createdOn: -1,
      },
    },
  ])
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Activity site list",
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

const editActivitySite = async (req, res) => {
  ActivitySite.findOneAndUpdate(
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
        message: "New activity site  updated  successfully",
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

const deleteActivitySite = async (req, res) => {
  ActivitySite.findOneAndUpdate(
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
        message: " activity site  deleted  successfully",
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

const viewSingleActivitySite = async (req, res) => {
  await ActivitySite.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.params.id),
        isDeleted: false,
        status: true,
      },
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
  ])
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "view single Activity site list",
        data: data,
        // data:data[0]
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
  addActivitySite,
  viewActivitySite,
  editActivitySite,
  activitySiteImg,
  deleteActivitySite,
  viewSingleActivitySite,
};
