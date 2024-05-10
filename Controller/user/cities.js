const mongoose = require("mongoose");
const cityModel = require("../../Models/city");
const Country = require('../../Models/country')
const ActivityDetails = require("../../Models/activityDetails");
const ResponseCode = require("../../service/responseCode");

const { DBerror } = require("../../service/errorHandeler");

const viewSingleCity = async (req, res) => {
  await cityModel
    .aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.params.id),
          isDeleted: false,
          status: true,
        },
      },

      {
        $project: {
          isDeleted: 0,
          status: 0,
          createdOn: 0,
          updatedOn: 0,
          __v: 0,
        },
      },
    ])
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "City list",
        data: data,
        //   data:data[0]
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

const viewAllCity = async (req, res) => {
  await cityModel
    .aggregate([
      {
        $match: {
          isDeleted: false,
          status: true,
        },
      },

      {
        $project: {
          cityName: 1,
          picture: 1,
          topPriority: 1
        },
      },
    ])
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "City list",
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

const allCities = async (req, res) => {
  await cityModel
    .aggregate([
      {
        $match: {
          isDeleted: false,
          status: true
        },
      },
      {
        $lookup: {
          from: "activitydetails",
          localField: "_id",
          foreignField: "cityId",
          pipeline: [
            {
              $match: {
                isDeleted: false,
                status: true,
                saveAsDraft: false,
              },
            },
            {
              $project: {
                cityId: 1,

              },
            },
          ],
          as: "activity",
        },
      },
      {
        $sort: {
          topPriority: 1,
        },
      },
      {
        $project: {
          cityName: 1,
          picture: 1,
          tourAndActivity: { $size: "$activity" },
          topPriority: 1
        },
      },
    ])
    .then((data) => {
      res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Get all data",
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

const viewCityAgainstCountry = async (req, res) => {
// let countrydata = Country.findOne()

  await cityModel
    .aggregate([
      {
        $match: {
          countryId: new mongoose.Types.ObjectId(req.params.countryId),
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: "countries",
          localField: "countryId",
          foreignField: "_id",
          as: "conuntDetails",
        },
      },
      {
        $unwind: { path: "$conuntDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $addFields: {
          countryName: "$conuntDetails.name",
        },
      },
      {
        $project: {
          conuntDetails: 0,
          isDeleted: 0,
          status: 0,
          createdOn: 0,
          updatedOn: 0,
          __v: 0,
        },
      },
    ])
    .then((data) => {
      // console.log("data",data);
      let countryData;
      data.forEach((ele)=>{
        countryData =ele.countryName
      })

      // console.log("countryData",countryData);

      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "City list",
        countryname:countryData,
        data: data,
        // data: data[0],
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

const mostPopularActivityAgaintCity = (req, res) => {
  ActivityDetails.aggregate([
    {
      $match: {
        cityId: new mongoose.Types.ObjectId(req.params.id),
        isDeleted: false,
        isApproval: true
      },
    },
    {
      $sort: {
        topPriority: 1,
      },
    },
    {
      $limit: 10,
    },
    {
      $project: {
        activityTitle: 1,
        description: 1,
        slug: 1,
        image: 1
      },
    },
  ])
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Most popular activity list based on single city",
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
  viewSingleCity,
  allCities,
  viewAllCity,
  viewCityAgainstCountry,
  mostPopularActivityAgaintCity,
};
