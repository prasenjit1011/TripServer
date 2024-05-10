const mongoose = require("mongoose");
const TourModule = require("../../Models/tourModule");
const ActivityDetails = require("../../Models/activityDetails");
const ResponseCode = require("../../service/responseCode");
const { Validator } = require("node-input-validator");
const { DBerror, InputError } = require("../../service/errorHandeler");


const viewAllTourModule = async (req, res) => {
    TourModule
      .aggregate([
        {
          $match: {
            isDeleted: false,
            cityId:new mongoose.Types.ObjectId(req.params.id),
            status: true,
          },
        },
        {
          $project: {
            isDeleted: 0,
            createdOn: 0,
            updatedOn: 0,
            __v: 0,
          },
        },
        {
          $sort: {
            // _id: -1,
            createdOn: -1,
          },
        },
      ])
      .then((data) => {
        return res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "tourModule list",
          data: data,
        });
      })
      .catch((error) => {
        return res.status(ResponseCode.errorCode.serverError).json({
          status: false,
          message: "Error occur",
          error: error,
        });
      });
  };


  const viewAllActivityTour = async (req, res) => {
    await ActivityDetails
      .aggregate([
        {
          $match: {
            cityId: new mongoose.Types.ObjectId(
              req.params.cityId
            ),
            tourModuleId: new mongoose.Types.ObjectId(
                req.params.tourId
              ),
            isDeleted: false,
            status: true,
          },
        },
            
              {
                $lookup: {
                  from: "categories",
                  localField: "categoryId",
                  foreignField: "_id",
                  pipeline: [
                    {
                      $project: {
                        isDeleted: 0,
                        createdOn: 0,
                        updatedOn: 0,
                        __v: 0,
                      },
                    },
                  ],
                  as: "categoriesData",
                },
              },
              {
                $unwind: {
                  path: "$categoriesData",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $lookup: {
                  from: "reviewratings",
                  localField: "_id",
                  foreignField: "activityDetailsId",
                  pipeline: [
                    {
                      $project: {
                        _id: 0,
                        avgRating: 1,
                      },
                    },
                  ],
                  as: "review1",
                },
              },
              // {
              //   $unwind: { path: "$review1", preserveNullAndEmptyArrays: true }
              // },
  
              {
                $addFields: {
                  review: { $sum: { $avg: "$review1.avgRating" } },
                },
              },
  
              {
                $project: {
                  categoriesData: 1,
                  activityTitle: 1,
                  slug: 1,
                  description: 1,
                  activityActualPrice: 1,
                  tourActivity: 1,
                  tourDuration: 1,
                  image: 1,
                  // review1: 1,
                  review: 1,
                },
              },
          
        {
          $lookup: {
            from: "activitysites",
            localField: "activitySiteId",
            foreignField: "_id",
            as: "sites",
            pipeline: [
              {
                $lookup: {
                  from: "activitydetails",
                  localField: "_id",
                  foreignField: "activitySiteId",
                  as: "activity",
                },
              },
              {
                $addFields: {
                  activityCount: { $size: "$activity" },
                },
              },
              {
                $project: {
                  status: 0,
                  isDeleted: 0,
                  activity: 0,
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: "cities",
            localField: "cityId",
            foreignField: "_id",
            as: "city",
            pipeline: [
              {
                $project: {
                  status: 0,
                  isDeleted: 0,
                },
              },
            ],
          },
        },
  
        {
          $project: {
            activityTypeId: 0,
            status: 0,
            isDeleted: 0,
          },
        },
      ])
      .then((data) => {
        
        return res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "View All Activity",
          data: data,
        });
      })
      .catch((error) => {
        console.log(error)
        const errors = DBerror(error);
        return res.status(ResponseCode.errorCode.serverError).json({
          status: false,
          message: "Invalid id. Server error.",
          error: errors,
        });
      });
  };


module.exports={
    viewAllTourModule,
    viewAllActivityTour
}