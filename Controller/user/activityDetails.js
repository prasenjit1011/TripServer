const mongoose = require("mongoose");
const sectionModel = require("../../Models/section");
const Category = require("../../Models/category");
const UserBooking = require("../../Models/userBooking");
const Country = require("../../Models/country");
const Desination = require("../../Models/destination");
const ResponseCode = require("../../service/responseCode");
const { DBerror, InputError } = require("../../service/errorHandeler");
const activityDetailsModel = require("../../Models/activityDetails");
const activitySites = require("../../Models/activitySite");
const city = require("../../Models/city");
const ReviewRating = require("../../Models/reviewRating");
var moment = require("moment");

const viewActivityDetails = async (req, res) => {
  await sectionModel
    .aggregate([
      {
        $match: {
          activityTypeId: new mongoose.Types.ObjectId(
            req.params.activityTypeId
          ),
          isDeleted: false,
          status: true,
        },
      },
      {
        $lookup: {
          from: "activitydetails",
          localField: "activityDetailsId",
          foreignField: "_id",
          as: "activity",
          pipeline: [
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
          ],
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
      data.map((ele) => {
        ele.activity.review1;
      });
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "View Tours",
        data: data,
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

const singleActivityDetails = async (req, res) => {
  const page = req.params.page ? parseInt(req.params.page) : 1;
  const pageSize = 5;
  await activityDetailsModel
    .aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.params.id),
          slug: req.params.slug,
          isDeleted: false,
          // status: true,
        },
      },
      // discount price and adult price in main list function start \\
      {
        $lookup: {
          from: "specialoffers",
          localField: "specialOfferId",
          foreignField: "_id",
          as: "offerDetails",
        },
      },
      {
        $unwind: { path: "$offerDetails", preserveNullAndEmptyArrays: true },
      },

      {
        $addFields: {
          activityActualAdultPrice: "$participentType",
        },
      },
      {
        $addFields: {
          adultPrice: {
            $arrayElemAt: [
              {
                $filter: {
                  input: "$activityActualAdultPrice",
                  as: "priceItem",
                  cond: { $eq: ["$$priceItem.pertype", "Adult"] },
                },
              },
              0,
            ],
          },
        },
      },
      {
        $addFields: {
          activityAdultPrice: "$adultPrice.price",
        },
      },

      {
        $addFields: {
          duration: {
            $ifNull: ["$offerDetails.duration", 0],
          },
        },
      },

      {
        $addFields: {
          durationInSeconds: {
            $switch: {
              branches: [
                {
                  case: {
                    $eq: ["$offerDetails.duration.unit", "days"],
                  },
                  then: {
                    $multiply: [
                      "$offerDetails.duration.value",
                      24 * 60 * 60 * 1000,
                    ],
                  },
                },
                {
                  case: {
                    $eq: ["$offerDetails.duration.unit", "hours"],
                  },
                  then: {
                    $multiply: ["$offerDetails.duration.value", 60 * 60 * 1000],
                  },
                },
                {
                  case: {
                    $eq: ["$offerDetails.duration.unit", "minutes"],
                  },
                  then: {
                    $multiply: ["$offerDetails.duration.value", 60 * 1000],
                  },
                },
              ],
              default: 0, // Default value if "unit" doesn't match any of the cases
            },
          },
        },
      },
      {
        $addFields: {
          startDate: {
            $cond: {
              if: { $ne: ["$offerDetails.startDate", null] },
              then: "$offerDetails.startDate", // Use offerDetails.startDate if available
              else: new Date(), // Use the current date as a default if offerDetails.startDate is null
            },
          },
        },
      },

      {
        $addFields: {
          endDate: {
            $cond: {
              if: { $ne: ["$offerDetails", null] }, // Check if offerDetails is not null
              then: { $add: ["$startDate", "$durationInSeconds"] }, // Calculate endDate
              else: null, // Set endDate to null if offerDetails is null
            },
          },
        },
      },
      {
        $addFields: {
          discountPrice: {
            $cond: {
              if: {
                $and: [
                  { $ne: ["$offerDetails", null] }, // Check if offerDetails is not null
                  { $gte: ["$endDate", new Date()] }, // Check if endDate is not over the current date
                ],
              },
              then: "$offerDetails.discountPercentage", // Use discountPercentage if conditions are met
              else: null, // Set discountPrice to null if conditions are not met
            },
          },
        },
      },

      {
        $addFields: {
          activitydiscountedPrice: {
            $cond: {
              if: { $eq: ["$discountPrice", null] }, // Check if discountPrice is null
              then: null, // Set activitydiscountedPrice to null if discountPrice is null
              else: {
                $multiply: [
                  "$activityAdultPrice",
                  { $divide: ["$discountPrice", 100] },
                ],
              },
            },
          },
        },
      },

      // discount price and adult price in main list function End \\

      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          pipeline: [
            {
              $lookup: {
                from: "activitydetails",
                localField: "_id",
                foreignField: "categoryId",
                pipeline: [
                  {
                    $match: {
                      _id: { $ne: new mongoose.Types.ObjectId(req.params.id) },
                      isDeleted: false,
                      isApproval: true,
                      // status : true
                    },
                  },

                  // discount price and adult price in main list function start \\
                  {
                    $lookup: {
                      from: "specialoffers",
                      localField: "specialOfferId",
                      foreignField: "_id",
                      as: "offerDetails",
                    },
                  },
                  {
                    $unwind: {
                      path: "$offerDetails",
                      preserveNullAndEmptyArrays: true,
                    },
                  },

                  {
                    $addFields: {
                      activityActualAdultPrice: "$participentType",
                    },
                  },
                  {
                    $addFields: {
                      adultPrice: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$activityActualAdultPrice",
                              as: "priceItem",
                              cond: { $eq: ["$$priceItem.pertype", "Adult"] },
                            },
                          },
                          0,
                        ],
                      },
                    },
                  },
                  {
                    $addFields: {
                      activityAdultPrice: "$adultPrice.price",
                    },
                  },

                  {
                    $addFields: {
                      duration: {
                        $ifNull: ["$offerDetails.duration", 0],
                      },
                    },
                  },

                  {
                    $addFields: {
                      durationInSeconds: {
                        $switch: {
                          branches: [
                            {
                              case: {
                                $eq: ["$offerDetails.duration.unit", "days"],
                              },
                              then: {
                                $multiply: [
                                  "$offerDetails.duration.value",
                                  24 * 60 * 60 * 1000,
                                ],
                              },
                            },
                            {
                              case: {
                                $eq: ["$offerDetails.duration.unit", "hours"],
                              },
                              then: {
                                $multiply: [
                                  "$offerDetails.duration.value",
                                  60 * 60 * 1000,
                                ],
                              },
                            },
                            {
                              case: {
                                $eq: ["$offerDetails.duration.unit", "minutes"],
                              },
                              then: {
                                $multiply: [
                                  "$offerDetails.duration.value",
                                  60 * 1000,
                                ],
                              },
                            },
                          ],
                          default: 0, // Default value if "unit" doesn't match any of the cases
                        },
                      },
                    },
                  },
                  {
                    $addFields: {
                      startDate: {
                        $cond: {
                          if: { $ne: ["$offerDetails.startDate", null] },
                          then: "$offerDetails.startDate", // Use offerDetails.startDate if available
                          else: new Date(), // Use the current date as a default if offerDetails.startDate is null
                        },
                      },
                    },
                  },

                  {
                    $addFields: {
                      endDate: {
                        $cond: {
                          if: { $ne: ["$offerDetails", null] }, // Check if offerDetails is not null
                          then: { $add: ["$startDate", "$durationInSeconds"] }, // Calculate endDate
                          else: null, // Set endDate to null if offerDetails is null
                        },
                      },
                    },
                  },
                  {
                    $addFields: {
                      discountPrice: {
                        $cond: {
                          if: {
                            $and: [
                              { $ne: ["$offerDetails", null] }, // Check if offerDetails is not null
                              { $gte: ["$endDate", new Date()] }, // Check if endDate is not over the current date
                            ],
                          },
                          then: "$offerDetails.discountPercentage", // Use discountPercentage if conditions are met
                          else: null, // Set discountPrice to null if conditions are not met
                        },
                      },
                    },
                  },

                  {
                    $addFields: {
                      activitydiscountedPrice: {
                        $cond: {
                          if: { $eq: ["$discountPrice", null] }, // Check if discountPrice is null
                          then: null, // Set activitydiscountedPrice to null if discountPrice is null
                          else: {
                            $multiply: [
                              "$activityAdultPrice",
                              { $divide: ["$discountPrice", 100] },
                            ],
                          },
                        },
                      },
                    },
                  },

                  // discount price and adult price in main list function End \\

                  {
                    $lookup: {
                      from: "reviewratings",
                      localField: "_id",
                      foreignField: "activityDetailsId",
                      pipeline: [
                        {
                          $project: {
                            _id: 0,
                            activityDetailsId: 1,
                            avgRating: 1,
                          },
                        },
                      ],
                      as: "otherReview",
                    },
                  },
                  {
                    $addFields: {
                      reviewRating: {
                        $sum: { $avg: "$otherReview.avgRating" },
                      },
                    },
                  },
                  {
                    $addFields: {
                      totalReview: { $size: "$otherReview" },
                    },
                  },

                  {
                    $project: {
                      // offerDetails: 1,
                      activityAdultPrice: 1,
                      startDate: 1,
                      endDate: 1,
                      duration: 1,
                      discountPrice: 1,
                      activitydiscountedPrice: 1,
                      slug: 1,
                      activityTitle: 1,
                      image: 1,
                      activityActualPrice: 1,
                      reviewRating: 1,
                      currency: 1,
                      totalReview: 1,
                      likelyToSellOut: 1,
                    },
                  },
                ],

                as: "othersActivity",
              },
            },
            {
              $project: {
                categoryName: 1,
                othersActivity: 1,
                // reviewRating: "$othersActivity.reviewRating"
              },
            },
          ],
          as: "catDetails",
        },
      },
      {
        $unwind: { path: "$catDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "languages",
          localField: "languageId",
          foreignField: "_id",
          as: "langDetails",
        },
      },
      {
        $unwind: { path: "$langDetails", preserveNullAndEmptyArrays: true },
      },

      {
        $lookup: {
          from: "activitytypes",
          localField: "activityTypesId",
          foreignField: "_id",
          as: "activitytypeDetails",
        },
      },
      {
        $unwind: {
          path: "$activitytypeDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "sections",
          localField: "sectionId",
          foreignField: "_id",
          as: "sectionsDetails",
        },
      },
      {
        $unwind: { path: "$sectionsDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "activitysites",
          localField: "activitySiteId",
          foreignField: "_id",
          as: "activitysiteDetails",
        },
      },
      {
        $unwind: {
          path: "$activitysiteDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "cities",
          localField: "cityId",
          foreignField: "_id",
          as: "citiDetails",
        },
      },
      {
        $unwind: { path: "$citiDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "countries",
          localField: "countryId",
          foreignField: "_id",
          as: "country",
        },
      },
      {
        $unwind: { path: "$country", preserveNullAndEmptyArrays: true },
      },

      {
        $lookup: {
          from: "reviewratings",
          localField: "_id",
          foreignField: "activityDetailsId",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "user",
              },
            },
            {
              $addFields: {
                userName: { $arrayElemAt: ["$user", 0] },
              },
            },
            {
              $addFields: {
                firstName: "$userName.firstName",
              },
            },
            {
              $project: {
                __v: 0,
                isDeleted: 0,
                // createdOn: 0,
                user: 0,
                userName: 0,
                updatedOn: 0,
              },
            },
            {
              $sort: {
                createdOn: -1,
              },
            },
            {
              $skip: (page - 1) * pageSize,
            },
            {
              $limit: pageSize,
            },
          ],
          as: "review",
        },
      },
      {
        $lookup: {
          from: "merchants",
          localField: "addedByid",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                // _id: 0,

                fullname: { $concat: ["$firstName", " ", "$lastName"] },
                companyName: 1,
              },
            },
          ],
          as: "merchant",
        },
      },
      { $unwind: { path: "$merchant", preserveNullAndEmptyArrays: true } },

      {
        $addFields: {
          addedBY: {
            $cond: {
              if: { $eq: ["$addedBy", "admin"] },
              then: "Things to dooo",
              else: "$merchant.fullname",
            },
          },
        },
      },
      {
        $addFields: {
          avgRating: { $sum: { $avg: "$review.avgRating" } },
          valueForMoney: { $sum: { $avg: "$review.valueForMoney" } },
          guide: { $sum: { $avg: "$review.guide" } },
          service: { $sum: { $avg: "$review.service" } },
          organization: { $sum: { $avg: "$review.organization" } },
          latestReviewer: "$review",
        },
      },

      {
        $addFields: {
          // specialOfferName: "$offerDetails.specialOfferName",
          // discountPercentage: "$offerDetails.discountPercentage",
          cityName: "$citiDetails.cityName",
          countryName: "$country.name",
          activitySiteName: "$activitysiteDetails.siteName",
          sectionTitle: "$sectionsDetails.sectionTitle",
          activitytypeName: "$activitytypeDetails.name",
          language: "$langDetails.name",
          marchandID: "$merchant._id",
          marchandCompanyName: "$merchant.companyName",

          // catDetails: "$catDetails.categoryName",
        },
      },
      {
        $project: {
          // offerDetails: 0,
          activityActualAdultPrice: 0,
          adultPrice: 0,
          durationInSeconds: 0,
          citiDetails: 0,
          langDetails: 0,
          merDetails: 0,
          addedByid: 0,
          country: 0,
          activitytypeDetails: 0,
          sectionsDetails: 0,
          activitysiteDetails: 0,
          citiDetails: 0,
          review: 0,
          tourModuleId: 0,
          specialOfferId: 0,
          merchant: 0,
          // cityId:0,
          // activitySiteId:0,
          // categoryId:0,
          // activityTypesId:0,
          // countryId:0,
          // languageId:0,
          addedBy: 0,
          isDeleted: 0,
          userName: 0,
          __v: 0,
          createdOn: 0,
          updatedOn: 0,
        },
      },
    ])
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "View single Tours",
        data: data,
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

const singleActivityDetailsUser00 = async (req, res) => {
  const page = req.params.page ? parseInt(req.params.page) : 1;
  const pageSize = 5;
  await activityDetailsModel
    .aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.params.id),
          slug: req.params.slug,
          // isDeleted: false,
          // isApproval: true,
          // status: true,
        },
      },
      {
        $lookup: {
          from: "specialoffers",
          localField: "specialOfferId",
          foreignField: "_id",
          pipeline: [
            {
              $match: {
                endDate: {
                  $gte: moment.utc(new Date()).startOf("date").toDate(),
                },
              },
            },
          ],
          as: "offerDetails",
        },
      },
      {
        $unwind: { path: "$offerDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          pipeline: [
            {
              $lookup: {
                from: "activitydetails",
                localField: "_id",
                foreignField: "categoryId",
                pipeline: [
                  {
                    $match: {
                      _id: { $ne: new mongoose.Types.ObjectId(req.params.id) },
                    },
                  },
                  {
                    $lookup: {
                      from: "reviewratings",
                      localField: "_id",
                      foreignField: "activityDetailsId",

                      as: "otherReview",
                    },
                  },
                  {
                    $addFields: {
                      reviewRating: {
                        $avg: "$otherReview.avgRating",
                      },
                    },
                  },
                  {
                    $addFields: {
                      totalReview: { $size: "$otherReview" },
                    },
                  },

                  {
                    $project: {
                      // otherReview: 0
                      slug: 1,
                      activityTitle: 1,
                      image: 1,
                      currency: 1,
                      activityActualPrice: 1,
                      reviewRating: 1,
                      totalReview: 1,
                    },
                  },
                ],

                as: "othersActivity",
              },
            },
            {
              $project: {
                categoryName: 1,
                othersActivity: 1,
                // reviewRating: "$othersActivity.reviewRating"
              },
            },
          ],
          as: "catDetails",
        },
      },
      {
        $unwind: { path: "$catDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "languages",
          localField: "languageId",
          foreignField: "_id",
          as: "langDetails",
        },
      },
      {
        $unwind: { path: "$langDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "wishlists",
          localField: "_id",
          foreignField: "activityId",
          pipeline: [
            {
              $match: {
                userId: req.user._id,
              },
            },
            {
              $project: {
                isDeleted: 0,
                __v: 0,
                createdOn: 0,
                updatedOn: 0,
              },
            },
          ],
          as: "wishlist",
        },
      },
      {
        $addFields: {
          Iswishlist: {
            $cond: {
              if: { $gt: [{ $size: "$wishlist" }, 0] },
              then: true,
              else: false,
            },
          },
        },
      },

      {
        $lookup: {
          from: "activitytypes",
          localField: "activityTypesId",
          foreignField: "_id",
          as: "activitytypeDetails",
        },
      },
      {
        $unwind: {
          path: "$activitytypeDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "sections",
          localField: "sectionId",
          foreignField: "_id",
          as: "sectionsDetails",
        },
      },
      {
        $unwind: { path: "$sectionsDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "activitysites",
          localField: "activitySiteId",
          foreignField: "_id",
          as: "activitysiteDetails",
        },
      },
      {
        $unwind: {
          path: "$activitysiteDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "cities",
          localField: "cityId",
          foreignField: "_id",
          as: "citiDetails",
        },
      },
      {
        $unwind: { path: "$citiDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "countries",
          localField: "countryId",
          foreignField: "_id",
          as: "country",
        },
      },
      {
        $unwind: { path: "$country", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "reviewratings",
          localField: "_id",
          foreignField: "activityDetailsId",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "user",
              },
            },
            {
              $addFields: {
                userName: { $arrayElemAt: ["$user", 0] },
              },
            },
            {
              $addFields: {
                firstName: "$userName.firstName",
              },
            },
            {
              $project: {
                __v: 0,
                isDeleted: 0,
                userName: 0,
                user: 0,
                // createdOn: 0,
                updatedOn: 0,
              },
            },

            {
              $sort: {
                createdOn: -1,
              },
            },
            {
              $skip: (page - 1) * pageSize,
            },
            {
              $limit: pageSize,
            },
          ],
          as: "review",
        },
      },

      {
        $lookup: {
          from: "merchants",
          localField: "addedByid",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                // _id: 0,

                fullname: { $concat: ["$firstName", " ", "$lastName"] },
              },
            },
          ],
          as: "merchant",
        },
      },
      { $unwind: { path: "$merchant", preserveNullAndEmptyArrays: true } },

      {
        $addFields: {
          addedBY: {
            $cond: {
              if: { $eq: ["$addedBy", "admin"] },
              then: "Things to dooo",
              else: "$merchant.fullname",
            },
          },
        },
      },
      {
        $addFields: {
          avgRating: { $sum: { $avg: "$review.avgRating" } },
          valueForMoney: { $sum: { $avg: "$review.valueForMoney" } },
          guide: { $sum: { $avg: "$review.guide" } },
          service: { $sum: { $avg: "$review.service" } },
          organization: { $sum: { $avg: "$review.organization" } },
          latestReviewer: "$review",
        },
      },

      {
        $addFields: {
          // specialOfferName: "$offerDetails.specialOfferName",
          discountPercentage: "$offerDetails.discountPercentage",
          cityName: "$citiDetails.cityName",
          countryName: "$country.name",
          activitySiteName: "$activitysiteDetails.siteName",
          sectionTitle: "$sectionsDetails.sectionTitle",
          activitytypeName: "$activitytypeDetails.name",
          language: "$langDetails.name",
          marchandID: "$merchant._id",
          marchandCompanyName: "$merchant.companyName",

          // catDetails: "$catDetails.categoryName",
        },
      },
      {
        $project: {
          citiDetails: 0,
          langDetails: 0,
          merDetails: 0,
          addedByid: 0,
          country: 0,
          activitytypeDetails: 0,
          sectionsDetails: 0,
          activitysiteDetails: 0,
          citiDetails: 0,
          // offerDetails: 0,
          review: 0,
          userName: 0,
          merchant: 0,
          // wishlist: 0,
          // cityId:0,
          // activitySiteId:0,
          // categoryId:0,
          // activityTypesId:0,
          // countryId:0,
          // languageId:0,
          addedBy: 0,
          isDeleted: 0,
          __v: 0,
          createdOn: 0,
          updatedOn: 0,
        },
      },
    ])
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "View single Tours",
        data: data,
      });
    })
    .catch((error) => {
      console.log(error);
      const errors = DBerror(error);
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Invalid id. Server error.",
        error: errors,
      });
    });
};

const singleActivityDetailsUser = async (req, res) => {
  const page = req.params.page ? parseInt(req.params.page) : 1;
  const pageSize = 5;
  await activityDetailsModel
    .aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.params.id),
          slug: req.params.slug,
          isDeleted: false,
          saveAsDraft: false,
          isApproval: true,
          status: true,
        },
      },

      // discount price and adult price in main list function start //
      {
        $lookup: {
          from: "specialoffers",
          localField: "specialOfferId",
          foreignField: "_id",
          as: "offerDetails",
        },
      },
      {
        $unwind: { path: "$offerDetails", preserveNullAndEmptyArrays: true },
      },

      {
        $addFields: {
          activityActualAdultPrice: "$participentType",
        },
      },
      {
        $addFields: {
          adultPrice: {
            $arrayElemAt: [
              {
                $filter: {
                  input: "$activityActualAdultPrice",
                  as: "priceItem",
                  cond: { $eq: ["$$priceItem.pertype", "Adult"] },
                },
              },
              0,
            ],
          },
        },
      },
      {
        $addFields: {
          activityAdultPrice: "$adultPrice.price",
        },
      },

      {
        $addFields: {
          duration: {
            $ifNull: ["$offerDetails.duration", 0],
          },
        },
      },

      {
        $addFields: {
          durationInSeconds: {
            $switch: {
              branches: [
                {
                  case: {
                    $eq: ["$offerDetails.duration.unit", "days"],
                  },
                  then: {
                    $multiply: [
                      "$offerDetails.duration.value",
                      24 * 60 * 60 * 1000,
                    ],
                  },
                },
                {
                  case: {
                    $eq: ["$offerDetails.duration.unit", "hours"],
                  },
                  then: {
                    $multiply: ["$offerDetails.duration.value", 60 * 60 * 1000],
                  },
                },
                {
                  case: {
                    $eq: ["$offerDetails.duration.unit", "minutes"],
                  },
                  then: {
                    $multiply: ["$offerDetails.duration.value", 60 * 1000],
                  },
                },
              ],
              default: 0, // Default value if "unit" doesn't match any of the cases
            },
          },
        },
      },
      {
        $addFields: {
          startDate: {
            $cond: {
              if: { $ne: ["$offerDetails.startDate", null] },
              then: "$offerDetails.startDate", // Use offerDetails.startDate if available
              else: new Date(), // Use the current date as a default if offerDetails.startDate is null
            },
          },
        },
      },

      {
        $addFields: {
          endDate: {
            $cond: {
              if: { $ne: ["$offerDetails", null] }, // Check if offerDetails is not null
              then: { $add: ["$startDate", "$durationInSeconds"] }, // Calculate endDate
              else: null, // Set endDate to null if offerDetails is null
            },
          },
        },
      },
      {
        $addFields: {
          discountPrice: {
            $cond: {
              if: {
                $and: [
                  { $ne: ["$offerDetails", null] }, // Check if offerDetails is not null
                  { $gte: ["$endDate", new Date()] }, // Check if endDate is not over the current date
                ],
              },
              then: "$offerDetails.discountPercentage", // Use discountPercentage if conditions are met
              else: null, // Set discountPrice to null if conditions are not met
            },
          },
        },
      },

      {
        $addFields: {
          activitydiscountedPrice: {
            $cond: {
              if: { $eq: ["$discountPrice", null] }, // Check if discountPrice is null
              then: null, // Set activitydiscountedPrice to null if discountPrice is null
              else: {
                $multiply: [
                  "$activityAdultPrice",
                  { $divide: ["$discountPrice", 100] },
                ],
              },
            },
          },
        },
      },

      // discount price and adult price in main list function End //

      // cat details
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          pipeline: [
            {
              // other activity
              $lookup: {
                from: "activitydetails",
                localField: "_id",
                foreignField: "categoryId",
                pipeline: [
                  {
                    $match: {
                      _id: { $ne: new mongoose.Types.ObjectId(req.params.id) },
                      isDeleted: false,
                      saveAsDraft: false,
                      isApproval: true,
                      status: true,
                    },
                  },

                  {
                    $lookup: {
                      from: "specialoffers",
                      localField: "specialOfferId",
                      foreignField: "_id",
                      as: "offerDetails",
                    },
                  },
                  {
                    $unwind: {
                      path: "$offerDetails",
                      preserveNullAndEmptyArrays: true,
                    },
                  },

                  {
                    $addFields: {
                      activityActualAdultPrice: "$participentType",
                    },
                  },
                  {
                    $addFields: {
                      adultPrice: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$activityActualAdultPrice",
                              as: "priceItem",
                              cond: { $eq: ["$$priceItem.pertype", "Adult"] },
                            },
                          },
                          0,
                        ],
                      },
                    },
                  },
                  {
                    $addFields: {
                      activityAdultPrice: "$adultPrice.price",
                    },
                  },

                  {
                    $addFields: {
                      duration: {
                        $ifNull: ["$offerDetails.duration", 0],
                      },
                    },
                  },

                  {
                    $addFields: {
                      durationInSeconds: {
                        $switch: {
                          branches: [
                            {
                              case: {
                                $eq: ["$offerDetails.duration.unit", "days"],
                              },
                              then: {
                                $multiply: [
                                  "$offerDetails.duration.value",
                                  24 * 60 * 60 * 1000,
                                ],
                              },
                            },
                            {
                              case: {
                                $eq: ["$offerDetails.duration.unit", "hours"],
                              },
                              then: {
                                $multiply: [
                                  "$offerDetails.duration.value",
                                  60 * 60 * 1000,
                                ],
                              },
                            },
                            {
                              case: {
                                $eq: ["$offerDetails.duration.unit", "minutes"],
                              },
                              then: {
                                $multiply: [
                                  "$offerDetails.duration.value",
                                  60 * 1000,
                                ],
                              },
                            },
                          ],
                          default: 0, // Default value if "unit" doesn't match any of the cases
                        },
                      },
                    },
                  },
                  {
                    $addFields: {
                      startDate: {
                        $cond: {
                          if: { $ne: ["$offerDetails.startDate", null] },
                          then: "$offerDetails.startDate", // Use offerDetails.startDate if available
                          else: new Date(), // Use the current date as a default if offerDetails.startDate is null
                        },
                      },
                    },
                  },

                  {
                    $addFields: {
                      endDate: {
                        $cond: {
                          if: { $ne: ["$offerDetails", null] }, // Check if offerDetails is not null
                          then: { $add: ["$startDate", "$durationInSeconds"] }, // Calculate endDate
                          else: null, // Set endDate to null if offerDetails is null
                        },
                      },
                    },
                  },
                  {
                    $addFields: {
                      discountPrice: {
                        $cond: {
                          if: {
                            $and: [
                              { $ne: ["$offerDetails", null] }, // Check if offerDetails is not null
                              { $gte: ["$endDate", new Date()] }, // Check if endDate is not over the current date
                            ],
                          },
                          then: "$offerDetails.discountPercentage", // Use discountPercentage if conditions are met
                          else: null, // Set discountPrice to null if conditions are not met
                        },
                      },
                    },
                  },

                  {
                    $addFields: {
                      activitydiscountedPrice: {
                        $cond: {
                          if: { $eq: ["$discountPrice", null] }, // Check if discountPrice is null
                          then: null, // Set activitydiscountedPrice to null if discountPrice is null
                          else: {
                            $multiply: [
                              "$activityAdultPrice",
                              { $divide: ["$discountPrice", 100] },
                            ],
                          },
                        },
                      },
                    },
                  },
                  {
                    $lookup: {
                      from: "reviewratings",
                      localField: "_id",
                      foreignField: "activityDetailsId",

                      as: "otherReview",
                    },
                  },
                  {
                    $addFields: {
                      reviewRating: {
                        $avg: "$otherReview.avgRating",
                      },
                    },
                  },
                  {
                    $addFields: {
                      totalReview: { $size: "$otherReview" },
                    },
                  },

                  {
                    $project: {
                      activityAdultPrice: 1,
                      startDate: 1,
                      endDate: 1,
                      duration: 1,
                      discountPrice: 1,
                      activitydiscountedPrice: 1,
                      slug: 1,
                      activityTitle: 1,
                      image: 1,
                      currency: 1,
                      activityActualPrice: 1,
                      reviewRating: 1,
                      totalReview: 1,
                    },
                  },
                ],

                as: "othersActivity",
              },
            },
            {
              $project: {
                categoryName: 1,
                othersActivity: 1,
                // reviewRating: "$othersActivity.reviewRating"
              },
            },
          ],
          as: "catDetails",
        },
      },
      {
        $unwind: { path: "$catDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "languages",
          localField: "languageId",
          foreignField: "_id",
          as: "langDetails",
        },
      },
      {
        $unwind: { path: "$langDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "wishlists",
          localField: "_id",
          foreignField: "activityId",
          pipeline: [
            {
              $match: {
                userId: req.user._id,
              },
            },
            {
              $project: {
                isDeleted: 0,
                __v: 0,
                createdOn: 0,
                updatedOn: 0,
              },
            },
          ],
          as: "wishlist",
        },
      },
      {
        $addFields: {
          Iswishlist: {
            $cond: {
              if: { $gt: [{ $size: "$wishlist" }, 0] },
              then: true,
              else: false,
            },
          },
        },
      },

      {
        $lookup: {
          from: "activitytypes",
          localField: "activityTypesId",
          foreignField: "_id",
          as: "activitytypeDetails",
        },
      },
      {
        $unwind: {
          path: "$activitytypeDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "sections",
          localField: "sectionId",
          foreignField: "_id",
          as: "sectionsDetails",
        },
      },
      {
        $unwind: { path: "$sectionsDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "activitysites",
          localField: "activitySiteId",
          foreignField: "_id",
          as: "activitysiteDetails",
        },
      },
      {
        $unwind: {
          path: "$activitysiteDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "cities",
          localField: "cityId",
          foreignField: "_id",
          as: "citiDetails",
        },
      },
      {
        $unwind: { path: "$citiDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "countries",
          localField: "countryId",
          foreignField: "_id",
          as: "country",
        },
      },
      {
        $unwind: { path: "$country", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "reviewratings",
          localField: "_id",
          foreignField: "activityDetailsId",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "user",
              },
            },
            {
              $addFields: {
                userName: { $arrayElemAt: ["$user", 0] },
              },
            },
            {
              $addFields: {
                firstName: "$userName.firstName",
              },
            },
            {
              $project: {
                __v: 0,
                isDeleted: 0,
                userName: 0,
                user: 0,
                // createdOn: 0,
                updatedOn: 0,
              },
            },

            {
              $sort: {
                createdOn: -1,
              },
            },
            {
              $skip: (page - 1) * pageSize,
            },
            {
              $limit: pageSize,
            },
          ],
          as: "review",
        },
      },

      {
        $lookup: {
          from: "merchants",
          localField: "addedByid",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                // _id: 0,

                fullname: { $concat: ["$firstName", " ", "$lastName"] },
                companyName: 1,
              },
            },
          ],
          as: "merchant",
        },
      },
      { $unwind: { path: "$merchant", preserveNullAndEmptyArrays: true } },

      {
        $addFields: {
          addedBY: {
            $cond: {
              if: { $eq: ["$addedBy", "admin"] },
              then: "Things to dooo",
              else: "$merchant.fullname",
            },
          },
        },
      },
      {
        $addFields: {
          avgRating: { $sum: { $avg: "$review.avgRating" } },
          valueForMoney: { $sum: { $avg: "$review.valueForMoney" } },
          guide: { $sum: { $avg: "$review.guide" } },
          service: { $sum: { $avg: "$review.service" } },
          organization: { $sum: { $avg: "$review.organization" } },
          latestReviewer: "$review",
        },
      },

      {
        $addFields: {
          // specialOfferName: "$offerDetails.specialOfferName",
          // discountPercentage: "$offerDetails.discountPercentage",
          cityName: "$citiDetails.cityName",
          countryName: "$country.name",
          activitySiteName: "$activitysiteDetails.siteName",
          sectionTitle: "$sectionsDetails.sectionTitle",
          activitytypeName: "$activitytypeDetails.name",
          language: "$langDetails.name",
          marchandID: "$merchant._id",
          marchandCompanyName: "$merchant.companyName",
          // catDetails: "$catDetails.categoryName",
        },
      },

      // {
      //   $addFields: {
      //     // specialOfferName: "$offerDetails.specialOfferName",
      //     discountPercentage: "$offerDetails.discountPercentage",
      //     cityName: "$citiDetails.cityName",
      //     countryName: "$country.name",
      //     activitySiteName: "$activitysiteDetails.siteName",
      //     sectionTitle: "$sectionsDetails.sectionTitle",
      //     activitytypeName: "$activitytypeDetails.name",
      //     language: "$langDetails.name",
      //     marchandID: "$merchant._id",
      //     marchandCompanyName: {
      //       $cond: {
      //         if: { $eq: ["$addedBy", "admin"] },
      //         then: "Things to dooo",
      //         else: "$merchant.companyName",
      //       }
      //     },
      //     // catDetails: "$catDetails.categoryName",
      //   },
      // },

      {
        $project: {
          // offerDetails: 0,
          activityActualAdultPrice: 0,
          adultPrice: 0,
          durationInSeconds: 0,
          citiDetails: 0,
          langDetails: 0,
          merDetails: 0,
          addedByid: 0,
          country: 0,
          activitytypeDetails: 0,
          sectionsDetails: 0,
          activitysiteDetails: 0,
          citiDetails: 0,
          review: 0,
          userName: 0,
          merchant: 0,
          // wishlist: 0,
          // cityId:0,
          // activitySiteId:0,
          // categoryId:0,
          // activityTypesId:0,
          // countryId:0,
          // languageId:0,
          addedBy: 0,
          isDeleted: 0,
          __v: 0,
          createdOn: 0,
          updatedOn: 0,
        },
      },
    ])
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "View single Tours",
        data: data,
      });
    })
    .catch((error) => {
      console.log(error);
      const errors = DBerror(error);
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Invalid id. Server error.",
        error: errors,
      });
    });
};

const cityAgainstActivity1 = async (req, res) => {
  await activityDetailsModel
    .aggregate([
      {
        $match: {
          cityId: new mongoose.Types.ObjectId(req.params.cityId),
          isDeleted: false,
          status: true,
        },
      },
      {
        $lookup: {
          from: "specialoffers",
          localField: "specialOfferId",
          foreignField: "_id",
          as: "offerDetails",
        },
      },
      {
        $unwind: { path: "$offerDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "catDetails",
        },
      },
      {
        $unwind: { path: "$catDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "languages",
          localField: "languageId",
          foreignField: "_id",
          as: "langDetails",
        },
      },
      {
        $unwind: { path: "$langDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "activitytypes",
          localField: "activityTypesId",
          foreignField: "_id",
          as: "activitytypeDetails",
        },
      },
      {
        $unwind: {
          path: "$activitytypeDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "sections",
          localField: "sectionId",
          foreignField: "_id",
          as: "sectionsDetails",
        },
      },
      {
        $unwind: { path: "$sectionsDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "activitysites",
          localField: "activitySiteId",
          foreignField: "_id",
          as: "activitysiteDetails",
        },
      },
      {
        $unwind: {
          path: "$activitysiteDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "cities",
          localField: "cityId",
          foreignField: "_id",
          as: "citiDetails",
        },
      },
      {
        $unwind: { path: "$citiDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "countries",
          localField: "countryId",
          foreignField: "_id",
          as: "country",
        },
      },
      {
        $unwind: { path: "$country", preserveNullAndEmptyArrays: true },
      },
      {
        $addFields: {
          specialOfferName: "$offerDetails.specialOfferName",
          discountPercentage: "$offerDetails.discountPercentage",
          cityName: "$citiDetails.cityName",
          countryName: "$country.name",
          activitySiteName: "$activitysiteDetails.siteName",
          sectionTitle: "$sectionsDetails.sectionTitle",
          activitytypeName: "$activitytypeDetails.name",
          language: "$langDetails.name",
          catDetails: "$catDetails.categoryName",
        },
      },
      {
        $project: {
          citiDetails: 0,
          langDetails: 0,
          merDetails: 0,
          addedByid: 0,
          country: 0,
          activitytypeDetails: 0,
          sectionsDetails: 0,
          activitysiteDetails: 0,
          citiDetails: 0,
          offerDetails: 0,
          // cityId:0,
          // activitySiteId:0,
          // categoryId:0,
          // activityTypesId:0,
          // countryId:0,
          // languageId:0,
          addedBy: 0,
          isDeleted: 0,
          __v: 0,
          createdOn: 0,
          updatedOn: 0,
        },
      },
    ])
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "View cityAgainstActivity Tours",
        data: data,
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

// const sitesAgainstActivity = async (req, res) => {
//   await activityDetailsModel
//     .aggregate([
//       {
//         $match: {
//           activitySiteId: new mongoose.Types.ObjectId(
//             req.params.activitySiteId
//           ),
//           isDeleted: false,
//           status: true,
//         },
//       },
//       {
//         $lookup: {
//           from: "specialoffers",
//           localField: "specialOfferId",
//           foreignField: "_id",
//           as: "offerDetails",
//         },
//       },
//       {
//         $unwind: { path: "$offerDetails", preserveNullAndEmptyArrays: true },
//       },
//       {
//         $lookup: {
//           from: "categories",
//           localField: "categoryId",
//           foreignField: "_id",
//           as: "catDetails",
//         },
//       },
//       {
//         $unwind: { path: "$catDetails", preserveNullAndEmptyArrays: true },
//       },
//       {
//         $lookup: {
//           from: "languages",
//           localField: "languageId",
//           foreignField: "_id",
//           as: "langDetails",
//         },
//       },
//       {
//         $unwind: { path: "$langDetails", preserveNullAndEmptyArrays: true },
//       },
//       {
//         $lookup: {
//           from: "merchants",
//           localField: "assignById",
//           foreignField: "_id",
//           as: "merDetails",
//         },
//       },
//       {
//         $unwind: { path: "$merDetails", preserveNullAndEmptyArrays: true },
//       },
//       {
//         $lookup: {
//           from: "activitytypes",
//           localField: "activityTypeId",
//           foreignField: "_id",
//           as: "activitytypeDetails",
//         },
//       },
//       {
//         $unwind: {
//           path: "$activitytypeDetails",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       {
//         $lookup: {
//           from: "sections",
//           localField: "sectionId",
//           foreignField: "_id",
//           as: "sectionsDetails",
//         },
//       },
//       {
//         $unwind: { path: "$sectionsDetails", preserveNullAndEmptyArrays: true },
//       },
//       {
//         $lookup: {
//           from: "activitysites",
//           localField: "activitySiteId",
//           foreignField: "_id",
//           as: "activitysiteDetails",
//         },
//       },
//       {
//         $unwind: {
//           path: "$activitysiteDetails",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       {
//         $lookup: {
//           from: "cities",
//           localField: "cityId",
//           foreignField: "_id",
//           as: "citiDetails",
//         },
//       },
//       {
//         $unwind: { path: "$citiDetails", preserveNullAndEmptyArrays: true },
//       },
//       {
//         $addFields: {
//           specialOfferName: "$offerDetails.specialOfferName",
//           discountPercentage: "$offerDetails.discountPercentage",
//           marchentFirstName: "$merDetails.firstName",
//           marchentLastName: "$merDetails.lastName",
//           cityName: "$citiDetails.cityName",
//           activitySiteName: "$activitysiteDetails.siteName",
//           sectionTitle: "$sectionsDetails.sectionTitle",
//           activitytypeName: "$activitytypeDetails.name",
//           language: "$langDetails.name",
//           catDetails: "$catDetails.categoryName",
//         },
//       },
//       {
//         $project: {
//           citiDetails: 0,
//           langDetails: 0,
//           merDetails: 0,
//           activitytypeDetails: 0,
//           sectionsDetails: 0,
//           activitysiteDetails: 0,
//           citiDetails: 0,
//           offerDetails: 0,
//         },
//       },
//       {
//         $lookup: {
//           from: "countries",
//           localField: "countryId",
//           foreignField: "_id",
//           as: "country",
//         },
//       },
//       {
//         $unwind: { path: "$country", preserveNullAndEmptyArrays: true },
//       },
//       {
//         $addFields: {
//           specialOfferName: "$offerDetails.specialOfferName",
//           discountPercentage: "$offerDetails.discountPercentage",
//           marchentFirstName: "$merDetails.firstName",
//           marchentLastName: "$merDetails.lastName",
//           cityName: "$citiDetails.cityName",
//           countryName: "$country.name",
//           activitySiteName: "$activitysiteDetails.siteName",
//           sectionTitle: "$sectionsDetails.sectionTitle",
//           activitytypeName: "$activitytypeDetails.name",
//           language: "$langDetails.name",
//           catDetails: "$catDetails.categoryName",
//         },
//       },
//       {
//         $project: {
//           citiDetails: 0,
//           langDetails: 0,
//           merDetails: 0,
//           addedByid: 0,
//           country: 0,
//           activitytypeDetails: 0,
//           sectionsDetails: 0,
//           activitysiteDetails: 0,
//           citiDetails: 0,
//           offerDetails: 0,
//           cityId: 0,
//           activitySiteId: 0,
//           categoryId: 0,
//           activityTypesId: 0,
//           countryId: 0,
//           languageId: 0,
//           addedBy: 0,
//           isDeleted: 0,
//           __v: 0,
//           createdOn: 0,
//           updatedOn: 0,
//         },
//       },
//     ])
//     .then((data) => {
//       return res.status(ResponseCode.errorCode.success).json({
//         status: true,
//         message: "View sitesAgainstActivity Tours",
//         data: data,
//       });
//     })
//     .catch((error) => {
//       const errors = DBerror(error);
//       return res.status(ResponseCode.errorCode.serverError).json({
//         status: false,
//         message: "Invalid id. Server error.",
//         error: errors,
//       });
//     });
// };

const cityAgainstActivityprev = async (req, res) => {
  await city
    .aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.params.cityId),
          isDeleted: false,
          status: true,
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
              },
            },
            {
              $lookup: {
                from: "categories",
                localField: "categoryId",
                foreignField: "_id",
                as: "catDetails",
              },
            },
            {
              $unwind: {
                path: "$catDetails",
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
                      activityDetailsId: 1,
                      avgRating: 1,
                    },
                  },
                ],
                as: "otherReview",
              },
            },
            {
              $addFields: {
                reviewRating: { $sum: { $avg: "$otherReview.avgRating" } },
              },
            },
            {
              $addFields: {
                totalReview: { $size: "$otherReview" },
              },
            },
            {
              $sort: {
                topPriority: 1,
              },
            },
            {
              $limit: 8,
            },

            {
              $project: {
                image: 1,
                activityTitle: 1,
                description: 1,
                activityActualPrice: 1,
                tourDuration: 1,
                catDetails: "$catDetails.categoryName",
                reviewRating: 1,
                totalReview: 1,
                currency: 1,
                slug: 1,
              },
            },
          ],
          as: "Top_activity",
        },
      },
      // {
      //   $lookup: {
      //     from: "activitydetails",
      //     localField: "_id",
      //     foreignField: "cityId",
      //     pipeline: [
      //       {
      //         $match: {
      //           isDeleted: false,
      //           status: true,
      //         },
      //       },
      //       {
      //         $lookup: {
      //           from: "activitysites",
      //           localField: "activitySiteId",
      //           foreignField: "_id",
      //           pipeline: [
      //             {
      //               $match: {
      //                 isDeleted: false,
      //               },
      //             },
      //             {
      //               $lookup: {
      //                 from: "activitydetails",
      //                 localField: "_id",
      //                 foreignField: "activitySiteId",
      //                 as: "totalactivity",
      //               },
      //             },
      //             {
      //               $addFields: {
      //                 total_activity: { $size: "$totalactivity" },
      //               },
      //             },
      //             {$sort:{
      //               topPriority:1
      //             }},
      //             {
      //               $limit:8
      //             },

      //             {
      //               $project: {
      //                 siteName: 1,
      //                 image: 1,
      //                 total_activity: 1,
      //               },
      //             },
      //           ],
      //           as: "Top_sights",
      //         },
      //       },
      //       {
      //         $project:{
      //           _id:0,
      //           Top_sights:1
      //         }
      //       }

      //     ],
      //     as: "Top_sites",
      //   },
      // },
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
              },
            },
            {
              $lookup: {
                from: "categories",
                localField: "categoryId",
                foreignField: "_id",
                as: "catDetails",
              },
            },
            {
              $unwind: {
                path: "$catDetails",
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
                      activityDetailsId: 1,
                      avgRating: 1,
                    },
                  },
                ],
                as: "otherReview",
              },
            },
            {
              $addFields: {
                reviewRating: { $sum: { $avg: "$otherReview.avgRating" } },
              },
            },
            {
              $addFields: {
                totalReview: { $size: "$otherReview" },
              },
            },

            {
              $project: {
                image: 1,
                activityTitle: 1,
                description: 1,
                activityActualPrice: 1,
                tourDuration: 1,
                catDetails: "$catDetails.categoryName",
                reviewRating: 1,
                totalReview: 1,
                currency: 1,
                slug: 1,
              },
            },
          ],
          as: "All_activity",
        },
      },
      // {
      //   $lookup: {
      //     from: "activitysites",
      //     localField: "_id",
      //     foreignField: "cityId",
      //     pipeline: [
      //       {
      //         $match: {
      //           isDeleted: false,
      //         },
      //       },
      //       {
      //         $lookup: {
      //           from: "activitydetails",
      //           localField: "_id",
      //           foreignField: "activitySiteId",
      //           as: "totalactivity",
      //         },
      //       },
      //       {
      //         $addFields: {
      //           total_activity: { $size: "$totalactivity" },
      //         },
      //       },

      //       {
      //         $project: {
      //           siteName: 1,
      //           image: 1,
      //           total_activity: 1,
      //         },
      //       },
      //     ],
      //     as: "Top_sights",
      //   },
      // },
      {
        $project: {
          status: 0,
          isDeleted: 0,
          createdOn: 0,
          updatedOn: 0,
          __v: 0,
          countryId: 0,
        },
      },
    ])
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "View cityAgainstActivity Tours",
        data: data,
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

const cityAgainstActivity = async (req, res) => {
  if (req.body.date != "" && req.body.date != null) {
    await city
      .aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(req.params.cityId),
            isDeleted: false,
            status: true,
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
                  tourModuleId: new mongoose.Types.ObjectId(req.params.tourid),
                  status: true,
                  startDate: {
                    // $gte: moment.utc(req.body.date).startOf("date").toDate(),
                    $lte: moment.utc(req.body.date).startOf("date").toDate(),
                  },
                  endDate: {
                    $gte: moment.utc(req.body.date).startOf("date").toDate(),
                    // $lte: moment.utc(req.body.date).startOf("date").toDate(),
                  },
                },
              },
              {
                $lookup: {
                  from: "categories",
                  localField: "categoryId",
                  foreignField: "_id",
                  as: "catDetails",
                },
              },
              {
                $unwind: {
                  path: "$catDetails",
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
                        activityDetailsId: 1,
                        avgRating: 1,
                      },
                    },
                  ],
                  as: "otherReview",
                },
              },
              {
                $addFields: {
                  reviewRating: { $sum: { $avg: "$otherReview.avgRating" } },
                },
              },
              {
                $addFields: {
                  totalReview: { $size: "$otherReview" },
                },
              },
              {
                $lookup: {
                  from: "specialoffers",
                  localField: "specialOfferId",
                  foreignField: "_id",
                  pipeline: [
                    {
                      $match: {
                        endDate: {
                          $gte: moment.utc(new Date()).startOf("date").toDate(),
                        },
                      },
                    },
                  ],
                  as: "offerDetails",
                },
              },
              {
                $unwind: {
                  path: "$offerDetails",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $addFields: {
                  activityActualAdultPrice: "$participentType",
                },
              },
              {
                $addFields: {
                  adultPrice: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$activityActualAdultPrice",
                          as: "priceItem",
                          cond: { $eq: ["$$priceItem.pertype", "Adult"] },
                        },
                      },
                      0,
                    ],
                  },
                },
              },
              {
                $addFields: {
                  activityAdultPrice: "$adultPrice.price",
                },
              },
              {
                $addFields: {
                  discountPrice: "$offerDetails.discountPercentage",
                },
              },
              {
                $addFields: {
                  activitydiscountedPrice: {
                    $multiply: [
                      "$activityAdultPrice",
                      { $divide: ["$discountPrice", 100] },
                    ],
                  },
                },
              },
              {
                $addFields: {
                  duration: {
                    $ifNull: ["$offerDetails.duration", 0],
                  },
                },
              },

              {
                $addFields: {
                  durationInSeconds: {
                    $switch: {
                      branches: [
                        {
                          case: {
                            $eq: ["$offerDetails.duration.unit", "days"],
                          },
                          then: {
                            $multiply: [
                              "$offerDetails.duration.value",
                              24 * 60 * 60 * 1000,
                            ],
                          },
                        },
                        {
                          case: {
                            $eq: ["$offerDetails.duration.unit", "hours"],
                          },
                          then: {
                            $multiply: [
                              "$offerDetails.duration.value",
                              60 * 60 * 1000,
                            ],
                          },
                        },
                        {
                          case: {
                            $eq: ["$offerDetails.duration.unit", "minutes"],
                          },
                          then: {
                            $multiply: [
                              "$offerDetails.duration.value",
                              60 * 1000,
                            ],
                          },
                        },
                      ],
                      default: 0, // Default value if "unit" doesn't match any of the cases
                    },
                  },
                },
              },
              {
                $addFields: {
                  startDate: {
                    $cond: {
                      if: { $ne: ["$offerDetails.startDate", null] }, // Check if offerDetails.startDate is not null
                      then: "$offerDetails.startDate", // Use offerDetails.startDate if available
                      else: new Date(), // Use the current date as a default if offerDetails.startDate is null
                    },
                  },
                },
              },

              {
                $addFields: {
                  endDate: {
                    $cond: {
                      if: { $ne: ["$offerDetails", null] }, // Check if offerDetails is not null
                      then: { $add: ["$startDate", "$durationInSeconds"] }, // Calculate endDate
                      else: null, // Set endDate to null if offerDetails is null
                    },
                  },
                },
              },
              {
                $addFields: {
                  discountPrice: {
                    $cond: {
                      if: {
                        $and: [
                          { $ne: ["$offerDetails", null] }, // Check if offerDetails is not null
                          { $gte: ["$endDate", new Date()] }, // Check if endDate is not over the current date
                        ],
                      },
                      then: "$offerDetails.discountPercentage", // Use discountPercentage if conditions are met
                      else: null, // Set discountPrice to null if conditions are not met
                    },
                  },
                },
              },
              {
                $addFields: {
                  activitydiscountedPrice: {
                    $cond: {
                      if: { $eq: ["$discountPrice", null] }, // Check if discountPrice is null
                      then: null, // Set activitydiscountedPrice to null if discountPrice is null
                      else: {
                        $multiply: [
                          "$activityAdultPrice",
                          { $divide: ["$discountPrice", 100] },
                        ],
                      },
                    },
                  },
                },
              },
              {
                $sort: {
                  topPriority: 1,
                },
              },
              {
                $limit: 8,
              },

              {
                $project: {
                  image: 1,
                  activityTitle: 1,
                  description: 1,
                  activityActualPrice: 1,
                  tourDuration: 1,
                  catDetails: "$catDetails.categoryName",
                  reviewRating: 1,
                  totalReview: 1,
                  currency: 1,  
                  slug: 1,
                  // activityActualAdultPrice:1,
                  offerDetails:1,
                  discountPrice: 1,
                  activityAdultPrice: 1,
                  activitydiscountedPrice: 1,
                },
              },
            ],
            as: "Top_activity",
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
                  tourModuleId: new mongoose.Types.ObjectId(req.params.tourid),
                  status: true,
                  startDate: {
                    // $gte: moment.utc(req.body.date).startOf("date").toDate(),
                    $lte: moment.utc(req.body.date).startOf("date").toDate(),
                  },
                  endDate: {
                    $gte: moment.utc(req.body.date).startOf("date").toDate(),
                    // $lte: moment.utc(req.body.date).startOf("date").toDate(),
                  },
                },
              },
              {
                $lookup: {
                  from: "categories",
                  localField: "categoryId",
                  foreignField: "_id",
                  as: "catDetails",
                },
              },
              {
                $unwind: {
                  path: "$catDetails",
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
                        activityDetailsId: 1,
                        avgRating: 1,
                      },
                    },
                  ],
                  as: "otherReview",
                },
              },
              {
                $addFields: {
                  reviewRating: { $sum: { $avg: "$otherReview.avgRating" } },
                },
              },
              {
                $addFields: {
                  totalReview: { $size: "$otherReview" },
                },
              },

              {
                $lookup: {
                  from: "specialoffers",
                  localField: "specialOfferId",
                  foreignField: "_id",
                  pipeline: [
                    {
                      $match: {
                        endDate: {
                          $gte: moment.utc(new Date()).startOf("date").toDate(),
                        },
                      },
                    },
                  ],
                  as: "offerDetails",
                },
              },
              {
                $unwind: {
                  path: "$offerDetails",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $addFields: {
                  activityActualAdultPrice: "$participentType",
                },
              },
              {
                $addFields: {
                  adultPrice: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$activityActualAdultPrice",
                          as: "priceItem",
                          cond: { $eq: ["$$priceItem.pertype", "Adult"] },
                        },
                      },
                      0,
                    ],
                  },
                },
              },
              {
                $addFields: {
                  activityAdultPrice: "$adultPrice.price",
                },
              },
              {
                $addFields: {
                  discountPrice: "$offerDetails.discountPercentage",
                },
              },
              {
                $addFields: {
                  activitydiscountedPrice: {
                    $multiply: [
                      "$activityAdultPrice",
                      { $divide: ["$discountPrice", 100] },
                    ],
                  },
                },
              },
              {
                $addFields: {
                  duration: {
                    $ifNull: ["$offerDetails.duration", 0],
                  },
                },
              },
              {
                $addFields: {
                  durationInSeconds: {
                    $switch: {
                      branches: [
                        {
                          case: {
                            $eq: ["$offerDetails.duration.unit", "days"],
                          },
                          then: {
                            $multiply: [
                              "$offerDetails.duration.value",
                              24 * 60 * 60 * 1000,
                            ],
                          },
                        },
                        {
                          case: {
                            $eq: ["$offerDetails.duration.unit", "hours"],
                          },
                          then: {
                            $multiply: [
                              "$offerDetails.duration.value",
                              60 * 60 * 1000,
                            ],
                          },
                        },
                        {
                          case: {
                            $eq: ["$offerDetails.duration.unit", "minutes"],
                          },
                          then: {
                            $multiply: [
                              "$offerDetails.duration.value",
                              60 * 1000,
                            ],
                          },
                        },
                      ],
                      default: 0, // Default value if "unit" doesn't match any of the cases
                    },
                  },
                },
              },
              {
                $addFields: {
                  startDate: {
                    $cond: {
                      if: { $ne: ["$offerDetails.startDate", null] }, // Check if offerDetails.startDate is not null
                      then: "$offerDetails.startDate", // Use offerDetails.startDate if available
                      else: new Date(), // Use the current date as a default if offerDetails.startDate is null
                    },
                  },
                },
              },
              {
                $addFields: {
                  endDate: {
                    $cond: {
                      if: { $ne: ["$offerDetails", null] }, // Check if offerDetails is not null
                      then: { $add: ["$startDate", "$durationInSeconds"] }, // Calculate endDate
                      else: null, // Set endDate to null if offerDetails is null
                    },
                  },
                },
              },
              {
                $addFields: {
                  discountPrice: {
                    $cond: {
                      if: {
                        $and: [
                          { $ne: ["$offerDetails", null] }, // Check if offerDetails is not null
                          { $gte: ["$endDate", new Date()] }, // Check if endDate is not over the current date
                        ],
                      },
                      then: "$offerDetails.discountPercentage", // Use discountPercentage if conditions are met
                      else: null, // Set discountPrice to null if conditions are not met
                    },
                  },
                },
              },
              {
                $addFields: {
                  activitydiscountedPrice: {
                    $cond: {
                      if: { $eq: ["$discountPrice", null] }, // Check if discountPrice is null
                      then: null, // Set activitydiscountedPrice to null if discountPrice is null
                      else: {
                        $multiply: [
                          "$activityAdultPrice",
                          { $divide: ["$discountPrice", 100] },
                        ],
                      },
                    },
                  },
                },
              },
              {
                $project: {
                  image: 1,
                  activityTitle: 1,
                  description: 1,
                  activityActualPrice: 1,
                  tourDuration: 1,
                  catDetails: "$catDetails.categoryName",
                  reviewRating: 1,
                  totalReview: 1,
                  currency: 1,
                  slug: 1,
                  offerDetails: 1,
                  activityAdultPrice: 1,
                  discountPrice: 1,
                  activitydiscountedPrice: 1,
                },
              },
            ],
            as: "All_activity",
          },
        },

        {
          $project: {
            status: 0,
            isDeleted: 0,
            createdOn: 0,
            updatedOn: 0,
            __v: 0,
            countryId: 0,
          },
        },
      ])
      .then((data) => {
        return res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "View cityAgainstActivity Tours",
          data: data,
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
  } else {
    console.log("req.params.activityType", req.params.activityType);
    await city
      .aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(req.params.cityId),
            isDeleted: false,
            status: true,
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
                  tourModuleId: new mongoose.Types.ObjectId(req.params.tourid),
                  activityTypesId: new mongoose.Types.ObjectId(
                    req.params.activityType
                  ),
                  status: true,
                  // startDate: {
                  //   $lte: moment.utc(req.body.date).startOf("date").toDate(),
                  // },
                  // endDate: {
                  //   $gte: moment.utc(req.body.date).startOf("date").toDate(),
                  // },
                },
              },
              {
                $lookup: {
                  from: "categories",
                  localField: "categoryId",
                  foreignField: "_id",
                  as: "catDetails",
                },
              },
              {
                $unwind: {
                  path: "$catDetails",
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
                        activityDetailsId: 1,
                        avgRating: 1,
                      },
                    },
                  ],
                  as: "otherReview",
                },
              },
              {
                $addFields: {
                  reviewRating: { $sum: { $avg: "$otherReview.avgRating" } },
                },
              },
              {
                $addFields: {
                  totalReview: { $size: "$otherReview" },
                },
              },
              {
                $lookup: {
                  from: "specialoffers",
                  localField: "specialOfferId",
                  foreignField: "_id",
                  pipeline: [
                    {
                      $match: {
                        endDate: {
                          $gte: moment.utc(new Date()).startOf("date").toDate(),
                        },
                      },
                    },
                  ],
                  as: "offerDetails",
                },
              },
              {
                $unwind: {
                  path: "$offerDetails",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $addFields: {
                  activityActualAdultPrice: "$participentType",
                },
              },
              {
                $addFields: {
                  adultPrice: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$activityActualAdultPrice",
                          as: "priceItem",
                          cond: { $eq: ["$$priceItem.pertype", "Adult"] },
                        },
                      },
                      0,
                    ],
                  },
                },
              },
              {
                $addFields: {
                  activityAdultPrice: "$adultPrice.price",
                },
              },
              {
                $addFields: {
                  discountPrice: "$offerDetails.discountPercentage",
                },
              },
              {
                $addFields: {
                  activitydiscountedPrice: {
                    $multiply: [
                      "$activityAdultPrice",
                      { $divide: ["$discountPrice", 100] },
                    ],
                  },
                },
              },
              {
                $addFields: {
                  duration: {
                    $ifNull: ["$offerDetails.duration", 0],
                  },
                },
              },
              {
                $addFields: {
                  durationInSeconds: {
                    $switch: {
                      branches: [
                        {
                          case: {
                            $eq: ["$offerDetails.duration.unit", "days"],
                          },
                          then: {
                            $multiply: [
                              "$offerDetails.duration.value",
                              24 * 60 * 60 * 1000,
                            ],
                          },
                        },
                        {
                          case: {
                            $eq: ["$offerDetails.duration.unit", "hours"],
                          },
                          then: {
                            $multiply: [
                              "$offerDetails.duration.value",
                              60 * 60 * 1000,
                            ],
                          },
                        },
                        {
                          case: {
                            $eq: ["$offerDetails.duration.unit", "minutes"],
                          },
                          then: {
                            $multiply: [
                              "$offerDetails.duration.value",
                              60 * 1000,
                            ],
                          },
                        },
                      ],
                      default: 0, // Default value if "unit" doesn't match any of the cases
                    },
                  },
                },
              },
              {
                $addFields: {
                  startDate: {
                    $cond: {
                      if: { $ne: ["$offerDetails.startDate", null] }, // Check if offerDetails.startDate is not null
                      then: "$offerDetails.startDate", // Use offerDetails.startDate if available
                      else: new Date(), // Use the current date as a default if offerDetails.startDate is null
                    },
                  },
                },
              },

              {
                $addFields: {
                  endDate: {
                    $cond: {
                      if: { $ne: ["$offerDetails", null] }, // Check if offerDetails is not null
                      then: { $add: ["$startDate", "$durationInSeconds"] }, // Calculate endDate
                      else: null, // Set endDate to null if offerDetails is null
                    },
                  },
                },
              },
              {
                $addFields: {
                  discountPrice: {
                    $cond: {
                      if: {
                        $and: [
                          { $ne: ["$offerDetails", null] }, // Check if offerDetails is not null
                          { $gte: ["$endDate", new Date()] }, // Check if endDate is not over the current date
                        ],
                      },
                      then: "$offerDetails.discountPercentage", // Use discountPercentage if conditions are met
                      else: null, // Set discountPrice to null if conditions are not met
                    },
                  },
                },
              },
              {
                $addFields: {
                  activitydiscountedPrice: {
                    $cond: {
                      if: { $eq: ["$discountPrice", null] }, // Check if discountPrice is null
                      then: null, // Set activitydiscountedPrice to null if discountPrice is null
                      else: {
                        $multiply: [
                          "$activityAdultPrice",
                          { $divide: ["$discountPrice", 100] },
                        ],
                      },
                    },
                  },
                },
              },
              {
                $sort: {
                  topPriority: 1,
                },
              },
              {
                $limit: 8,
              },

              {
                $project: {
                  image: 1,
                  activityTitle: 1,
                  description: 1,
                  activityActualPrice: 1,
                  tourDuration: 1,
                  catDetails: "$catDetails.categoryName",
                  reviewRating: 1,
                  totalReview: 1,
                  currency: 1,
                  slug: 1,
                  offerDetails:1,
                  // activityActualAdultPrice:1,
                  startDate: 1,
                  endDate: 1,
                  durationInSeconds: 1,
                  activityAdultPrice: 1,
                  discountPrice: 1,
                  activitydiscountedPrice: 1,
                },
              },
            ],
            as: "Top_activity",
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
                  tourModuleId: new mongoose.Types.ObjectId(req.params.tourid),
                  status: true,
                },
              },
              {
                $lookup: {
                  from: "categories",
                  localField: "categoryId",
                  foreignField: "_id",
                  as: "catDetails",
                },
              },
              {
                $unwind: {
                  path: "$catDetails",
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
                        activityDetailsId: 1,
                        avgRating: 1,
                      },
                    },
                  ],
                  as: "otherReview",
                },
              },
              {
                $addFields: {
                  reviewRating: { $sum: { $avg: "$otherReview.avgRating" } },
                },
              },
              {
                $addFields: {
                  totalReview: { $size: "$otherReview" },
                },
              },
              {
                $lookup: {
                  from: "specialoffers",
                  localField: "specialOfferId",
                  foreignField: "_id",
                  pipeline: [
                    {
                      $match: {
                        endDate: {
                          $gte: moment.utc(new Date()).startOf("date").toDate(),
                        },
                      },
                    },
                  ],
                  as: "offerDetails",
                },
              },
              {
                $unwind: {
                  path: "$offerDetails",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $addFields: {
                  activityActualAdultPrice: "$participentType",
                },
              },
              {
                $addFields: {
                  adultPrice: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$activityActualAdultPrice",
                          as: "priceItem",
                          cond: { $eq: ["$$priceItem.pertype", "Adult"] },
                        },
                      },
                      0,
                    ],
                  },
                },
              },
              {
                $addFields: {
                  activityAdultPrice: "$adultPrice.price",
                },
              },
              {
                $addFields: {
                  discountPrice: "$offerDetails.discountPercentage",
                },
              },
              {
                $addFields: {
                  activitydiscountedPrice: {
                    $multiply: [
                      "$activityAdultPrice",
                      { $divide: ["$discountPrice", 100] },
                    ],
                  },
                },
              },
              {
                $addFields: {
                  duration: {
                    $ifNull: ["$offerDetails.duration", 0],
                  },
                },
              },
              {
                $addFields: {
                  durationInSeconds: {
                    $switch: {
                      branches: [
                        {
                          case: {
                            $eq: ["$offerDetails.duration.unit", "days"],
                          },
                          then: {
                            $multiply: [
                              "$offerDetails.duration.value",
                              24 * 60 * 60 * 1000,
                            ],
                          },
                        },
                        {
                          case: {
                            $eq: ["$offerDetails.duration.unit", "hours"],
                          },
                          then: {
                            $multiply: [
                              "$offerDetails.duration.value",
                              60 * 60 * 1000,
                            ],
                          },
                        },
                        {
                          case: {
                            $eq: ["$offerDetails.duration.unit", "minutes"],
                          },
                          then: {
                            $multiply: [
                              "$offerDetails.duration.value",
                              60 * 1000,
                            ],
                          },
                        },
                      ],
                      default: 0, // Default value if "unit" doesn't match any of the cases
                    },
                  },
                },
              },
              {
                $addFields: {
                  startDate: {
                    $cond: {
                      if: { $ne: ["$offerDetails.startDate", null] }, // Check if offerDetails.startDate is not null
                      then: "$offerDetails.startDate", // Use offerDetails.startDate if available
                      else: new Date(), // Use the current date as a default if offerDetails.startDate is null
                    },
                  },
                },
              },
              {
                $addFields: {
                  endDate: {
                    $cond: {
                      if: { $ne: ["$offerDetails", null] }, // Check if offerDetails is not null
                      then: { $add: ["$startDate", "$durationInSeconds"] }, // Calculate endDate
                      else: null, // Set endDate to null if offerDetails is null
                    },
                  },
                },
              },
              {
                $addFields: {
                  discountPrice: {
                    $cond: {
                      if: {
                        $and: [
                          { $ne: ["$offerDetails", null] }, // Check if offerDetails is not null
                          { $gte: ["$endDate", new Date()] }, // Check if endDate is not over the current date
                        ],
                      },
                      then: "$offerDetails.discountPercentage", // Use discountPercentage if conditions are met
                      else: null, // Set discountPrice to null if conditions are not met
                    },
                  },
                },
              },
              {
                $addFields: {
                  activitydiscountedPrice: {
                    $cond: {
                      if: { $eq: ["$discountPrice", null] }, // Check if discountPrice is null
                      then: null, // Set activitydiscountedPrice to null if discountPrice is null
                      else: {
                        $multiply: [
                          "$activityAdultPrice",
                          { $divide: ["$discountPrice", 100] },
                        ],
                      },
                    },
                  },
                },
              },

              {
                $project: {
                  image: 1,
                  activityTitle: 1,
                  description: 1,
                  activityActualPrice: 1,
                  tourDuration: 1,
                  catDetails: "$catDetails.categoryName",
                  reviewRating: 1,
                  totalReview: 1,
                  currency: 1,
                  slug: 1,
                  startDate: 1,
                  endDate: 1,
                  durationInSeconds: 1,
                  activityAdultPrice: 1,
                  discountPrice: 1,
                  activitydiscountedPrice: 1,
                  offerDetails:1
                },
              },
            ],
            as: "All_activity",
          },
        },
        {
          $project: {
            status: 0,
            isDeleted: 0,
            createdOn: 0,
            updatedOn: 0,
            __v: 0,
            countryId: 0,
          },
        },
      ])
      .then((data) => {
        return res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "View cityAgainstActivity Tours",
          data: data,
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
  }
};

const sitesAgainstActivity = async (req, res) => {
  await activitySites
    .aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.params.activitySiteId),
          isDeleted: false,
          status: true,
        },
      },
      {
        $lookup: {
          from: "activitydetails",
          localField: "_id",
          foreignField: "activitySiteId",
          pipeline: [
            {
              $match: {
                activityTypesId: new mongoose.Types.ObjectId(
                  req.params.activityTypeId
                ),
                isApproval: true,
              },
            },
            {
              $lookup: {
                from: "specialoffers",
                localField: "specialOfferId",
                foreignField: "_id",
                pipeline: [
                  {
                    $match: {
                      endDate: {
                        $gte: moment.utc(new Date()).startOf("date").toDate(),
                      },
                    },
                  },
                ],
                as: "offerDetails",
              },
            },
            {
              $unwind: {
                path: "$offerDetails",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $addFields: {
                activityActualAdultPrice: "$participentType",
              },
            },
            {
              $addFields: {
                adultPrice: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$activityActualAdultPrice",
                        as: "priceItem",
                        cond: { $eq: ["$$priceItem.pertype", "Adult"] },
                      },
                    },
                    0,
                  ],
                },
              },
            },
            {
              $addFields: {
                activityAdultPrice: "$adultPrice.price",
              },
            },
            {
              $addFields: {
                discountPrice: "$offerDetails.discountPercentage",
              },
            },
            {
              $addFields: {
                activitydiscountedPrice: {
                  $multiply: [
                    "$activityAdultPrice",
                    { $divide: ["$discountPrice", 100] },
                  ],
                },
              },
            },
            {
              $addFields: {
                duration: {
                  $ifNull: ["$offerDetails.duration", 0],
                },
              },
            },

            {
              $addFields: {
                durationInSeconds: {
                  $switch: {
                    branches: [
                      {
                        case: {
                          $eq: ["$offerDetails.duration.unit", "days"],
                        },
                        then: {
                          $multiply: [
                            "$offerDetails.duration.value",
                            24 * 60 * 60 * 1000,
                          ],
                        },
                      },
                      {
                        case: {
                          $eq: ["$offerDetails.duration.unit", "hours"],
                        },
                        then: {
                          $multiply: [
                            "$offerDetails.duration.value",
                            60 * 60 * 1000,
                          ],
                        },
                      },
                      {
                        case: {
                          $eq: ["$offerDetails.duration.unit", "minutes"],
                        },
                        then: {
                          $multiply: [
                            "$offerDetails.duration.value",
                            60 * 1000,
                          ],
                        },
                      },
                    ],
                    default: 0,
                  },
                },
              },
            },
            {
              $addFields: {
                startDate: {
                  $cond: {
                    if: { $ne: ["$offerDetails.startDate", null] },
                    then: "$offerDetails.startDate",
                    else: new Date(),
                  },
                },
              },
            },

            {
              $addFields: {
                endDate: {
                  $cond: {
                    if: { $ne: ["$offerDetails", null] },
                    then: { $add: ["$startDate", "$durationInSeconds"] },
                    else: null,
                  },
                },
              },
            },
            {
              $addFields: {
                discountPrice: {
                  $cond: {
                    if: {
                      $and: [
                        { $ne: ["$offerDetails", null] },
                        { $gte: ["$endDate", new Date()] },
                      ],
                    },
                    then: "$offerDetails.discountPercentage",
                    else: null,
                  },
                },
              },
            },
            {
              $addFields: {
                activitydiscountedPrice: {
                  $cond: {
                    if: { $eq: ["$discountPrice", null] },
                    then: null,
                    else: {
                      $multiply: [
                        "$activityAdultPrice",
                        { $divide: ["$discountPrice", 100] },
                      ],
                    },
                  },
                },
              },
            },
            {
              $lookup: {
                from: "categories",
                localField: "categoryId",
                foreignField: "_id",
                as: "catDetails",
              },
            },
            {
              $unwind: {
                path: "$catDetails",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "languages",
                localField: "languageId",
                foreignField: "_id",
                as: "langDetails",
              },
            },
            {
              $unwind: {
                path: "$langDetails",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "merchants",
                localField: "assignById",
                foreignField: "_id",
                as: "merDetails",
              },
            },
            {
              $unwind: {
                path: "$merDetails",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "activitytypes",
                localField: "activityTypeId",
                foreignField: "_id",
                as: "activitytypeDetails",
              },
            },
            {
              $unwind: {
                path: "$activitytypeDetails",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "sections",
                localField: "sectionId",
                foreignField: "_id",
                as: "sectionsDetails",
              },
            },
            {
              $unwind: {
                path: "$sectionsDetails",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "activitysites",
                localField: "activitySiteId",
                foreignField: "_id",
                as: "activitysiteDetails",
              },
            },
            {
              $unwind: {
                path: "$activitysiteDetails",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "cities",
                localField: "cityId",
                foreignField: "_id",
                as: "citiDetails",
              },
            },
            {
              $unwind: {
                path: "$citiDetails",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $addFields: {
                specialOfferName: "$offerDetails.specialOfferName",
                discountPercentage: "$offerDetails.discountPercentage",
                marchentFirstName: "$merDetails.firstName",
                marchentLastName: "$merDetails.lastName",
                cityName: "$citiDetails.cityName",
                activitySiteName: "$activitysiteDetails.siteName",
                sectionTitle: "$sectionsDetails.sectionTitle",
                activitytypeName: "$activitytypeDetails.name",
                language: "$langDetails.name",
                catDetails: "$catDetails.categoryName",
              },
            },
            {
              $lookup: {
                from: "countries",
                localField: "countryId",
                foreignField: "_id",
                as: "country",
              },
            },
            {
              $unwind: { path: "$country", preserveNullAndEmptyArrays: true },
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
                      activityDetailsId: 1,
                      avgRating: 1,
                    },
                  },
                ],
                as: "otherReview",
              },
            },
            {
              $addFields: {
                reviewRating: {
                  $sum: { $avg: "$otherReview.avgRating" },
                },
              },
            },
            {
              $addFields: {
                totalReview: { $size: "$otherReview" },
              },
            },
            {
              $addFields: {
                specialOfferName: "$offerDetails.specialOfferName",
                discountPercentage: "$offerDetails.discountPercentage",
                marchentFirstName: "$merDetails.firstName",
                marchentLastName: "$merDetails.lastName",
                cityName: "$citiDetails.cityName",
                countryName: "$country.name",
                activitySiteName: "$activitysiteDetails.siteName",
                sectionTitle: "$sectionsDetails.sectionTitle",
                activitytypeName: "$activitytypeDetails.name",
                language: "$langDetails.name",
                catDetails: "$catDetails.categoryName",
              },
            },
            {
              $project: {
                slug: 1,
                activityTitle: 1,
                image: 1,
                currency: 1,
                description: 1,
                activityActualPrice: 1,
                reviewRating: 1,
                totalReview: 1,
                duration: 1,
                activityAdultPrice: 1,
                discountPrice: 1,
                activitydiscountedPrice: 1,
                durationInSeconds: 1,
              },
            },
          ],
          as: "all_activity",
        },
      },
    ])
    .then((data) => {
      res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "View sitesAgainstActivity Tours",
        data: data,
      });
    })
    .catch((error) => {
      console.log(error);
      const errors = DBerror(error);
      res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Invalid id. Server error.",
        error: errors,
      });
    });
};

const sitesAgainstActivity1 = async (req, res) => {
  console.log("req.body.destination=====", req.body.destination);
  try {
    var data = await activitySites.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.params.activitySiteId),
          isDeleted: false,
          status: true,
        },
      },
      {
        $lookup: {
          from: "activitydetails",
          localField: "_id",
          foreignField: "activitySiteId",
          pipeline: [
            {
              $match: {
                activityTypesId: new mongoose.Types.ObjectId(
                  req.params.activityTypeId
                ),
              },
            },
            {
              $addFields: {
                StringCatID: { $toString: "$categoryId" },
              },
            },

            {
              $addFields: {
                activityActualAdultPrice: "$participentType",
              },
            },

            // {
            //   $addFields: {
            //     StringLanguage: { $toString: "$languageId" },
            //   },
            // },
            {
              $addFields: {
                StringDesti: { $toString: "$destination" },
              },
            },
            // {
            //   $addFields: {
            //     StringDura: { $toString: "$duration" },
            //   },
            // },

            // duration filter function start
            {
              $addFields: {
                tourDuration: "$tourDuration",
              },
            },
            {
              $addFields: {
                tourDurationInSeconds: {
                  $switch: {
                    branches: [
                      {
                        case: { $eq: ["$tourDuration.unit", "days"] },
                        then: {
                          $multiply: [
                            "$tourDuration.value",
                            24 * 60 * 60 * 1000,
                          ],
                        },
                      },
                      {
                        case: { $eq: ["$tourDuration.unit", "hours"] },
                        then: {
                          $multiply: ["$tourDuration.value", 60 * 60 * 1000],
                        },
                      },
                      {
                        case: { $eq: ["$tourDuration.unit", "minutes"] },
                        then: { $multiply: ["$tourDuration.value", 60 * 1000] },
                      },
                    ],
                    default: 0, // Default value if "unit" doesn't match any of the cases
                  },
                },
              },
            },

            Array.isArray(req.body.duration) && req.body.duration.length > 0
              ? {
                $match: {
                  $or: req.body.duration
                    .map((duration) => {
                      switch (duration) {
                        case "0-3 hours":
                          return {
                            tourDurationInSeconds: {
                              $gt: 0,
                              $lte: 3 * 60 * 60 * 1000,
                            },
                          };
                        case "3-5 hours":
                          return {
                            tourDurationInSeconds: {
                              $gt: 3 * 60 * 60 * 1000,
                              $lte: 5 * 60 * 60 * 1000,
                            },
                          };
                        case "5-7 hours":
                          return {
                            tourDurationInSeconds: {
                              $gt: 5 * 60 * 60 * 1000,
                              $lte: 7 * 60 * 60 * 1000,
                            },
                          };
                        case "fullday":
                          return {
                            tourDurationInSeconds: {
                              $gt: 7 * 60 * 60 * 1000,
                              $lte: 24 * 60 * 60 * 1000,
                            },
                          };
                        case "multiday":
                          return {
                            tourDurationInSeconds: {
                              $gt: 24 * 60 * 60 * 1000,
                            },
                          };
                        default:
                          return null; // Handle unknown values
                      }
                    })
                    .filter((condition) => condition !== null), // Filter out null conditions
                },
              }
              : { $project: { __v: 0 } },

            // duration filter function end

            // (req.body.minprice != "" &&
            //   typeof req.body.minprice != "undefined") ||
            //   (req.body.maxprice != "" && typeof req.body.maxprice != "undefined")
            //   ? {
            //     $match: {
            //       $expr: {
            //         $and: [
            //           {
            //             $gte: [
            //               "$activityActualPrice",
            //               Number(req.body.minprice),
            //             ],
            //           },
            //           {
            //             $lte: [
            //               "$activityActualPrice",
            //               Number(req.body.maxprice),
            //             ],
            //           },
            //         ],
            //       },
            //     },
            //   }

            //   : { $project: { __v: 0 } },

            // req.body.language.length > 0 &&
            //   typeof req.body.language != "undefined"
            //   ? {
            //     $match: {
            //       StringLanguage: { $in: req.body.language },
            //     },
            //   }
            //   : { $project: { __v: 0 } },

            // req.body.catId.length > 0 && typeof req.body.catId != "undefined"
            //   ? {
            //     $match: {
            //       StringCatID: { $in: req.body.catId },
            //     },
            //   }
            //   : { $project: { __v: 0 } },

            Array.isArray(req.body.catId) && req.body.catId.length > 0
              ? {
                $match: {
                  StringCatID: { $in: req.body.catId },
                },
              }
              : { $project: { __v: 0 } },

            Array.isArray(req.body.destination) &&
              req.body.destination.length > 0
              ? {
                $match: {
                  StringDesti: { $in: req.body.destination },
                },
              }
              : { $project: { __v: 0 } },

            // req.body.duration > 0 &&
            //   typeof req.body.duration != "undefined"
            //   ? {
            //     $match: {
            //       StringDura: { $in: req.body.duration },
            //     },
            //   }
            //   : { $project: { __v: 0 } },

            // {
            //   $match: {
            //     $or: [
            //       {
            //         $and: [
            //           // { activityActualPrice: { $gte: req.body.minprice } },
            //           // { activityActualPrice: { $lte: req.body.maxprice } },
            //           {
            //             StringLanguage:{$in: req.body.language}
            //           },
            //           {StringCatID: {$in: req.body.catId}},
            //           {StringDesti: {$in: req.body.destination}},
            //           {StringDura: {$in: req.body.duration}},

            //         ],
            //       },

            //     ],
            //   },
            // },

            {
              $lookup: {
                from: "availabilities",
                localField: "_id",
                foreignField: "activityDetailsId",
                pipeline: [
                  req.body.time.length > 0 &&
                    typeof req.body.time != "undefined"
                    ? {
                      $match: {
                        shift: { $in: req.body.time },
                      },
                    }
                    : { $project: { __v: 0 } },

                  {
                    $project: {
                      shift: 1,
                      time: 1,
                      remeningUser: 1,
                    },
                  },
                ],
                as: "slottime",
              },
            },

            // for calculating adult price and discount price with respect of offer. function start //
            {
              $lookup: {
                from: "specialoffers",
                localField: "specialOfferId",
                foreignField: "_id",
                pipeline: [
                  // {
                  //   $match: {
                  //     endDate: {
                  //       $gte: moment
                  //         .utc(new Date())
                  //         .startOf("date")
                  //         .toDate(),
                  //     },
                  //   },
                  // },
                ],
                as: "offerDetails",
              },
            },
            {
              $unwind: {
                path: "$offerDetails",
                preserveNullAndEmptyArrays: true,
              },
            },

            {
              $addFields: {
                adultPrice: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$activityActualAdultPrice",
                        as: "priceItem",
                        cond: { $eq: ["$$priceItem.pertype", "Adult"] },
                      },
                    },
                    0,
                  ],
                },
              },
            },

            {
              $addFields: {
                activityAdultPrice: "$adultPrice.price",
              },
            },

            {
              $addFields: {
                duration: {
                  $ifNull: ["$offerDetails.duration", 0],
                },
              },
            },

            {
              $addFields: {
                durationInSeconds: {
                  $switch: {
                    branches: [
                      {
                        case: {
                          $eq: ["$offerDetails.duration.unit", "days"],
                        },
                        then: {
                          $multiply: [
                            "$offerDetails.duration.value",
                            24 * 60 * 60 * 1000,
                          ],
                        },
                      },
                      {
                        case: {
                          $eq: ["$offerDetails.duration.unit", "hours"],
                        },
                        then: {
                          $multiply: [
                            "$offerDetails.duration.value",
                            60 * 60 * 1000,
                          ],
                        },
                      },
                      {
                        case: {
                          $eq: ["$offerDetails.duration.unit", "minutes"],
                        },
                        then: {
                          $multiply: [
                            "$offerDetails.duration.value",
                            60 * 1000,
                          ],
                        },
                      },
                    ],
                    default: 0, // Default value if "unit" doesn't match any of the cases
                  },
                },
              },
            },
            {
              $addFields: {
                startDate: {
                  $cond: {
                    if: { $ne: ["$offerDetails.startDate", null] },
                    then: "$offerDetails.startDate", // Use offerDetails.startDate if available
                    else: new Date(), // Use the current date as a default if offerDetails.startDate is null
                  },
                },
              },
            },

            {
              $addFields: {
                endDate: {
                  $cond: {
                    if: { $ne: ["$offerDetails", null] }, // Check if offerDetails is not null
                    then: { $add: ["$startDate", "$durationInSeconds"] }, // Calculate endDate
                    else: null, // Set endDate to null if offerDetails is null
                  },
                },
              },
            },
            {
              $addFields: {
                discountPrice: {
                  $cond: {
                    if: {
                      $and: [
                        { $ne: ["$offerDetails", null] }, // Check if offerDetails is not null
                        { $gte: ["$endDate", new Date()] }, // Check if endDate is not over the current date
                      ],
                    },
                    then: "$offerDetails.discountPercentage", // Use discountPercentage if conditions are met
                    else: null, // Set discountPrice to null if conditions are not met
                  },
                },
              },
            },
            {
              $addFields: {
                activitydiscountedPrice: {
                  $cond: {
                    if: { $eq: ["$discountPrice", null] }, // Check if discountPrice is null
                    then: null, // Set activitydiscountedPrice to null if discountPrice is null
                    else: {
                      $multiply: [
                        "$activityAdultPrice",
                        { $divide: ["$discountPrice", 100] },
                      ],
                    },
                  },
                },
              },
            },

            // for calculating adult price and discount price with respect of offer. function end //

            // filtering by min and max price function start //
            {
              $addFields: {
                activityCurrentPrice: {
                  $subtract: [
                    "$activityAdultPrice",
                    "$activitydiscountedPrice",
                  ],
                },
              },
            },

            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $gte: [
                        {
                          $ifNull: [
                            "$activityCurrentPrice",
                            "$activityAdultPrice",
                          ],
                        },
                        Number(req.body.minprice),
                      ],
                    },
                    {
                      $lte: [
                        {
                          $ifNull: [
                            "$activityCurrentPrice",
                            "$activityAdultPrice",
                          ],
                        },
                        Number(req.body.maxprice),
                      ],
                    },
                  ],
                },
              },
            },
            {
              $project: { __v: 0 },
            },

            // filtering by min and max price function end //

            {
              $lookup: {
                from: "categories",
                localField: "categoryId",
                foreignField: "_id",

                as: "catDetails",
              },
            },
            {
              $unwind: {
                path: "$catDetails",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "languages",
                localField: "languageId",
                foreignField: "_id",
                as: "langDetails",
              },
            },
            {
              $unwind: {
                path: "$langDetails",
                preserveNullAndEmptyArrays: true,
              },
            },

            {
              $lookup: {
                from: "activitytypes",
                localField: "activityTypeId",
                foreignField: "_id",
                as: "activitytypeDetails",
              },
            },
            {
              $unwind: {
                path: "$activitytypeDetails",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "sections",
                localField: "sectionId",
                foreignField: "_id",
                as: "sectionsDetails",
              },
            },
            {
              $unwind: {
                path: "$sectionsDetails",
                preserveNullAndEmptyArrays: true,
              },
            },

            {
              $lookup: {
                from: "cities",
                localField: "cityId",
                foreignField: "_id",
                as: "citiDetails",
              },
            },
            {
              $unwind: {
                path: "$citiDetails",
                preserveNullAndEmptyArrays: true,
              },
            },

            // {
            //   $lookup: {
            //     from: "reviewratings",
            //     localField: "_id",
            //     foreignField: "activityDetailsId",
            //     as: "review",
            //   },
            // },
            // {
            //   $addFields: {
            //     avgReviews: { $avg: "$review.avgRating" },
            //   },
            // },

            // req.body.rating > 0 && typeof req.body.rating != "undefined"
            //   ? {
            //     $match: {
            //       avgReviews: { $gte: req.body.rating },
            //     },
            //   }
            //   : { $project: { __v: 0 } },

            // review rating filter function start
            {
              $lookup: {
                from: "reviewratings",
                localField: "_id",
                foreignField: "activityDetailsId",
                pipeline: [
                  {
                    $match: {
                      isDeleted: false,
                    },
                  },
                  {
                    $project: {
                      _id: 0,
                      avgRating: 1,
                    },
                  },
                ],
                as: "review",
              },
            },
            {
              $addFields: {
                reviewRating: {
                  $avg: "$review.avgRating",
                },
              },
            },

            typeof req.body.rating === "number"
              ? {
                $match: {
                  reviewRating: {
                    $gte: req.body.rating,
                    $lt: req.body.rating + 1,
                  },
                },
              }
              : { $project: { __v: 0 } },
            // review rating filter function end
            {
              $lookup: {
                from: "countries",
                localField: "countryId",
                foreignField: "_id",
                as: "country",
              },
            },
            {
              $unwind: { path: "$country", preserveNullAndEmptyArrays: true },
            },
            {
              $addFields: {
                // discountPercentage: "$offerDetails.discountPercentage",
                cityName: "$citiDetails.cityName",
                countryName: "$country.name",
                activitySiteName: "$activitysiteDetails.siteName",
                sectionTitle: "$sectionsDetails.sectionTitle",
                activitytypeName: "$activitytypeDetails.name",
                language: "$langDetails.name",
                languageId: "$langDetails._id",
                catDetails: "$catDetails.categoryName",
              },
            },
            {
              $project: {
                activityCurrentPrice: 1,
                reviewRating: 1,
                tourDuration: 1,
                tourDurationInSeconds: 1,
                // offerDetails: 1,
                // activityActualAdultPrice:1,
                // adultPrice:1,
                activityAdultPrice: 1,
                // startDate:1,
                // endDate: 1,
                discountPrice: 1,
                // duration:1,
                // durationInSeconds:1,
                activitydiscountedPrice: 1,
                slug: 1,
                activityTitle: 1,
                destination: 1,
                duration: 1,
                categoryId: 1,
                catId: 1,
                image: 1,
                catDetails: 1,
                activityActualPrice: 1,
                avgReviews: 1,
                // languageId: 1,
                slottime: 1,
              },
            },
          ],

          as: "all_activity",
        },
      },
    ]);
    return data;
  } catch (error) {
    res.status(ResponseCode.errorCode.serverError).json({
      status: false,
      message: "Invalid id. Server error.",
      error: error,
    });
  }

  // .then((data) => {

  //    res.status(ResponseCode.errorCode.success).json({
  //     status: true,
  //     message: "View sitesAgainstActivity Tours",
  //     data: data,
  //   });
  // })
  // .catch((error) => {
  //   console.log(error)
  //   const errors = DBerror(error);
  //    res.status(ResponseCode.errorCode.serverError).json({
  //     status: false,
  //     message: "Invalid id. Server error.",
  //     error: errors,
  //   });
  // });
};

const filterSitesAgainstActivity = async (req, res) => {
  const allactivity = await sitesAgainstActivity1(req, res);
  // console.log("allactivity====", allactivity);

  if (req.body.noFilter == true) {
    res.status(ResponseCode.errorCode.success).json({
      status: true,
      message: "View sitesAgainstActivity Tours",
      data: allactivity,
    });
  } else {
    console.log("filtered", allactivity);

    allactivity.forEach((item) => {
      item.all_activity = item.all_activity.filter(
        (activity) => activity.slottime.length > 0
      );
    });

    res.status(ResponseCode.errorCode.success).json({
      status: true,
      message: "View sitesAgainstActivity Tours",
      data: allactivity,
    });
  }
};

const allCategory = async (req, res) => {
  await Category.aggregate([
    {
      $match: {
        isDeleted: false,
      },
    },

    {
      $project: {
        __v: 0,
        createdOn: 0,
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

const allDestination = async (req, res) => {
  await Desination.aggregate([
    {
      $match: {
        isDeleted: false,
      },
    },

    {
      $project: {
        __v: 0,
        createdOn: 0,
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

const HomePageSearch1 = async (req, res) => {
  // var searchname = new RegExp(req.body.searchname, 'i');
  const activitySearch = await activityDetailsModel
    .find(
      {
        activityTitle: {
          $regex: ".*" + req.body.searchname + ".*",
          $options: "i",
        },
      },
      { _id: 1 }
    )
    .exec();
  const siteSearch = await activitySites
    .find(
      {
        activityTitle: {
          $regex: ".*" + req.body.searchname + ".*",
          $options: "i",
        },
      },
      { _id: 1 }
    )
    .exec();

  const citySearch = await city
    .find(
      {
        cityName: { $regex: ".*" + req.body.searchname + ".*", $options: "i" },
      },
      { _id: 1 }
    )
    .exec();
  const countrySearch = await Country.find(
    { name: { $regex: ".*" + req.body.searchname + ".*", $options: "i" } },
    { _id: 1 }
  ).exec();
  console.log({ citySearch });
  console.log({ countrySearch });
  console.log({ activitySearch });

  try {
    await activityDetailsModel
      .aggregate([
        {
          $match: {
            isDeleted: false,
            status: true,

            $or: [
              {
                cityId: { $in: citySearch.map((city) => city._id) },
              },

              {
                countryId: { $in: countrySearch.map((country) => country._id) },
              },

              {
                activitySiteId: { $in: siteSearch.map((site) => site._id) },
              },
            ],
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
                  categoryName: 1,
                },
              },
            ],
            as: "categoryData",
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
            as: "reviewData",
          },
        },
        {
          $unwind: {
            path: "$categoryData",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            review: { $sum: { $avg: "$reviewData.avgRating" } },
          },
        },
        {
          $project: {
            activityTitle: 1,
            slug: 1,
            image: 1,
            tourDuration: 1,
            tourDuration: 1,
            duration: 1,
            categoryData: 1,
            review: 1,
            activityActualPrice: 1,
            activityDiscountPrice: 1,
          },
        },
      ])
      .then((data) => {
        res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "View all matched activity",
          data: data,
        });
      })
      .catch((error) => {
        console.log(error);
        const errors = DBerror(error);
        res.status(ResponseCode.errorCode.serverError).json({
          status: false,
          message: "Invalid id. Server error.",
          error: errors,
        });
      });
  } catch (error) {
    res.status(ResponseCode.errorCode.serverError).json({
      status: false,
      message: "Invalid id. Server error.",
      error: error,
    });
  }
};

const HomePageSearch = async (req, res) => {
  var searchname = new RegExp(req.body.searchname, "i");
  const activitySearch = await activityDetailsModel
    .find({
      // _id: new mongoose.Types.ObjectId(req.body.id),
      _id: new mongoose.Types.ObjectId(req.body.id),
    })
    .exec();
  const siteSearch = await activitySites
    .find({
      _id: new mongoose.Types.ObjectId(req.body.id),
    })
    .exec();

  const citySearch = await city
    .find({
      _id: new mongoose.Types.ObjectId(req.body.id),
    })
    .exec();
  const countrySearch = await Country.find({
    _id: new mongoose.Types.ObjectId(req.body.id),
  }).exec();
  console.log({ citySearch });
  console.log({ countrySearch });
  console.log({ activitySearch });

  if (citySearch.length > 0) {
    console.log("city");

    try {
      await activityDetailsModel
        .aggregate([
          {
            $match: {
              isDeleted: false,
              status: true,
              cityId: new mongoose.Types.ObjectId(req.body.id),
              saveAsDraft: false,
              isApproval:true
            },
          },
          {
            $lookup: {
              from: "activitydetails",
              localField: "cityId",
              foreignField: "cityId",
              pipeline: [
                {
                  $match: {
                    isDeleted: false,
                    status: true,
                    saveAsDraft: false,
                    isApproval:true

                  },
                },
                {
                  $lookup: {
                    from: "categories",
                    localField: "categoryId",
                    foreignField: "_id",
                    as: "catDetails",
                  },
                },
                {
                  $unwind: {
                    path: "$catDetails",
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
                          activityDetailsId: 1,
                          avgRating: 1,
                        },
                      },
                    ],
                    as: "otherReview",
                  },
                },
                {
                  $addFields: {
                    reviewRating: { $sum: { $avg: "$otherReview.avgRating" } },
                  },
                },
                {
                  $addFields: {
                    totalReview: { $size: "$otherReview" },
                  },
                },

                // discount price and adult price in main list function start //
                {
                  $lookup: {
                    from: "specialoffers",
                    localField: "specialOfferId",
                    foreignField: "_id",
                    as: "offerDetails",
                  },
                },
                {
                  $unwind: {
                    path: "$offerDetails",
                    preserveNullAndEmptyArrays: true,
                  },
                },

                {
                  $addFields: {
                    activityActualAdultPrice: "$participentType",
                  },
                },
                {
                  $addFields: {
                    adultPrice: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$activityActualAdultPrice",
                            as: "priceItem",
                            cond: { $eq: ["$$priceItem.pertype", "Adult"] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                },
                {
                  $addFields: {
                    activityAdultPrice: "$adultPrice.price",
                  },
                },

                {
                  $addFields: {
                    duration: {
                      $ifNull: ["$offerDetails.duration", 0],
                    },
                  },
                },

                {
                  $addFields: {
                    durationInSeconds: {
                      $switch: {
                        branches: [
                          {
                            case: {
                              $eq: ["$offerDetails.duration.unit", "days"],
                            },
                            then: {
                              $multiply: [
                                "$offerDetails.duration.value",
                                24 * 60 * 60 * 1000,
                              ],
                            },
                          },
                          {
                            case: {
                              $eq: ["$offerDetails.duration.unit", "hours"],
                            },
                            then: {
                              $multiply: [
                                "$offerDetails.duration.value",
                                60 * 60 * 1000,
                              ],
                            },
                          },
                          {
                            case: {
                              $eq: ["$offerDetails.duration.unit", "minutes"],
                            },
                            then: {
                              $multiply: [
                                "$offerDetails.duration.value",
                                60 * 1000,
                              ],
                            },
                          },
                        ],
                        default: 0, // Default value if "unit" doesn't match any of the cases
                      },
                    },
                  },
                },
                {
                  $addFields: {
                    startDate: {
                      $cond: {
                        if: { $ne: ["$offerDetails.startDate", null] },
                        then: "$offerDetails.startDate", // Use offerDetails.startDate if available
                        else: new Date(), // Use the current date as a default if offerDetails.startDate is null
                      },
                    },
                  },
                },

                {
                  $addFields: {
                    endDate: {
                      $cond: {
                        if: { $ne: ["$offerDetails", null] }, // Check if offerDetails is not null
                        then: { $add: ["$startDate", "$durationInSeconds"] }, // Calculate endDate
                        else: null, // Set endDate to null if offerDetails is null
                      },
                    },
                  },
                },
                {
                  $addFields: {
                    discountPrice: {
                      $cond: {
                        if: {
                          $and: [
                            { $ne: ["$offerDetails", null] }, // Check if offerDetails is not null
                            { $gte: ["$endDate", new Date()] }, // Check if endDate is not over the current date
                          ],
                        },
                        then: "$offerDetails.discountPercentage", // Use discountPercentage if conditions are met
                        else: null, // Set discountPrice to null if conditions are not met
                      },
                    },
                  },
                },

                {
                  $addFields: {
                    activitydiscountedPrice: {
                      $cond: {
                        if: { $eq: ["$discountPrice", null] }, // Check if discountPrice is null
                        then: null, // Set activitydiscountedPrice to null if discountPrice is null
                        else: {
                          $multiply: [
                            "$activityAdultPrice",
                            { $divide: ["$discountPrice", 100] },
                          ],
                        },
                      },
                    },
                  },
                },

                // discount price and adult price in main list function End //

                {
                  $sort: {
                    topPriority: 1,
                  },
                },
                {
                  $limit: 8,
                },

                {
                  $project: {
                    activityAdultPrice: 1,
                    discountPrice: 1,
                    activitydiscountedPrice: 1,

                    image: 1,
                    activityTitle: 1,
                    slug: 1,
                    description: 1,
                    activityActualPrice: 1,
                    tourDuration: 1,
                    catDetails: "$catDetails.categoryName",
                    reviewRating: 1,
                    totalReview: 1,
                    currency: 1,
                  },
                },
              ],
              as: "Top_activity",
            },
          },
          {
            $lookup: {
              from: "activitydetails",
              localField: "cityId",
              foreignField: "cityId",
              pipeline: [
                {
                  $match: {
                    isDeleted: false,
                    status: true,
                    saveAsDraft: false,
                    isApproval:true
                  },
                },
                {
                  $lookup: {
                    from: "categories",
                    localField: "categoryId",
                    foreignField: "_id",
                    as: "catDetails",
                  },
                },
                {
                  $unwind: {
                    path: "$catDetails",
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
                          activityDetailsId: 1,
                          avgRating: 1,
                        },
                      },
                    ],
                    as: "otherReview",
                  },
                },
                {
                  $addFields: {
                    reviewRating: { $sum: { $avg: "$otherReview.avgRating" } },
                  },
                },
                {
                  $addFields: {
                    totalReview: { $size: "$otherReview" },
                  },
                },

                {
                  $lookup: {
                    from: "specialoffers",
                    localField: "specialOfferId",
                    foreignField: "_id",
                    as: "offerDetails",
                  },
                },
                {
                  $unwind: {
                    path: "$offerDetails",
                    preserveNullAndEmptyArrays: true,
                  },
                },

                {
                  $addFields: {
                    activityActualAdultPrice: "$participentType",
                  },
                },
                {
                  $addFields: {
                    adultPrice: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$activityActualAdultPrice",
                            as: "priceItem",
                            cond: { $eq: ["$$priceItem.pertype", "Adult"] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                },
                {
                  $addFields: {
                    activityAdultPrice: "$adultPrice.price",
                  },
                },

                {
                  $addFields: {
                    duration: {
                      $ifNull: ["$offerDetails.duration", 0],
                    },
                  },
                },

                {
                  $addFields: {
                    durationInSeconds: {
                      $switch: {
                        branches: [
                          {
                            case: {
                              $eq: ["$offerDetails.duration.unit", "days"],
                            },
                            then: {
                              $multiply: [
                                "$offerDetails.duration.value",
                                24 * 60 * 60 * 1000,
                              ],
                            },
                          },
                          {
                            case: {
                              $eq: ["$offerDetails.duration.unit", "hours"],
                            },
                            then: {
                              $multiply: [
                                "$offerDetails.duration.value",
                                60 * 60 * 1000,
                              ],
                            },
                          },
                          {
                            case: {
                              $eq: ["$offerDetails.duration.unit", "minutes"],
                            },
                            then: {
                              $multiply: [
                                "$offerDetails.duration.value",
                                60 * 1000,
                              ],
                            },
                          },
                        ],
                        default: 0, // Default value if "unit" doesn't match any of the cases
                      },
                    },
                  },
                },
                {
                  $addFields: {
                    startDate: {
                      $cond: {
                        if: { $ne: ["$offerDetails.startDate", null] },
                        then: "$offerDetails.startDate", // Use offerDetails.startDate if available
                        else: new Date(), // Use the current date as a default if offerDetails.startDate is null
                      },
                    },
                  },
                },

                {
                  $addFields: {
                    endDate: {
                      $cond: {
                        if: { $ne: ["$offerDetails", null] }, // Check if offerDetails is not null
                        then: { $add: ["$startDate", "$durationInSeconds"] }, // Calculate endDate
                        else: null, // Set endDate to null if offerDetails is null
                      },
                    },
                  },
                },
                {
                  $addFields: {
                    discountPrice: {
                      $cond: {
                        if: {
                          $and: [
                            { $ne: ["$offerDetails", null] }, // Check if offerDetails is not null
                            { $gte: ["$endDate", new Date()] }, // Check if endDate is not over the current date
                          ],
                        },
                        then: "$offerDetails.discountPercentage", // Use discountPercentage if conditions are met
                        else: null, // Set discountPrice to null if conditions are not met
                      },
                    },
                  },
                },

                {
                  $addFields: {
                    activitydiscountedPrice: {
                      $cond: {
                        if: { $eq: ["$discountPrice", null] }, // Check if discountPrice is null
                        then: null, // Set activitydiscountedPrice to null if discountPrice is null
                        else: {
                          $multiply: [
                            "$activityAdultPrice",
                            { $divide: ["$discountPrice", 100] },
                          ],
                        },
                      },
                    },
                  },
                },

                // discount price and adult price in main list function End //

                {
                  $project: {
                    activityAdultPrice: 1,
                    discountPrice: 1,
                    activitydiscountedPrice: 1,

                    image: 1,
                    activityTitle: 1,
                    slug: 1,
                    description: 1,
                    activityActualPrice: 1,
                    tourDuration: 1,
                    catDetails: "$catDetails.categoryName",
                    reviewRating: 1,
                    totalReview: 1,
                  },
                },
              ],
              as: "All_activity",
            },
          },

          {
            $project: {
              status: 0,
              isDeleted: 0,
              createdOn: 0,
              updatedOn: 0,
              __v: 0,
              countryId: 0,
            },
          },
        ])
        .then((data) => {
          res.status(ResponseCode.errorCode.success).json({
            status: true,
            message: "View all matched activity",
            data: data[0],
          });
        })
        .catch((error) => {
          console.log(error);
          const errors = DBerror(error);
          res.status(ResponseCode.errorCode.serverError).json({
            status: false,
            message: "Invalid id. Server error.",
            error: errors,
          });
        });
    } catch (error) {
      res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Invalid id. Server error.",
        error: error,
      });
    }
  } else {
    console.log("other");
    try {
      await activityDetailsModel
        .aggregate([
          {
            $match: {
              isDeleted: false,
              status: true,
              saveAsDraft: false,
              isApproval:true,
              $or: [
                {
                  destination: new mongoose.Types.ObjectId(req.body.id),
                },
                {
                  _id: new mongoose.Types.ObjectId(req.body.id),
                },
                {
                  countryId: new mongoose.Types.ObjectId(req.body.id),
                },

                {
                  activitySiteId: new mongoose.Types.ObjectId(req.body.id),
                },
              ],
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
                    categoryName: 1,
                  },
                },
              ],
              as: "categoryData",
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
              as: "reviewData",
            },
          },
          {
            $unwind: {
              path: "$categoryData",
              preserveNullAndEmptyArrays: true,
            },
          },
          // {
          //   $addFields: {
          //     review: { $sum: { $avg: "$reviewData.avgRating" } },
          //   },
          // },
          {
            $addFields: {
              reviewRating: { $sum: { $avg: "$reviewData.avgRating" } },
            },
          },
          {
            $addFields: {
              totalReview: { $size: "$reviewData" },
            },
          },
          {
            $project: {
              activityTitle: 1,
              slug: 1,
              image: 1,
              tourDuration: 1,
              tourDuration: 1,
              duration: 1,
              categoryData: 1,
              review: 1,
              activityActualPrice: 1,
              activityDiscountPrice: 1,
              reviewRating: 1,
              totalReview: 1,
            },
          },
        ])
        .then((data) => {
          res.status(ResponseCode.errorCode.success).json({
            status: true,
            message: "View all matched activity",
            data: data,
          });
        })
        .catch((error) => {
          console.log(error);
          const errors = DBerror(error);
          res.status(ResponseCode.errorCode.serverError).json({
            status: false,
            message: "Invalid id. Server error.",
            error: errors,
          });
        });
    } catch (error) {
      res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Invalid id. Server error.",
        error: error,
      });
    }
  }
};

const HomePageSearchAuth = async (req, res) => {
  var searchname = new RegExp(req.body.searchname, "i");
  const activitySearch = await activityDetailsModel
    .find({
      _id: new mongoose.Types.ObjectId(req.body.id),
    })
    .exec();
  const siteSearch = await activitySites
    .find({
      _id: new mongoose.Types.ObjectId(req.body.id),
    })
    .exec();

  const citySearch = await city
    .find({
      _id: new mongoose.Types.ObjectId(req.body.id),
    })
    .exec();
  const countrySearch = await Country.find({
    _id: new mongoose.Types.ObjectId(req.body.id),
  }).exec();
  console.log({ citySearch });
  console.log({ countrySearch });
  console.log({ activitySearch });

  if (citySearch.length > 0) {
    console.log("city");

    try {
      await activityDetailsModel
        .aggregate([
          {
            $match: {
              isDeleted: false,
              status: true,
              cityId: new mongoose.Types.ObjectId(req.body.id),
              saveAsDraft: false,
            },
          },
          {
            $lookup: {
              from: "activitydetails",
              localField: "cityId",
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
                  $lookup: {
                    from: "categories",
                    localField: "categoryId",
                    foreignField: "_id",
                    as: "catDetails",
                  },
                },
                {
                  $unwind: {
                    path: "$catDetails",
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
                          activityDetailsId: 1,
                          avgRating: 1,
                        },
                      },
                    ],
                    as: "otherReview",
                  },
                },
                {
                  $addFields: {
                    reviewRating: { $sum: { $avg: "$otherReview.avgRating" } },
                  },
                },
                {
                  $addFields: {
                    totalReview: { $size: "$otherReview" },
                  },
                },

                // discount price and adult price in main list function start //
                {
                  $lookup: {
                    from: "specialoffers",
                    localField: "specialOfferId",
                    foreignField: "_id",
                    as: "offerDetails",
                  },
                },
                {
                  $unwind: {
                    path: "$offerDetails",
                    preserveNullAndEmptyArrays: true,
                  },
                },

                {
                  $addFields: {
                    activityActualAdultPrice: "$participentType",
                  },
                },
                {
                  $addFields: {
                    adultPrice: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$activityActualAdultPrice",
                            as: "priceItem",
                            cond: { $eq: ["$$priceItem.pertype", "Adult"] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                },
                {
                  $addFields: {
                    activityAdultPrice: "$adultPrice.price",
                  },
                },

                {
                  $addFields: {
                    duration: {
                      $ifNull: ["$offerDetails.duration", 0],
                    },
                  },
                },

                {
                  $addFields: {
                    durationInSeconds: {
                      $switch: {
                        branches: [
                          {
                            case: {
                              $eq: ["$offerDetails.duration.unit", "days"],
                            },
                            then: {
                              $multiply: [
                                "$offerDetails.duration.value",
                                24 * 60 * 60 * 1000,
                              ],
                            },
                          },
                          {
                            case: {
                              $eq: ["$offerDetails.duration.unit", "hours"],
                            },
                            then: {
                              $multiply: [
                                "$offerDetails.duration.value",
                                60 * 60 * 1000,
                              ],
                            },
                          },
                          {
                            case: {
                              $eq: ["$offerDetails.duration.unit", "minutes"],
                            },
                            then: {
                              $multiply: [
                                "$offerDetails.duration.value",
                                60 * 1000,
                              ],
                            },
                          },
                        ],
                        default: 0, // Default value if "unit" doesn't match any of the cases
                      },
                    },
                  },
                },
                {
                  $addFields: {
                    startDate: {
                      $cond: {
                        if: { $ne: ["$offerDetails.startDate", null] },
                        then: "$offerDetails.startDate", // Use offerDetails.startDate if available
                        else: new Date(), // Use the current date as a default if offerDetails.startDate is null
                      },
                    },
                  },
                },

                {
                  $addFields: {
                    endDate: {
                      $cond: {
                        if: { $ne: ["$offerDetails", null] }, // Check if offerDetails is not null
                        then: { $add: ["$startDate", "$durationInSeconds"] }, // Calculate endDate
                        else: null, // Set endDate to null if offerDetails is null
                      },
                    },
                  },
                },
                {
                  $addFields: {
                    discountPrice: {
                      $cond: {
                        if: {
                          $and: [
                            { $ne: ["$offerDetails", null] }, // Check if offerDetails is not null
                            { $gte: ["$endDate", new Date()] }, // Check if endDate is not over the current date
                          ],
                        },
                        then: "$offerDetails.discountPercentage", // Use discountPercentage if conditions are met
                        else: null, // Set discountPrice to null if conditions are not met
                      },
                    },
                  },
                },

                {
                  $addFields: {
                    activitydiscountedPrice: {
                      $cond: {
                        if: { $eq: ["$discountPrice", null] }, // Check if discountPrice is null
                        then: null, // Set activitydiscountedPrice to null if discountPrice is null
                        else: {
                          $multiply: [
                            "$activityAdultPrice",
                            { $divide: ["$discountPrice", 100] },
                          ],
                        },
                      },
                    },
                  },
                },

                // discount price and adult price in main list function End //

                {
                  $sort: {
                    topPriority: 1,
                  },
                },
                {
                  $limit: 8,
                },
                // {
                //   $lookup: {
                //     from: "wishlists",
                //     localField: "_id",
                //     foreignField: "activityId",
                //     as: "wishlistData",
                //   },
                // },
                // // {
                // //   $unwind: {
                // //     path: "$wishlistData",
                // //     preserveNullAndEmptyArrays: true,
                // //   },
                // // },
                // {
                //   $addFields: {
                //     isWishlist: {
                //       $cond: {
                //         if: { $gt: [{ $size: "$wishlistData" }, 0] },
                //         then: true,
                //         else: false,
                //       },
                //     },
                //   },
                // },
                {
                  $project: {
                    activityAdultPrice: 1,
                    discountPrice: 1,
                    activitydiscountedPrice: 1,

                    image: 1,
                    activityTitle: 1,
                    slug: 1,
                    description: 1,
                    activityActualPrice: 1,
                    tourDuration: 1,
                    catDetails: "$catDetails.categoryName",
                    reviewRating: 1,
                    totalReview: 1,
                    currency: 1,
                    // wishlistData: 1,
                    // isWishlist: 1,
                  },
                },
              ],
              as: "Top_activity",
            },
          },
          {
            $lookup: {
              from: "activitydetails",
              localField: "cityId",
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
                  $lookup: {
                    from: "categories",
                    localField: "categoryId",
                    foreignField: "_id",
                    as: "catDetails",
                  },
                },
                {
                  $unwind: {
                    path: "$catDetails",
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
                          activityDetailsId: 1,
                          avgRating: 1,
                        },
                      },
                    ],
                    as: "otherReview",
                  },
                },
                {
                  $addFields: {
                    reviewRating: { $sum: { $avg: "$otherReview.avgRating" } },
                  },
                },
                {
                  $addFields: {
                    totalReview: { $size: "$otherReview" },
                  },
                },

                // discount price and adult price in main list function End //

                {
                  $lookup: {
                    from: "specialoffers",
                    localField: "specialOfferId",
                    foreignField: "_id",
                    as: "offerDetails",
                  },
                },
                {
                  $unwind: {
                    path: "$offerDetails",
                    preserveNullAndEmptyArrays: true,
                  },
                },

                {
                  $addFields: {
                    activityActualAdultPrice: "$participentType",
                  },
                },
                {
                  $addFields: {
                    adultPrice: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$activityActualAdultPrice",
                            as: "priceItem",
                            cond: { $eq: ["$$priceItem.pertype", "Adult"] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                },
                {
                  $addFields: {
                    activityAdultPrice: "$adultPrice.price",
                  },
                },

                {
                  $addFields: {
                    duration: {
                      $ifNull: ["$offerDetails.duration", 0],
                    },
                  },
                },

                {
                  $addFields: {
                    durationInSeconds: {
                      $switch: {
                        branches: [
                          {
                            case: {
                              $eq: ["$offerDetails.duration.unit", "days"],
                            },
                            then: {
                              $multiply: [
                                "$offerDetails.duration.value",
                                24 * 60 * 60 * 1000,
                              ],
                            },
                          },
                          {
                            case: {
                              $eq: ["$offerDetails.duration.unit", "hours"],
                            },
                            then: {
                              $multiply: [
                                "$offerDetails.duration.value",
                                60 * 60 * 1000,
                              ],
                            },
                          },
                          {
                            case: {
                              $eq: ["$offerDetails.duration.unit", "minutes"],
                            },
                            then: {
                              $multiply: [
                                "$offerDetails.duration.value",
                                60 * 1000,
                              ],
                            },
                          },
                        ],
                        default: 0, // Default value if "unit" doesn't match any of the cases
                      },
                    },
                  },
                },
                {
                  $addFields: {
                    startDate: {
                      $cond: {
                        if: { $ne: ["$offerDetails.startDate", null] },
                        then: "$offerDetails.startDate", // Use offerDetails.startDate if available
                        else: new Date(), // Use the current date as a default if offerDetails.startDate is null
                      },
                    },
                  },
                },

                {
                  $addFields: {
                    endDate: {
                      $cond: {
                        if: { $ne: ["$offerDetails", null] }, // Check if offerDetails is not null
                        then: { $add: ["$startDate", "$durationInSeconds"] }, // Calculate endDate
                        else: null, // Set endDate to null if offerDetails is null
                      },
                    },
                  },
                },
                {
                  $addFields: {
                    discountPrice: {
                      $cond: {
                        if: {
                          $and: [
                            { $ne: ["$offerDetails", null] }, // Check if offerDetails is not null
                            { $gte: ["$endDate", new Date()] }, // Check if endDate is not over the current date
                          ],
                        },
                        then: "$offerDetails.discountPercentage", // Use discountPercentage if conditions are met
                        else: null, // Set discountPrice to null if conditions are not met
                      },
                    },
                  },
                },

                {
                  $addFields: {
                    activitydiscountedPrice: {
                      $cond: {
                        if: { $eq: ["$discountPrice", null] }, // Check if discountPrice is null
                        then: null, // Set activitydiscountedPrice to null if discountPrice is null
                        else: {
                          $multiply: [
                            "$activityAdultPrice",
                            { $divide: ["$discountPrice", 100] },
                          ],
                        },
                      },
                    },
                  },
                },

                // discount price and adult price in main list function End //

                // {
                //   $lookup: {
                //     from: "wishlists",
                //     localField: "_id",
                //     foreignField: "activityId",
                //     as: "wishlistData",
                //   },
                // },
                // // {
                // //   $unwind: {
                // //     path: "$wishlistData",
                // //     preserveNullAndEmptyArrays: true,
                // //   },
                // // },
                // {
                //   $addFields: {
                //     isWishlist: {
                //       $cond: {
                //         if: { $gt: [{ $size: "$wishlistData" }, 0] },
                //         then: true,
                //         else: false,
                //       },
                //     },
                //   },
                // },
                {
                  $project: {
                    activityAdultPrice: 1,
                    discountPrice: 1,
                    activitydiscountedPrice: 1,

                    image: 1,
                    activityTitle: 1,
                    slug: 1,
                    description: 1,
                    activityActualPrice: 1,
                    tourDuration: 1,
                    catDetails: "$catDetails.categoryName",
                    reviewRating: 1,
                    totalReview: 1,
                    // wishlistData: 1,
                    // isWishlist: 1,
                  },
                },
              ],
              as: "All_activity",
            },
          },

          {
            $project: {
              status: 0,
              isDeleted: 0,
              createdOn: 0,
              updatedOn: 0,
              __v: 0,
              countryId: 0,
            },
          },
        ])
        .then((data) => {
          res.status(ResponseCode.errorCode.success).json({
            status: true,
            message: "View all matched activity",
            data: data[0],
          });
        })
        .catch((error) => {
          console.log(error);
          const errors = DBerror(error);
          res.status(ResponseCode.errorCode.serverError).json({
            status: false,
            message: "Invalid id. Server error.",
            error: errors,
          });
        });
    } catch (error) {
      res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Invalid id. Server error.",
        error: error,
      });
    }
  } else {
    console.log("other");
    try {
      await activityDetailsModel
        .aggregate([
          {
            $match: {
              isDeleted: false,
              saveAsDraft: false,
              status: true,
              $or: [
                {
                  _id: new mongoose.Types.ObjectId(req.body.id),
                },

                {
                  countryId: new mongoose.Types.ObjectId(req.body.id),
                },

                {
                  activitySiteId: new mongoose.Types.ObjectId(req.body.id),
                },
              ],
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
                    categoryName: 1,
                  },
                },
              ],
              as: "categoryData",
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
              as: "reviewData",
            },
          },
          {
            $unwind: {
              path: "$categoryData",
              preserveNullAndEmptyArrays: true,
            },
          },
          // {
          //   $addFields: {
          //     review: { $sum: { $avg: "$reviewData.avgRating" } },
          //   },
          // },
          {
            $addFields: {
              reviewRating: { $sum: { $avg: "$reviewData.avgRating" } },
            },
          },
          {
            $addFields: {
              totalReview: { $size: "$reviewData" },
            },
          },
          // {
          //   $lookup: {
          //     from: "wishlists",
          //     localField: "_id",
          //     foreignField: "activityId",
          //     as: "wishlistData",
          //   },
          // },
          // // {
          // //   $unwind: {
          // //     path: "$wishlistData",
          // //     preserveNullAndEmptyArrays: true,
          // //   },
          // // },
          // {
          //   $addFields: {
          //     isWishlist: {
          //       $cond: {
          //         if: { $gt: ["$wishlistData.activityId", null] },
          //         then: true,
          //         else: false,
          //       },
          //     },
          //   },
          // },
          {
            $project: {
              activityTitle: 1,
              slug: 1,
              image: 1,
              tourDuration: 1,
              tourDuration: 1,
              duration: 1,
              categoryData: 1,
              review: 1,
              activityActualPrice: 1,
              activityDiscountPrice: 1,
              // wishlistData: 1,
              // isWishlist: 1,
              reviewRating: 1,
              totalReview: 1,
            },
          },
        ])
        .then((data) => {
          res.status(ResponseCode.errorCode.success).json({
            status: true,
            message: "View all matched activity",
            data: data,
          });
        })
        .catch((error) => {
          console.log(error);
          const errors = DBerror(error);
          res.status(ResponseCode.errorCode.serverError).json({
            status: false,
            message: "Invalid id. Server error.",
            error: errors,
          });
        });
    } catch (error) {
      res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Invalid id. Server error.",
        error: error,
      });
    }
  }
};

const HomePageSearchwithDate = async (req, res) => {
  var searchname = new RegExp(req.body.searchname, "i");
  const activitySearch = await activityDetailsModel
    .find({
      _id: new mongoose.Types.ObjectId(req.body.id),
    })
    .exec();
  const siteSearch = await activitySites
    .find({
      _id: new mongoose.Types.ObjectId(req.body.id),
    })
    .exec();

  const citySearch = await city
    .find({
      _id: new mongoose.Types.ObjectId(req.body.id),
    })
    .exec();
  const countrySearch = await Country.find({
    _id: new mongoose.Types.ObjectId(req.body.id),
  }).exec();
  console.log({ citySearch });
  console.log({ countrySearch });
  console.log({ activitySearch });

  if (citySearch.length > 0) {
    console.log("city");

    try {
      await activityDetailsModel
        .aggregate([
          {
            $match: {
              isDeleted: false,
              status: true,
              cityId: new mongoose.Types.ObjectId(req.body.id),
              isApproval: true,
              startDate: {
                $gte: moment.utc(req.body.startDate).startOf("date").toDate(),
                $lte: moment.utc(req.body.endDate).startOf("date").toDate(),
              },
            },
          },
          {
            $lookup: {
              from: "activitydetails",
              localField: "cityId",
              foreignField: "cityId",
              pipeline: [
                {
                  $match: {
                    isDeleted: false,
                    status: true,
                    isApproval: true,
                    startDate: {
                      $gte: moment
                        .utc(req.body.startDate)
                        .startOf("date")
                        .toDate(),
                      $lte: moment
                        .utc(req.body.endDate)
                        .startOf("date")
                        .toDate(),
                    },
                    // isApproval:true,
                    // startDate: {
                    //   $gte: req.body.startDate,
                    //   $lte: req.body.endDate,
                    // },
                  },
                },
                {
                  $lookup: {
                    from: "categories",
                    localField: "categoryId",
                    foreignField: "_id",
                    as: "catDetails",
                  },
                },
                {
                  $unwind: {
                    path: "$catDetails",
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
                          activityDetailsId: 1,
                          avgRating: 1,
                        },
                      },
                    ],
                    as: "otherReview",
                  },
                },
                {
                  $addFields: {
                    reviewRating: { $sum: { $avg: "$otherReview.avgRating" } },
                  },
                },
                {
                  $addFields: {
                    totalReview: { $size: "$otherReview" },
                  },
                },
                {
                  $sort: {
                    topPriority: 1,
                  },
                },
                {
                  $limit: 8,
                },

                {
                  $project: {
                    image: 1,
                    activityTitle: 1,
                    slug: 1,
                    description: 1,
                    activityActualPrice: 1,
                    tourDuration: 1,
                    catDetails: "$catDetails.categoryName",
                    reviewRating: 1,
                    totalReview: 1,
                    currency: 1,
                    startDate: 1,
                    endDate: 1,
                  },
                },
              ],
              as: "Top_activity",
            },
          },
          {
            $lookup: {
              from: "activitydetails",
              localField: "cityId",
              foreignField: "cityId",
              pipeline: [
                {
                  $match: {
                    isDeleted: false,
                    status: true,
                    // startDate: {
                    //   $gte: req.body.startDate,
                    //   $lte: req.body.endDate,
                    // },
                    // startDate: {
                    //   $gte: moment.utc(req.body.startDate).startOf("date").toDate(),
                    //   $lte: moment.utc(req.body.endDate).startOf("date").toDate()
                    // },
                  },
                },
                {
                  $lookup: {
                    from: "categories",
                    localField: "categoryId",
                    foreignField: "_id",
                    as: "catDetails",
                  },
                },
                {
                  $unwind: {
                    path: "$catDetails",
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
                          activityDetailsId: 1,
                          avgRating: 1,
                        },
                      },
                    ],
                    as: "otherReview",
                  },
                },
                {
                  $addFields: {
                    reviewRating: { $sum: { $avg: "$otherReview.avgRating" } },
                  },
                },
                {
                  $addFields: {
                    totalReview: { $size: "$otherReview" },
                  },
                },

                {
                  $project: {
                    image: 1,
                    activityTitle: 1,
                    slug: 1,
                    description: 1,
                    activityActualPrice: 1,
                    tourDuration: 1,
                    catDetails: "$catDetails.categoryName",
                    reviewRating: 1,
                    totalReview: 1,
                  },
                },
              ],
              as: "All_activity",
            },
          },

          {
            $project: {
              status: 0,
              isDeleted: 0,
              createdOn: 0,
              updatedOn: 0,
              __v: 0,
              countryId: 0,
            },
          },
        ])
        .then((data) => {
          console.log("data is====", data);
          res.status(ResponseCode.errorCode.success).json({
            status: true,
            message: "View all matched activity",
            data: data,
          });
        })
        .catch((error) => {
          console.log({ error });
          const errors = DBerror(error);
          res.status(ResponseCode.errorCode.serverError).json({
            status: false,
            message: "Invalid id. Server error.",
            error: error,
          });
        });
    } catch (error) {
      console.log({ error });
      res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Invalid id.. Server error.",
        error: error,
      });
    }
  } else {
    console.log("other");
    try {
      await activityDetailsModel
        .aggregate([
          {
            $match: {
              isDeleted: false,
              status: true,

              $or: [
                {
                  _id: new mongoose.Types.ObjectId(req.body.id),
                },

                {
                  countryId: new mongoose.Types.ObjectId(req.body.id),
                },

                {
                  activitySiteId: new mongoose.Types.ObjectId(req.body.id),
                },
              ],
              isApproval: true,
              startDate: {
                $gte: moment.utc(req.body.startDate).startOf("date").toDate(),
                $lte: moment.utc(req.body.endDate).startOf("date").toDate(),
              },
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
                    categoryName: 1,
                  },
                },
              ],
              as: "categoryData",
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
              as: "reviewData",
            },
          },
          {
            $unwind: {
              path: "$categoryData",
              preserveNullAndEmptyArrays: true,
            },
          },
          // {
          //   $addFields: {
          //     review: { $sum: { $avg: "$reviewData.avgRating" } },
          //   },
          // },
          {
            $addFields: {
              reviewRating: { $sum: { $avg: "$reviewData.avgRating" } },
            },
          },
          {
            $addFields: {
              totalReview: { $size: "$reviewData" },
            },
          },
          {
            $project: {
              activityTitle: 1,
              slug: 1,
              image: 1,
              tourDuration: 1,
              tourDuration: 1,
              duration: 1,
              categoryData: 1,
              review: 1,
              activityActualPrice: 1,
              activityDiscountPrice: 1,
              reviewRating: 1,
              totalReview: 1,
              startDate: 1,
              endDate: 1,
            },
          },
        ])
        .then((data) => {
          res.status(ResponseCode.errorCode.success).json({
            status: true,
            message: "View all matched activity",
            data: data,
          });
        })
        .catch((error) => {
          console.log({ error });
          const errors = DBerror(error);
          res.status(ResponseCode.errorCode.serverError).json({
            status: false,
            message: "Invalid. Server error.",
            error: errors,
          });
        });
    } catch (error) {
      console.log(error);
      res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Invalid Id. Server error.",
        error: error,
      });
    }
  }
};

const searchList1 = async (req, res) => {
  // var searchname = new RegExp(req.body.searchname, 'i');
  // const activitySearch = await activityDetailsModel
  //   .find(
  //     {
  //       activityTitle: {
  //         $regex: ".*" + req.body.searchname + ".*",
  //         $options: "i",
  //       },
  //       isApproval: true,
  //       isDeleted: false,
  //     },
  //     { activityTitle: 1, image: 1, slug: 1 }
  //   )
  //   .exec();

  const siteSearch = await activitySites
    .find(
      {
        siteName: {
          $regex: ".*" + req.body.searchname + ".*",
          $options: "i",
        },
      },
      { siteName: 1, image: 1 }
    )
    .exec();

  const citySearch = await city
    .find(
      {
        cityName: { $regex: ".*" + req.body.searchname + ".*", $options: "i" },
      },
      {
        cityName: 1,
        picture: 1,
      }
    )
    .exec();
  const countrySearch = await Country.find(
    { name: { $regex: ".*" + req.body.searchname + ".*", $options: "i" } },
    { name: 1, image: 1 }
  ).exec();
  console.log({ citySearch });
  console.log({ countrySearch });
  // console.log({ activitySearch });

  var cityAndCountry = [
    ...citySearch,
    ...countrySearch,
    // ...activitySearch,
    ...siteSearch,
  ];

  res.status(ResponseCode.errorCode.success).json({
    status: true,
    message: "View all matched list",
    data: cityAndCountry,
  });
};

const searchList = async (req, res) => {
  // var searchname = new RegExp(req.body.searchname, 'i');
  var activitySearch = [];
  const siteSearch = await activitySites
    .aggregate([
      {
        $match: {
          siteName: {
            $regex: ".*" + req.body.searchname + ".*",
            $options: "i",
          },
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: "cities",
          localField: "cityId",
          foreignField: "_id",
          pipeline: [
            {
              $match: {
                isDeleted: false,
              },
            },
            {
              $project: {
                cityName: 1,
                _id: 0,
              },
            },
          ],
          as: "city",
        },
      },
      { $unwind: { path: "$city", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          cityname: "$city.cityName",
        },
      },
      { $project: { siteName: 1, image: 1, cityname: 1 } },
    ])
    .exec();

  const citySearch = await city
    .aggregate([
      {
        $match: {
          cityName: {
            $regex: ".*" + req.body.searchname + ".*",
            $options: "i",
          },
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: "countries",
          localField: "countryId",
          foreignField: "_id",
          pipeline: [
            {
              $match: {
                isDeleted: false,
              },
            },
            {
              $project: {
                name: 1,
                _id: 0,
              },
            },
          ],
          as: "country",
        },
      },
      { $unwind: { path: "$country", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          countryname: "$country.name",
        },
      },
      {
        $project: {
          cityName: 1,
          picture: 1,
          countryname: 1,
        },
      },
    ])
    .exec();

  const countrySearch = await Country.aggregate([
    {
      $match: {
        name: { $regex: ".*" + req.body.searchname + ".*", $options: "i" },
        isDeleted: false,
      },
    },
    {
      $lookup: {
        from: "cities",
        localField: "_id",
        foreignField: "countryId",
        pipeline: [
          {
            $match: {
              isDeleted: false,
            },
          },
          {
            $project: {
              cityName: 1,
              _id: 0,
            },
          },
        ],
        as: "city",
      },
    },
    { $unwind: { path: "$city", preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        cityname: "$city.cityName",
      },
    },

    { $project: { name: 1, image: 1, cityname: 1 } },
  ]).exec();

  if (
    siteSearch.length == 0 &&
    citySearch.length == 0 &&
    countrySearch.length == 0
  ) {
    console.log("hiii");
    activitySearch = await activityDetailsModel
      .aggregate([
        {
          $match: {
            activityTitle: {
              $regex: ".*" + req.body.searchname + ".*",
              $options: "i",
            },
            isApproval: true,
            isDeleted: false,
          },
        },
        {
          $addFields: {
            images: { $arrayElemAt: ["$image", 0] },
          },
        },
        {
          $project: {
            activityTitle: 1,
            images: 1,
            slug: 1,
            destination: 1,
            activitySiteId: 1,
          },
        },
      ])
      .exec();
  }

  // console.log({ citySearch });
  // console.log({ countrySearch });
  // console.log({ siteSearch });

  var cityAndCountry = [
    ...citySearch,
    ...countrySearch,
    ...activitySearch,
    ...siteSearch,
  ];

  res.status(ResponseCode.errorCode.success).json({
    status: true,
    message: "View all matched list",
    data: cityAndCountry,
  });
};

const recommendedActivity = async (req, res) => {
  const allActivity = await UserBooking.find(
    { userId: req.user._id },
    { activityDetailsId: 1, _id: 0 }
  ).exec();

  const activities = await activityDetailsModel
    .find({
      _id: { $in: allActivity.map((ele) => ele.activityDetailsId) },
    })
    .exec();

  console.log({ activities });

  try {
    await activityDetailsModel
      .aggregate([
        {
          $match: {
            isDeleted: false,
            status: true,
            activityTypesId: {
              $in: activities.map((ele) => ele.activityTypesId),
            },
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
                  categoryName: 1,
                },
              },
            ],
            as: "categoryData",
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
            as: "reviewData",
          },
        },
        {
          $unwind: {
            path: "$categoryData",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            review: { $sum: { $avg: "$reviewData.avgRating" } },
          },
        },
        {
          $project: {
            activityTitle: 1,
            slug: 1,
            image: 1,
            tourDuration: 1,
            tourDuration: 1,
            duration: 1,
            categoryData: 1,
            review: 1,
            activityActualPrice: 1,
            activityDiscountPrice: 1,
          },
        },
      ])
      .then((data) => {
        res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "View all matched activity",
          data: data,
        });
      })
      .catch((error) => {
        console.log(error);
        const errors = DBerror(error);
        res.status(ResponseCode.errorCode.serverError).json({
          status: false,
          message: "Invalid id. Server error.",
          error: errors,
        });
      });
  } catch (error) {
    res.status(ResponseCode.errorCode.serverError).json({
      status: false,
      message: "Invalid id. Server error.",
      error: error,
    });
  }
};

const sitesAgainstActivity2 = async (req, res) => {
  // console.log("prrams are===others",req.params.tourid);

  try {
    var data = await city.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.params.cityId),
          isDeleted: false,
          status: true,
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
                // tourModuleId: new mongoose.Types.ObjectId(req.params.tourid),
                // activityTypesId: new mongoose.Types.ObjectId(req.params.activityTypeId),
                isDeleted: false,
              },
            },
            {
              $addFields: {
                activityActualAdultPrice: "$participentType",
              },
            },
            {
              $addFields: {
                StringCatID: { $toString: "$categoryId" },
              },
            },
            // {
            //   $addFields: {
            //     StringLanguage: { $toString: "$languageId" },
            //   },
            // },
            {
              $addFields: {
                StringDesti: { $toString: "$destination" },
              },
            },
            // {
            //   $addFields: {
            //     StringDura: { $toString: "$duration" },
            //   },
            // },

            {
              $addFields: {
                tourDuration: "$tourDuration",
              },
            },

            {
              $addFields: {
                tourDurationInSeconds: {
                  $switch: {
                    branches: [
                      {
                        case: { $eq: ["$tourDuration.unit", "days"] },
                        then: {
                          $multiply: [
                            "$tourDuration.value",
                            24 * 60 * 60 * 1000,
                          ],
                        },
                      },
                      {
                        case: { $eq: ["$tourDuration.unit", "hours"] },
                        then: {
                          $multiply: ["$tourDuration.value", 60 * 60 * 1000],
                        },
                      },
                      {
                        case: { $eq: ["$tourDuration.unit", "minutes"] },
                        then: { $multiply: ["$tourDuration.value", 60 * 1000] },
                      },
                    ],
                    default: 0, // Default value if "unit" doesn't match any of the cases
                  },
                },
              },
            },

            Array.isArray(req.body.duration) && req.body.duration.length > 0
              ? {
                $match: {
                  $or: req.body.duration
                    .map((duration) => {
                      switch (duration) {
                        case "0-3 hours":
                          return {
                            tourDurationInSeconds: {
                              $gt: 0,
                              $lte: 3 * 60 * 60 * 1000,
                            },
                          };
                        case "3-5 hours":
                          return {
                            tourDurationInSeconds: {
                              $gt: 3 * 60 * 60 * 1000,
                              $lte: 5 * 60 * 60 * 1000,
                            },
                          };
                        case "5-7 hours":
                          return {
                            tourDurationInSeconds: {
                              $gt: 5 * 60 * 60 * 1000,
                              $lte: 7 * 60 * 60 * 1000,
                            },
                          };
                        case "fullday":
                          return {
                            tourDurationInSeconds: {
                              $gt: 7 * 60 * 60 * 1000,
                              $lte: 24 * 60 * 60 * 1000,
                            },
                          };
                        case "multiday":
                          return {
                            tourDurationInSeconds: {
                              $gt: 24 * 60 * 60 * 1000,
                            },
                          };
                        default:
                          return null; // Handle unknown values
                      }
                    })
                    .filter((condition) => condition !== null), // Filter out null conditions
                },
              }
              : { $project: { __v: 0 } },

            // (req.body.minprice != "" &&
            //   typeof req.body.minprice != "undefined") ||
            //   (req.body.maxprice != "" && typeof req.body.maxprice != "undefined")
            //   ? {
            //     $match: {
            //       $expr: {
            //         $and: [
            //           {
            //             $gte: [
            //               "$activityActualPrice",
            //               Number(req.body.minprice),
            //             ],
            //           },
            //           {
            //             $lte: [
            //               "$activityActualPrice",
            //               Number(req.body.maxprice),
            //             ],
            //           },
            //         ],
            //       },
            //     },
            //   }

            //   : { $project: { __v: 0 } },

            // Array.isArray(req.body.language) && req.body.language.length > 0
            //   ? {
            //     $match: {
            //       StringLanguage: { $in: req.body.language },
            //     },
            //   }
            //   : { $project: { __v: 0 } },

            Array.isArray(req.body.catId) && req.body.catId.length > 0
              ? {
                $match: {
                  StringCatID: { $in: req.body.catId },
                },
              }
              : { $project: { __v: 0 } },

            Array.isArray(req.body.destination) &&
              req.body.destination.length > 0
              ? {
                $match: {
                  StringDesti: { $in: req.body.destination },
                },
              }
              : { $project: { __v: 0 } },

            // Array.isArray(req.body.duration) && req.body.duration > 0
            //   ? {
            //     $match: {
            //       StringDura: { $in: req.body.duration },
            //     },
            //   }
            //   : { $project: { __v: 0 } },

            // {
            //   $match: {
            //     $or: [
            //       {
            //         $and: [
            //           // { activityActualPrice: { $gte: req.body.minprice } },
            //           // { activityActualPrice: { $lte: req.body.maxprice } },
            //           {
            //             StringLanguage:{$in: req.body.language}
            //           },
            //           {StringCatID: {$in: req.body.catId}},
            //           {StringDesti: {$in: req.body.destination}},
            //           {StringDura: {$in: req.body.duration}},

            //         ],
            //       },

            //     ],
            //   },
            // },

            {
              $lookup: {
                from: "availabilities",
                localField: "_id",
                foreignField: "activityDetailsId",
                pipeline: [
                  req.body.time.length > 0 &&
                    typeof req.body.time != "undefined"
                    ? {
                      $match: {
                        shift: { $in: req.body.time },
                      },
                    }
                    : { $project: { __v: 0 } },

                  {
                    $project: {
                      shift: 1,
                      time: 1,
                      remeningUser: 1,
                    },
                  },
                ],
                as: "slottime",
              },
            },

            {
              $lookup: {
                from: "specialoffers",
                localField: "specialOfferId",
                foreignField: "_id",
                as: "offerDetails",
              },
            },
            {
              $unwind: {
                path: "$offerDetails",
                preserveNullAndEmptyArrays: true,
              },
            },

            {
              $addFields: {
                adultPrice: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$activityActualAdultPrice",
                        as: "priceItem",
                        cond: { $eq: ["$$priceItem.pertype", "Adult"] },
                      },
                    },
                    0,
                  ],
                },
              },
            },

            {
              $addFields: {
                activityAdultPrice: "$adultPrice.price",
              },
            },

            {
              $addFields: {
                duration: {
                  $ifNull: ["$offerDetails.duration", 0],
                },
              },
            },

            {
              $addFields: {
                durationInSeconds: {
                  $switch: {
                    branches: [
                      {
                        case: {
                          $eq: ["$offerDetails.duration.unit", "days"],
                        },
                        then: {
                          $multiply: [
                            "$offerDetails.duration.value",
                            24 * 60 * 60 * 1000,
                          ],
                        },
                      },
                      {
                        case: {
                          $eq: ["$offerDetails.duration.unit", "hours"],
                        },
                        then: {
                          $multiply: [
                            "$offerDetails.duration.value",
                            60 * 60 * 1000,
                          ],
                        },
                      },
                      {
                        case: {
                          $eq: ["$offerDetails.duration.unit", "minutes"],
                        },
                        then: {
                          $multiply: [
                            "$offerDetails.duration.value",
                            60 * 1000,
                          ],
                        },
                      },
                    ],
                    default: 0, // Default value if "unit" doesn't match any of the cases
                  },
                },
              },
            },
            {
              $addFields: {
                startDate: {
                  $cond: {
                    if: { $ne: ["$offerDetails.startDate", null] },
                    then: "$offerDetails.startDate", // Use offerDetails.startDate if available
                    else: new Date(), // Use the current date as a default if offerDetails.startDate is null
                  },
                },
              },
            },

            {
              $addFields: {
                endDate: {
                  $cond: {
                    if: { $ne: ["$offerDetails", null] }, // Check if offerDetails is not null
                    then: { $add: ["$startDate", "$durationInSeconds"] }, // Calculate endDate
                    else: null, // Set endDate to null if offerDetails is null
                  },
                },
              },
            },
            {
              $addFields: {
                discountPrice: {
                  $cond: {
                    if: {
                      $and: [
                        { $ne: ["$offerDetails", null] }, // Check if offerDetails is not null
                        { $gte: ["$endDate", new Date()] }, // Check if endDate is not over the current date
                      ],
                    },
                    then: "$offerDetails.discountPercentage", // Use discountPercentage if conditions are met
                    else: null, // Set discountPrice to null if conditions are not met
                  },
                },
              },
            },
            {
              $addFields: {
                activitydiscountedPrice: {
                  $cond: {
                    if: { $eq: ["$discountPrice", null] }, // Check if discountPrice is null
                    then: null, // Set activitydiscountedPrice to null if discountPrice is null
                    else: {
                      $multiply: [
                        "$activityAdultPrice",
                        { $divide: ["$discountPrice", 100] },
                      ],
                    },
                  },
                },
              },
            },

            // filtering by min and max price function start //
            {
              $addFields: {
                activityCurrentPrice: {
                  $subtract: [
                    "$activityAdultPrice",
                    "$activitydiscountedPrice",
                  ],
                },
              },
            },

            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $gte: [
                        {
                          $ifNull: [
                            "$activityCurrentPrice",
                            "$activityAdultPrice",
                          ],
                        },
                        Number(req.body.minprice),
                      ],
                    },
                    {
                      $lte: [
                        {
                          $ifNull: [
                            "$activityCurrentPrice",
                            "$activityAdultPrice",
                          ],
                        },
                        Number(req.body.maxprice),
                      ],
                    },
                  ],
                },
              },
            },
            {
              $project: { __v: 0 },
            },

            // filtering by min and max price function end //

            {
              $lookup: {
                from: "categories",
                localField: "categoryId",
                foreignField: "_id",

                as: "catDetails",
              },
            },
            {
              $unwind: {
                path: "$catDetails",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "languages",
                localField: "languageId",
                foreignField: "_id",
                as: "langDetails",
              },
            },
            {
              $unwind: {
                path: "$langDetails",
                preserveNullAndEmptyArrays: true,
              },
            },

            {
              $lookup: {
                from: "activitytypes",
                localField: "activityTypeId",
                foreignField: "_id",
                as: "activitytypeDetails",
              },
            },
            {
              $unwind: {
                path: "$activitytypeDetails",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "sections",
                localField: "sectionId",
                foreignField: "_id",
                as: "sectionsDetails",
              },
            },
            {
              $unwind: {
                path: "$sectionsDetails",
                preserveNullAndEmptyArrays: true,
              },
            },

            {
              $lookup: {
                from: "cities",
                localField: "cityId",
                foreignField: "_id",
                as: "citiDetails",
              },
            },
            {
              $unwind: {
                path: "$citiDetails",
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
                    $match: {
                      isDeleted: false,
                    },
                  },
                  {
                    $project: {
                      _id: 0,
                      avgRating: 1,
                    },
                  },
                ],
                as: "review",
              },
            },
            {
              $addFields: {
                reviewRating: {
                  $avg: "$review.avgRating",
                },
              },
            },

            typeof req.body.rating === "number"
              ? {
                $match: {
                  reviewRating: {
                    $gte: req.body.rating,
                    $lt: req.body.rating + 1,
                  },
                },
              }
              : { $project: { __v: 0 } },

            {
              $lookup: {
                from: "countries",
                localField: "countryId",
                foreignField: "_id",
                as: "country",
              },
            },
            {
              $unwind: { path: "$country", preserveNullAndEmptyArrays: true },
            },

            {
              $addFields: {
                // discountPercentage: "$offerDetails.discountPercentage",
                cityName: "$citiDetails.cityName",
                countryName: "$country.name",
                activitySiteName: "$activitysiteDetails.siteName",
                sectionTitle: "$sectionsDetails.sectionTitle",
                activitytypeName: "$activitytypeDetails.name",
                language: "$langDetails.name",
                languageId: "$langDetails._id",
                catDetails: "$catDetails.categoryName",
              },
            },
            {
              $project: {
                activityCurrentPrice: 1,
                reviewRating: 1,
                tourDuration: 1,
                tourDurationInSeconds: 1,
                // offerDetails: 1,
                // activityActualAdultPrice:1,
                // adultPrice:1,
                activityAdultPrice: 1,
                // startDate:1,
                // endDate: 1,
                discountPrice: 1,
                // duration:1,
                // durationInSeconds:1,
                activitydiscountedPrice: 1,
                slug: 1,
                activityTitle: 1,
                destination: 1,
                duration: 1,
                categoryId: 1,
                catId: 1,
                image: 1,
                catDetails: 1,
                activityActualPrice: 1,
                reviewRating: 1,
                // languageId: 1,
                slottime: 1,
                description: 1,
                totalReview: 1,
                StringCatID: 1,
                currency: 1,
                // review: 1
              },
            },
          ],

          as: "all_activity",
        },
      },
    ]);
    return data;
  } catch (error) {
    res.status(ResponseCode.errorCode.serverError).json({
      status: false,
      message: "Invalid id. Server error.",
      error: error,
    });
  }
};

const filterCityAgainstActivity = async (req, res) => {
  const allactivity = await sitesAgainstActivity2(req, res);
  if (req.body.noFilter == true) {
    res.status(ResponseCode.errorCode.success).json({
      status: true,
      message: "View sitesAgainstActivity Tours",
      data: allactivity,
    });
  } else {
    console.log("filtered", allactivity);

    allactivity.forEach((item) => {
      item.all_activity = item.all_activity.filter(
        (activity) => activity.slottime.length > 0
      );
    });

    res.status(ResponseCode.errorCode.success).json({
      status: true,
      message: "View cityAgainstActivity Tours",
      data: allactivity,
    });
  }
};

const reviewRating = async (req, res) => {
  await ReviewRating.aggregate([
    {
      $match: {
        activityDetailsId: new mongoose.Types.ObjectId(
          req.body.activityDetailsId
        ),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "reviewerData",
      },
    },
    {
      $unwind: {
        path: "$reviewerData",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        reviewerName: {
          $concat: ["$reviewerData.firstName", "", "$reviewerData.lastName"],
        },
      },
    },
    {
      $project: {
        createdOn: 0,
        updatedOn: 0,
        isDeleted: 0,
        status: 0,
        __v: 0,
        reviewerData: 0,
      },
    },
  ])
    .then((data) => {
      res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "View all data",
        data: data,
      });
    })
    .catch((error) => {
      res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error, Please try again leter",
        error: error,
      });
    });
};

const viewActivityWiseCityData = async (req, res) => {
  console.log(req.body.activityDatailsID);
  try {
    let matchCondition = "";

    // console.log(cityID)
    if (req.body.activityDatailsID) {
      let activity1 = await activityDetailsModel
        .findOne({
          isDeleted: false,
          _id: new mongoose.Types.ObjectId(req.body.activityDatailsID),
        })
        .exec();
      let cityID = activity1.cityId;
      matchCondition = {
        isDeleted: false,
        saveAsDraft: false,
        cityId: cityID,
        _id: { $ne: new mongoose.Types.ObjectId(req.body.activityDatailsID) },
        topPriority: { $gte: 1, $lte: 10 },
      };
    } else {
      matchCondition = {
        isDeleted: false,
        saveAsDraft: false,
        topPriority: { $gte: 1, $lte: 10 },
      };
    }

    let activity = await activityDetailsModel
      .aggregate([
        {
          $match:
            matchCondition

        },

        {
          $addFields: {
            activityActualAdultPrice: "$participentType",
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
                  activityDetailsId: 1,
                  avgRating: 1,
                },
              },
            ],
            as: "otherReview",
          },
        },
        {
          $addFields: {
            reviewRating: { $sum: { $avg: "$otherReview.avgRating" } },
          },
        },
        {
          $addFields: {
            totalReview: { $size: "$otherReview" },
          },
        },

        // for calculating adult price and discount price with respect of offer. function start //
        {
          $lookup: {
            from: "specialoffers",
            localField: "specialOfferId",
            foreignField: "_id",
            as: "offerDetails",
          },
        },
        {
          $unwind: {
            path: "$offerDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $addFields: {
            adultPrice: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: "$activityActualAdultPrice",
                    as: "priceItem",
                    cond: { $eq: ["$$priceItem.pertype", "Adult"] },
                  },
                },
                0,
              ],
            },
          },
        },

        {
          $addFields: {
            activityAdultPrice: "$adultPrice.price",
          },
        },

        {
          $addFields: {
            duration: {
              $ifNull: ["$offerDetails.duration", 0],
            },
          },
        },

        {
          $addFields: {
            durationInSeconds: {
              $switch: {
                branches: [
                  {
                    case: {
                      $eq: ["$offerDetails.duration.unit", "days"],
                    },
                    then: {
                      $multiply: [
                        "$offerDetails.duration.value",
                        24 * 60 * 60 * 1000,
                      ],
                    },
                  },
                  {
                    case: {
                      $eq: ["$offerDetails.duration.unit", "hours"],
                    },
                    then: {
                      $multiply: [
                        "$offerDetails.duration.value",
                        60 * 60 * 1000,
                      ],
                    },
                  },
                  {
                    case: {
                      $eq: ["$offerDetails.duration.unit", "minutes"],
                    },
                    then: {
                      $multiply: ["$offerDetails.duration.value", 60 * 1000],
                    },
                  },
                ],
                default: 0, // Default value if "unit" doesn't match any of the cases
              },
            },
          },
        },
        {
          $addFields: {
            startDate: {
              $cond: {
                if: { $ne: ["$offerDetails.startDate", null] },
                then: "$offerDetails.startDate", // Use offerDetails.startDate if available
                else: new Date(), // Use the current date as a default if offerDetails.startDate is null
              },
            },
          },
        },

        {
          $addFields: {
            endDate: {
              $cond: {
                if: { $ne: ["$offerDetails", null] }, // Check if offerDetails is not null
                then: { $add: ["$startDate", "$durationInSeconds"] }, // Calculate endDate
                else: null, // Set endDate to null if offerDetails is null
              },
            },
          },
        },
        {
          $addFields: {
            discountPrice: {
              $cond: {
                if: {
                  $and: [
                    { $ne: ["$offerDetails", null] }, // Check if offerDetails is not null
                    { $gte: ["$endDate", new Date()] }, // Check if endDate is not over the current date
                  ],
                },
                then: "$offerDetails.discountPercentage", // Use discountPercentage if conditions are met
                else: null, // Set discountPrice to null if conditions are not met
              },
            },
          },
        },
        {
          $addFields: {
            activitydiscountedPrice: {
              $cond: {
                if: { $eq: ["$discountPrice", null] }, // Check if discountPrice is null
                then: null, // Set activitydiscountedPrice to null if discountPrice is null
                else: {
                  $multiply: [
                    "$activityAdultPrice",
                    { $divide: ["$discountPrice", 100] },
                  ],
                },
              },
            },
          },
        },

        // for calculating adult price and discount price with respect of offer. function end //

        {
          $sort: {
            createdOn: -1,
          },
        },
      ])
      .limit(10);
    res.status(ResponseCode.errorCode.success).json({
      status: true,
      message: "View successfully",
      data: activity,
    });
  } catch (error) {
    console.log("error", error);
    res.status(ResponseCode.errorCode.serverError).json({
      status: false,
      message: "Server error !",
    });
  }
};

module.exports = {
  singleActivityDetails,
  viewActivityDetails,
  cityAgainstActivity,
  sitesAgainstActivity,
  sitesAgainstActivity1,
  filterSitesAgainstActivity,
  allCategory,
  allDestination,
  singleActivityDetailsUser,
  HomePageSearch,
  recommendedActivity,
  filterCityAgainstActivity,
  searchList,
  HomePageSearchAuth,
  HomePageSearchwithDate,
  reviewRating,
  viewActivityWiseCityData,
};
