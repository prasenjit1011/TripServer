const mongoose = require("mongoose");
const reviewRating = require("../../Models/reviewRating");
const ResponseCode = require("../../service/responseCode");
const { DBerror, InputError } = require("../../service/errorHandeler");
var moment = require("moment");
const { checkout } = require("../../routes/v1");

const addReviewRating = async (req, res) => {
  var check = await reviewRating
    .find({
      userId: req.user._id,
      activityDetailsId: new mongoose.Types.ObjectId(
        req.body.activityDetailsId
      ),
    })
    .exec();

  console.log({ check });


  if (check.length > 0) {
    return res.status(ResponseCode.errorCode.dataExist).json({
      status: false,
      message: "data already exist",
    });
  } else {
    const { guide, valueForMoney, service, organization } = req.body;
    const rrData = {

      ...req.body,
      userId:req.user._id
    };
    const totalRatings = 4;
    const sumOfRatings = guide + valueForMoney + service + organization;
    const avgRating = sumOfRatings / totalRatings;
    // console.log("avgRating",avgRating);
    rrData.avgRating = avgRating;

    new reviewRating(rrData)
      .save()
      .then((data) => {
        res.status(ResponseCode.errorCode.success).json({
          status: "true",
          message: "Rating add Sucessfully",
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

const checkReviewRating = async (req, res) => {
  console.log(req.user._id);

  var check = await reviewRating
    .find({
      userId: req.user._id,
      activityDetailsId: new mongoose.Types.ObjectId(req.body.id),
    })
    .exec();

  console.log({ check });

  if (check.length > 0) {
    console.log({ check });
    reviewRating
      .find({ _id: check[0]._id })
      .then((data) => {
        res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "View rating",
          data: data,
        });
      })
      .catch((error) => {
        const errors = DBerror(error);
        return res.status(ResponseCode.errorCode.serverError).json({
          status: false,
          message: "Server error,Please try again",
        });
      });
  } else {
    res.status(ResponseCode.errorCode.dataNotFound).json({
      status: false,
      message: "No review is given",
    });
  }
};

const editReviewRating = async (req, res) => {
  const { guide, valueForMoney, service, organization } = req.body;
  const totalRatings = 4;
  const sumOfRatings = guide + valueForMoney + service + organization;
  const avgRating = sumOfRatings / totalRatings;

  await reviewRating
    .findOneAndUpdate(
      { _id: req.params.id },
      {
        ...req.body,
        avgRating: avgRating,
      }
    )
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Rating updated successfully",
        // data: data,
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

const deleteReviewRating = async (req, res) => {
  await reviewRating
    .findOneAndUpdate(
      { _id: req.params.id },
      {
        isDeleted: true,
      }
    )
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Rating deleted successfully",
        // data: data,
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

const viewMonthWiseRating = async (req, res) => {
  await reviewRating
    .aggregate([
      {
        $match: {
          isDeleted: false,
          // activityDetailsId:new mongoose.Types.ObjectId(req.body.activity)
        },
      },
      // {
      //   $group: {
      //     _id: "$activityDetailsId",
      //   },
      // },
      // {
      //   $lookup: {
      //     from: "reviewratings",
      //     localField: "_id",
      //     foreignField: "activityDetailsId",

      //     pipeline: [

      //       {
      //         $group: {
      //           _id: {
      //             year: { $year: "$date" },
      //             month: { $month: "$date" },
      //           }
      //         }
      //       },
      //       {

      //       }

      //     ],
      //     as: "ratings",
      //   },
      // },
      {
        $group: {
          _id: {
            userId: "$activityDetailsId",
            month: { $month: "$date" },
            year: { $year: "$date" },
          },
          avgRating: { $avg: "$avgRating" },
        },
      },
      {
        $project: {
          _id: 0,
          userId: "$_id.userId",
          month: "$_id.month",
          year: "$_id.year",
          avgRating: 1,
        },
      },
      // {
      //   $group:
      //   {
      //     _id: {
      //       year: { $year: "$date" },
      //       month: { $month: "$date" },
      //       activity: "$activityDetailsId"
      //     },
      //   }
      // }
      // {
      //   $group: {
      //     _id: "$activityDetailsId"
      //   }
      // },
      // {
      //   $lookup: {
      //     from: "reviewratings",
      //     localField: "_id",
      //     foreignField: "activityDetailsId",
      //     pipeline: [
      //       // {
      //       //   $group: {
      //       //     _id: { $month: "$date" },
      //       //   }
      //       // },
      //       {
      //         $project: {
      //           avgRating: 1,
      //           date: 1,
      //           time: 1
      //         }
      //       },

      //     ],
      //     as: "activityData"
      //   }
      // },
      // {
      //   $addFields: {
      //     review: { $sum: { $avg: "$activityData.avgRating" } },
      //   },
      // },
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
      console.log("errors", errors);
      res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error, Please try again later",
        error: errors,
      });
    });
};

module.exports = {
  addReviewRating,
  editReviewRating,
  deleteReviewRating,
  viewMonthWiseRating,
  checkReviewRating,
};
