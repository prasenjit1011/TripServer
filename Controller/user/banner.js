const mongoose = require("mongoose");
const HomePageBanner = require("../../Models/homePageBanner");
const ResponseCode = require("../../service/responseCode");

const viewBanner = async (req, res) => {
  HomePageBanner.aggregate([
    {
      $match: {
        activityTypeId: new mongoose.Types.ObjectId(req.params.activityTypeId),
        isDeleted: false,
        active: true,
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
    //   {
    //     $lookup: {
    //       from: "countries",
    //       localField: "countryId",
    //       foreignField: "_id",
    //       pipeline: [
    //         {
    //           $project: {
    //             _id: 0,
    //             name: 1,
    //           },
    //         },
    //       ],
    //       as: "country",
    //     },
    //   },
    //   {
    //     $unwind: {
    //       path: "$country",
    //       preserveNullAndEmptyArrays: true,
    //     },
    //   },
    {
      $lookup: {
        from: "activitydetails",
        localField: "activityId",
        foreignField: "_id",
        pipeline: [
          {
            $project: {
              _id: 0,
              slug: 1,
            },
          },
        ],
        as: "activityDetails",
      },
    },
    {
      $unwind: {
        path: "$activityDetails",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        //   country_name: "$country.name",
        activity_Type: "$activity.name",
        slug: "$activityDetails.slug"
      },
    },
    {
      $project: {
        __v: 0,
        isDeleted: 0,
        createdOn: 0,
        activityDetails: 0,
        //   country: 0,
        activity: 0,
        //   countryId: 0,
        //   activityTypeId: 0,
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

module.exports = {
  viewBanner
}