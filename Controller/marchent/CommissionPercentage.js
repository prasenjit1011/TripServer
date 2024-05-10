const mongoose = require("mongoose");
const CommissionPercentage = require("../../Models/commissionPercentage");
const Merchants = require("../../Models/merchant");
const ActivityDetails = require("../../Models/activityDetails");
const SpecialOffer = require("../../Models/specialOffer");
const Booking = require("../../Models/userBooking");
const ResponseCode = require("../../service/responseCode");
const { DBerror, InputError } = require("../../service/errorHandeler");


const listOfPayouts = (req, res) => {
  console.log(req.user._id);
  Booking.aggregate([
    {
      $match: {
        isDeleted: false,
        bookingStatus: "completed",
      },
    },

    {
      $lookup: {
        from: "activitydetails",
        localField: "activityDetailsId",
        foreignField: "_id",
        pipeline: [
          {
            $match: {
              addedByid: req.user._id,
            },
          },
          {
            $addFields: {
              countryId: "$countryId",
            },
          },
          {
            $lookup: {
              from: "cxommissionpercentages",
              localField: "addedByid",
              foreignField: "merchantID",
              as: "addedBy",
              pipeline: [
                {
                  $match: {
                    isDeleted: false,
                  },
                },
                {
                  $project: {
                    _id: 0,
                    // commissionPercentage: 1,
                  },
                },
              ],
            },
          },
          { $unwind: { path: "$addedBy", preserveNullAndEmptyArrays: true } },

          {
            $addFields: {
              marchentCommisonPercentage: {
                $switch: {
                  branches: [
                    {
                      case: { $eq: ["$addedBy.commissionType", "individualLevel"] },
                      then: "$addedBy.commissionPercentage",
                    },
                    {
                      case: { $eq: ["$addedBy.commissionType", "global"] },
                      then: "$addedBy.commissionPercentage",
                    },
                    {
                      case: {
                         $eq: [
                          "$addedBy.commissionType", "countryWise",
                        ], 
                      },
                      then: {
                       $cond: {
                          if: {
                            $eq: [
                              "$addedBy.commissionType",
                              "countryWise",
                            ],
                          },
                          then: {
                            $let: {
                              vars: {
                                matchingCountry: {
                                  $arrayElemAt: [
                                    {
                                      $filter: {
                                        input: "$addedBy.countryWisePercentage",
                                        as: "country",
                                        cond: {
                                          $eq: [
                                            "$$country.countryID",
                                            "$countryId",
                                          ],
                                        },
                                      },
                                    },
                                    0,
                                  ],
                                },
                              },
                              in: {
                                $cond: {
                                  if: { $ne: ["$$matchingCountry", null] },
                                  then: "$$matchingCountry.commissionPercentage",
                                  else: null,
                                },
                              },
                            },
                          },
                          else: "$addedBy.commissionPercentage", // Use the global or individualLevel commissionPercentage
                        },

                      },
                    },
                  ],
                  default: null,
                },
              },
            },
          },

          
          {
            $project: {
              countryId:1,
              marchentCommisonPercentage: 1,
              activityTitle: 1,
              // image: 1,
              referenceCode: 1,
              productCode: 1,
              createdOn: 1,

              // addedBy:1,
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
        from: "users",
        localField: "userId",
        foreignField: "_id",
        pipeline: [
          {
            $project: {
              firstName: 1,
              lastName: 1,
              email: 1,
              mobileNo: 1,
              fullName: { $concat: ["$firstName", " ", "$lastName"] },
            },
          },
        ],
        as: "userDetails",
      },
    },
    {
      $unwind: {
        path: "$userDetails",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        activityName: "$activity.activityTitle",
        activityReferenceID: "$activity.referenceCode",
        avtivtyProductCode: "$activity.productCode",
        activityDate: "$activity.createdOn",
        userName: "$userDetails.fullName",
        bookingRefId: "$alpfaNueID",
        bookingDate: "$bookingDate",
        bookingTime: "$bookingTime",
        bookingAmmount: "$amount",
        marchentCommisonPercentage: "$activity.marchentCommisonPercentage",
        marchentGetPrice: {
          $round: [
            {
              $subtract: [
                "$amount",
                {
                  $multiply: [
                    "$amount",
                    { $divide: ["$activity.marchentCommisonPercentage", 100] },
                  ],
                },
              ],
            },
            2, // Round to 2 decimal places
          ],
        },
      },
    },
    {
        $addFields: {
          // ... other fields ...
          adminGetPrice: {
            $subtract: ["$bookingAmmount", "$marchentGetPrice"]
          }
        }
      },
    {
      $sort: {
        createdOn: -1,
      },
    },

    {
      $project: {
        activity: 1,
        activityName: 1,
        activityReferenceID: 1,
        avtivtyProductCode: 1,
        activityDate: 1,
        userName: 1,
        bookingRefId: 1,
        bookingDate: 1,
        bookingTime: 1,
        bookingAmmount: 1,
        marchentCommisonPercentage: 1,
        marchentGetPrice: 1,
        adminGetPrice:1
      },
    },
  ])
    .then((data) => {
      const result = data.filter(
        (a) => a.activity !== null && a.activity !== undefined
      );
      const marchentTotalGetPrice = result.reduce(
        (total, item) => total + (item.marchentGetPrice || 0),
        0
      );
      const adminTotalGetPrice = result.reduce(
        (total, item) => total + (item.adminGetPrice || 0),
        0
      );

      res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Marchent finance booking details fetched successfully!",
        // data: data.filter((a) => a.activity !== null && a.activity !== undefined),
        length: result.length,
        data: result,
        marchentTotalGetPrice: parseFloat(marchentTotalGetPrice.toFixed(2)),
        adminTotalGetPrice: parseFloat(adminTotalGetPrice.toFixed(2)),

      });
    })

    .catch((error) => {
      console.log("error is", error);
      res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error, Please try again later",
        error: error,
      });
    });
};





module.exports = {
  listOfPayouts,
};
