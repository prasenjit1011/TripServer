const mongoose = require("mongoose");
const ActivitySite = require("../../Models/activitySite");
const Destination = require("../../Models/destination");
const ResponseCode = require("../../service/responseCode");
const sitemap = require("../../Models/siteMaps");
const { DBerror } = require("../../service/errorHandeler");

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
        message: "Invalid id. Server error.",
        error: errors,
      });
    });
};

const topActivityCites = async (req, res) => {
  await Destination.aggregate([
    {
      $match: {
        isDeleted: false,
        status: true,
      },
    },
    {
      $lookup: {
        from: "activitydetails",
        localField: "_id",
        foreignField: "destination",
        pipeline: [
          {
            $match: {
              isDeleted: false,
              status: true,
              saveAsDraft: false,
            },
          },
        ],
        as: "siteData",
      },
    },
    {
      $sort: {
        topPriority: 1,
      },
    },
    {
      $addFields: {
        destinationName: "$name"
      }
    },
    {
      $project: {
        destinationName: 1,
        tourAndActivity: { $size: "$siteData" },
       
      },
    },
  ])
    .then((data) => {
      res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Get all the data",
        data: data,
      });
    })
    .catch((error) => {
      const errors = DBerror(error);
      res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error, Please try again later",
        error: errors,
      });
    });
};

const viewSitemap = async (req, res) => {
  await sitemap
    .aggregate([
      {
        $match: {
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: "$continent",
        },
      },
      {
        $lookup: {
          from: "sitemaps",
          localField: "_id",
          foreignField: "continent",
          pipeline: [
            {
              $lookup: {
                from: "countries",
                localField: "countryId",
                foreignField: "_id",
                pipeline: [
                  {
                    $project: {
                      isDeleted: 0,
                      status: 0,
                      createdOn: 0,
                      updatedOn: 0,
                      __v: 0,
                    },
                  },
                ],
                as: "countryDetails",
              },
            },
            {
              $unwind: {
                path: "$countryDetails",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $addFields: {
                countryName: "$countryDetails.name",
                countryId: "$countryDetails._id"
              },
            },
            {
              $project: {
                _id: 0,
                countryName: 1,
                countryId: 1
              },
            },
          ],
          as: "continent",
        },
      },

      {
        $project: {
          countryDetails: 0,
          __v: 0,
          isDeleted: 0,
          createdOn: 0,
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
        message: "sitemap viewed sucessfully",
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
  viewSingleActivitySite,
  topActivityCites,
  viewSitemap,
};
