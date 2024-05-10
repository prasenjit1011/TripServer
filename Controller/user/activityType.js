const mongoose = require("mongoose");
const ActivityType = require("../../Models/activityType");
const ActivityDetails = require("../../Models/activityDetails");
const Section = require("../../Models/section");
const ResponseCode = require("../../service/responseCode");
const { Validator } = require("node-input-validator");
const { DBerror, InputError } = require("../../service/errorHandeler");
var moment = require("moment");


const viewActivityType = async (req, res) => {
  await ActivityType.aggregate([
    {
      $match: {
        isDeleted: false,
        status: true,
      },
    },
    {
      $project: {
        createdOn: 0,
        updatedOn: 0,
        isDeleted: 0,
        __v: 0,
      },
    },
  ])
    .then((data) => {
      res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Activity type list",
        data: data,
      });
    })
    .catch((error) => {
      const errors = DBerror(error);
      res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error,Please try again",
        error: errors,
      });
    });
};

const viewActivityTypeWise = async (req, res) => {
  await Section.aggregate([
    {
      $match: {
        isDeleted: false,
        status: true,
        activityTypeId: new mongoose.Types.ObjectId(req.params.id),
        //subType: "activities",
      },
    },
    {
      $lookup: {
        from: "activitydetails",
        localField: "activityTypeId",
        foreignField: "activityTypesId",
        pipeline: [
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
              from: "specialoffers",
              localField: "specialOfferId",
              foreignField: "_id",
              pipeline:[
                {
                  $match:{
                    endDate: {
                      $gte: moment.utc(new Date()).startOf("date").toDate(),
                    },
                }
              }
              ],
              as: "offerDetails",
            },
          },
          {
            $unwind: { path: "$offerDetails", preserveNullAndEmptyArrays: true },
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
              totalReview: { $size: "$reviewData" },
            },
          },
          {
            $addFields: {
               activityActualAdultPrice: "$participentType" 
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
                      cond: { $eq: ["$$priceItem.pertype", "Adult"] }
                    }
                  },
                  0
                ]
              }
            }
          },
          {
            $addFields: {
              activityAdultPrice: "$adultPrice.price"
            }
          },
          {
            $addFields:{
              discountPrice: "$offerDetails.discountPercentage"
            }
          },
          {
            $addFields: {
              activitydiscountedPrice: {
                $multiply: ["$activityAdultPrice", { $divide: ["$discountPrice", 100] }]
              }
            }
          },
          {
            $sort: {
              topPriority: 1,
            },
          },
          {$match: { isApproval: true, saveAsDraft:false, status:true, isDeleted:false}},
          {
            $limit: 8,
          },
          {
            $project: {
              activityTitle: 1,
              slug: 1,
              topPriority: 1,
              image: 1,
              currency: 1,
              tourDuration: 1,
              tourDuration: 1,
              duration: 1,
              categoryData: 1,
              review: 1,
              activityActualPrice: 1,
              activityDiscountPrice: 1,
              activityAdultPrice: 1,
              activitydiscountedPrice:1,
              totalReview: 1,
              section: 1,
              offerDetails:1
            
            },
          },
        ],
        as: "activities",
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
        message: "Get all the data krishna",
        data: data[0],
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

const viewActivityTypeWiseNew = async (req, res) => {
  await ActivityDetails.aggregate([
    {
      $match: {
        isDeleted: false,
        status: true,
        activityTypesId: new mongoose.Types.ObjectId(req.params.id),
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
        from: "wishlists",
        localField: "_id",
        foreignField: "activityId",
        pipeline: [
          // {
          //   $lookup: {
          //     from: "wishlistfolders",
          //     localField: "folderId",
          //     foreignField: "_id",
          //     as: "folder"
          //   }
          // },
          // {
          //   $project: {
          //   },
          // },
        ],
        as: "wishlist",
      },
    },
    {
      $unwind: {
        path: "$wishlist",
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
        totalReview: { $size: "$reviewData" },
        isWishlist: {
          $cond: {
            if: { $gt: ["$wishlist.activityId", null] },
            then: true,
            else: false,
          },
        },
      },
    },
    // {
    //   $addFields: {
    //     Iswishlist: {
    //       $cond: {
    //         if: { $gt: [{ $size: "$wishlist" }, 0] },
    //         then: true,
    //         else: false,
    //       },
    //     },
    //   },
    // },

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
        activityTitle: 1,
        slug: 1,
        topPriority: 1,
        image: 1,
        currency: 1,
        tourDuration: 1,
        tourDuration: 1,
        duration: 1,
        categoryData: 1,
        review: 1,
        activityActualPrice: 1,
        activityDiscountPrice: 1,
        totalReview: 1,
        wishlist: 1,
        isWishlist: 1,
      },
    },
  ])
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Get all the data",
        data: data,
      });
    })
    .catch((error) => {
      console.log("error", error);
      const errors = DBerror(error);
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error,Please try again",
        error: errors,
      });
    });
};

const viewActivityTypeWiseWithToken = async (req, res) => {
  await Section.aggregate([
    {
      $match: {
        isDeleted: false,
        status: true,
        activityTypeId: new mongoose.Types.ObjectId(req.params.id),
        //subType: "activities",
      },
    },

    {
      $lookup: {
        from: "activitydetails",
        localField: "activityTypeId",
        foreignField: "activityTypesId",
        pipeline: [
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
              from: "specialoffers",
              localField: "specialOfferId",
              foreignField: "_id",
              pipeline:[
                {
                  $match:{
                    endDate: {
                      $gte: moment.utc(new Date()).startOf("date").toDate(),
                    },
                }
              }
             
              ],
              as: "offerDetails",
            },
          },
          {
            $unwind: { path: "$offerDetails", preserveNullAndEmptyArrays: true },
          },

          {
            $lookup: {
              from: "wishlists",
              localField: "_id",
              foreignField: "activityId",
              pipeline: [
                {
                  $match: {
                    userId: new mongoose.Types.ObjectId(req.user._id),
                  },
                },
                {
                  $lookup: {
                    from: "wishlistfolders",
                    localField: "folderId",
                    foreignField: "_id",

                    as: "folder",
                  },
                },
                {
                  $unwind: "$folder",
                },
              ],
              as: "wishlist",
            },
          },
          {
            $unwind: {
              path: "$wishlist",
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
              totalReview: { $size: "$reviewData" },
              isWishlist: {
                $cond: {
                  if: { $gt: ["$wishlist.activityId", null] },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $addFields: {
               activityActualAdultPrice: "$participentType" 
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
                      cond: { $eq: ["$$priceItem.pertype", "Adult"] }
                    }
                  },
                  0
                ]
              }
            }
          },
          {
            $addFields: {
              activityAdultPrice: "$adultPrice.price"
            }
          },
          {
            $addFields:{
              discountPrice: "$offerDetails.discountPercentage"
            }
          },
          {
            $addFields: {
              activitydiscountedPrice: {
                $multiply: ["$activityAdultPrice", { $divide: ["$discountPrice", 100] }]
              }
            }
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
              status:1,
              activityTitle: 1,
              slug: 1,
              topPriority: 1,
              image: 1,
              currency: 1,
              tourDuration: 1,
              duration: 1,
              categoryData: 1,
              review: 1,
              activityActualPrice: 1,
              activityDiscountPrice: 1,
              activityAdultPrice: 1,
              activitydiscountedPrice:1,
              totalReview: 1,
              wishlist: 1,
              isWishlist: 1,
              offerDetails:1
            },
          },
        ],
        as: "activities",
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
        message: "Get all the data",
        data: data[0],
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

const viewActivityCityWise = async (req, res) => {
  await Section.aggregate([
    {
      $match: {
        isDeleted: false,
        status: true,
        activityTypeId: new mongoose.Types.ObjectId(req.params.id),
        subType: "cities",
      },
    },

    {
      $lookup: {
        from: "activitydetails",
        localField: "activityTypeId",
        foreignField: "activityTypesId",
        pipeline: [
          { $group: { _id: "$cityId" } },
          {
            $lookup: {
              from: "cities",
              localField: "_id",
              foreignField: "_id",
              pipeline: [
                {
                  $match: {
                    isDeleted: false,
                  },
                },
                {
                  $project: {
                    createdOn: 0,
                    updatedOn: 0,
                    isDeleted: 0,
                    status: 0,
                  },
                },
              ],
              as: "cityData",
            },
          },
          {
            $unwind: {
              path: "$cityData",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              _id: 1,
              cityData: 1,
            },
          },
          {
            $sort: {
              createdOn: -1,
            },
          },
          {
            $limit: 8,
          },
        ],
        as: "cities",
      },
    },
  ])
    .then((data) => {
      res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Get all the data",
        data: data[0] ? data[0] : {},
      });
    })
    .catch((error) => {
      const errors = DBerror(error);
      res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error,Please try again",
        error: errors,
      });
    });
};

const viewActivitySiteWise = async (req, res) => {
  await Section.aggregate([
    {
      $match: {
        isDeleted: false,
        status: true,
        activityTypeId: new mongoose.Types.ObjectId(req.params.id),
        subType: "sights",
      },
    },

    {
      $lookup: {
        from: "activitydetails",
        localField: "activityTypeId",
        foreignField: "activityTypesId",
        pipeline: [
          { $group: { _id: "$activitySiteId" } },
          {
            $lookup: {
              from: "activitysites",
              localField: "_id",
              foreignField: "_id",
              pipeline: [
                {
                  $match: {
                    isDeleted: false,
                  },
                },
                {
                  $project: {
                    createdOn: 0,
                    updatedOn: 0,
                    isDeleted: 0,
                    status: 0,
                    // _id: 0,
                    __v: 0,
                  },
                },
              ],
              as: "siteData",
            },
          },
          {
            $unwind: {
              path: "$siteData",
              preserveNullAndEmptyArrays: true,
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
                    // isDeleted: false,
                    activityTypesId: new mongoose.Types.ObjectId(req.params.id),
                  },
                },
              ],
              as: "totalActivityData",
            },
          },
          {
            $addFields: {
              activityCount: { $size: "$totalActivityData" },
            },
          },
          {
            $project: {
              _id: 1,
              siteData: 1,
              activityCount: 1,
            },
          },
          {
            $sort: {
              createdOn: -1,
            },
          },
          {
            $limit: 10,
          },
        ],
        as: "activities",
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
      res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Get all the data",
        data: data[0] ? data[0] : {},
      });
    })
    .catch((error) => {
      const errors = DBerror(error);
      res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error,Please try again",
        error: errors,
      });
    });
};

module.exports = {
  viewActivityType,
  viewActivityTypeWise,
  viewActivityCityWise,
  viewActivitySiteWise,
  viewActivityTypeWiseWithToken,
  viewActivityTypeWiseNew,
};
