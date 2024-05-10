const mongoose = require("mongoose");
const Wishlist = require("../../Models/wishlist");
const WishlistFolder = require("../../Models/wishlistFolder");
const ResponseCode = require("../../service/responseCode");
const { DBerror, InputError } = require("../../service/errorHandeler");

const addFolder = async (req, res) => {
  var check = await WishlistFolder.find({
    folderName: req.body.folderName,
    userId: req.user._id,
  }).exec();

  if (check.length > 0) {
    return res.status(ResponseCode.errorCode.dataExist).json({
      status: false,
      message: "Folder name already exist",
    });
  } else {
    new WishlistFolder({
      userId: req.user._id,
      ...req.body,
      createdOn: new Date(),
    }).save();

    return res.status(ResponseCode.errorCode.success).json({
      status: true,
      message: "Folder created",
    });
  }
};

const viewAllFolder = async (req, res) => {
  await WishlistFolder.aggregate([
    {
      $match: {
        userId: req.user._id,
        isDeleted: false,
      },
    },
    {
      $lookup: {
        from: "wishlists",
        localField: "_id",
        foreignField: "folderId",
        pipeline: [
          {
            $sort: {
              createdOn: -1,
            },
          },

          {
            $limit: 1,
          },
          {
            $lookup: {
              from: "activitydetails",
              localField: "activityId",
              foreignField: "_id",
              pipeline: [
                {
                  $project: {
                    image: { $arrayElemAt: ["$image", 0] },
                  },
                },
              ],
              as: "activity_details",
            },
          },

          {
            $unwind: "$activity_details",
          },

          {
            $project: {
              activity_details: 1,

            },
          },
        ],
        as: "wishlistData",
      },
    },
    {
      $addFields: {
        totalActivity: { $size: "$wishlistData" },
      },
    },
    {
      $unwind: {
        path: "$wishlistData",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        image: "$wishlistData.activity_details.image",

      },
    },

    {
      $lookup: {
        from: "wishlists",
        localField: "_id",
        foreignField: "folderId",
        pipeline: [

          {
            $lookup: {
              from: "activitydetails",
              localField: "activityId",
              foreignField: "_id",
              pipeline: [
                {
                  $project: {
                    image: { $arrayElemAt: ["$image", 0] },
                  },
                },
              ],
              as: "activity_details",
            },
          },

          {
            $unwind: "$activity_details",
          },

          {
            $project: {
              activity_details: 1,

            },
          },
        ],
        as: "totalWishlist",
      },
    },
    {
      $addFields: {
        totalActivity: { $size: "$totalWishlist" }
      }
    },
    {
      $project: {
        folderName: 1,
        image: 1,
        totalActivity: 1
      },
    },
  ])
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "view all folder",
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

const viewYourWishlist = async (req, res) => {
  await WishlistFolder.aggregate([
    {
      $match: {
        userId: req.user._id,
        isDeleted: false,
      },
    },
    {
      $group: { _id: "$_id" },
    },
    {
      $lookup: {
        from: "wishlistfolders",
        localField: "_id",
        foreignField: "_id",
        pipeline: [
          {
            $lookup: {
              from: "wishlists",
              localField: "_id",
              foreignField: "folderId",
              pipeline: [
                {
                  $lookup: {
                    from: "activitydetails",
                    localField: "activityId",
                    foreignField: "_id",
                    pipeline: [
                      {
                        $project: {
                          image: { $arrayElemAt: ["$image", 0] },
                        },
                      },
                    ],
                    as: "activity_details",
                  },
                },
                {
                  $unwind: "$activity_details",
                },
                {
                  $project: {
                    activity_details: 1,
                  },
                },
              ],
              as: "wishlist",
            },
          },
          {
            $addFields: {
              totalActivity: { $size: "$wishlist" },
            },
          },
          {
            $project: {
              userId: 0,
              isDeleted: 0,
              createdOn: 0,
              updatedOn: 0,
              __v: 0,
            },
          },
        ],

        as: "folder",
      },
    },
    { $unwind: { path: "$folder", preserveNullAndEmptyArrays: true } },

    {
      $project: {
        _id: 0,
      },
    },
  ])
    .then((data) => {
      for (let i in data) {
        console.log(i);

        data[i] = data[i].folder;
      }

      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "view all folder",
        data: data,
      });
    })
    .catch((error) => {
      console.log(error);
      const errors = DBerror(error);
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error,Please try again",
        error: errors,
      });
    });
};

const deleteFolder = async (req, res) => {
  WishlistFolder.deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id) })
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Folder deleted",
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

const addToWishlist = async (req, res) => {
  var check = await Wishlist.find({
    userId: req.user._id,
    activityId: new mongoose.Types.ObjectId(req.body.activityId),
    folderId: new mongoose.Types.ObjectId(req.body.folderId),
  }).exec();

  if (check.length > 0) {
    var folderCheck = await Wishlist.find({
      userId: req.user._id,
      folderId: new mongoose.Types.ObjectId(req.body.folderId),
    });

    if (folderCheck.length == 1) {
      WishlistFolder.deleteOne({
        _id: new mongoose.Types.ObjectId(req.body.folderId),
      }).exec();
    }

    Wishlist.deleteOne({
      userId: req.user._id,
      activityId: new mongoose.Types.ObjectId(req.body.activityId),
      folderId: new mongoose.Types.ObjectId(req.body.folderId),
    }).exec();

    return res.status(ResponseCode.errorCode.success).json({
      status: true,
      message: "Data deleted from wishlist",
    });
  } else {
    var checkWishlist = await Wishlist.find({
      userId: req.user._id,
      activityId: new mongoose.Types.ObjectId(req.body.activityId),
      folderId: new mongoose.Types.ObjectId(req.body.folderId),
    }).exec();

    // if(checkWishlist.length > 0){
    //   res.status(ResponseCode.errorCode.dataExist).json({
    //     status: false,
    //     message: "Already in wishlist"
    //   })
    // } else {
    new Wishlist({
      activityId: new mongoose.Types.ObjectId(req.body.activityId),
      folderId: new mongoose.Types.ObjectId(req.body.folderId),
      userId: req.user._id,
    })
      .save()
      .then((data) => {
        return res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "Data added to wishlist",
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

  // }
};

const SingleFolderWishlist = async (req, res) => {
  WishlistFolder.aggregate([
    {
      $match: {
        userId: req.user._id,
        _id: new mongoose.Types.ObjectId(req.params.fid),
      },
    },
    {
      $lookup: {
        from: "wishlists",
        localField: "_id",
        foreignField: "folderId",
        pipeline: [
          {
            $match: {
              pastWishlist: false
            }
          },
          {
            $lookup: {
              from: "activitydetails",
              localField: "activityId",
              foreignField: "_id",
              pipeline: [
                {
                  $lookup: {
                    from: "categories",
                    localField: "categoryId",
                    foreignField: "_id",
                    as: "category",
                  },
                },
                {
                  $unwind: "$category",
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
                    activityActualAdultPrice: "$participentType"
                  }
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



                {
                  $project: {
                    // offerDetails: 1,
                    // activityActualAdultPrice:1,
                    // adultPrice:1,
                    activityAdultPrice: 1,
                    startDate:1,
                    endDate: 1,
                    discountPrice: 1,
                    // duration:1,
                    // durationInSeconds:1,
                    activitydiscountedPrice: 1,
                    category: "$category.categoryName",
                    activityTitle: 1,
                    currency: 1,
                    tourDuration: 1,
                    specialOfferId: 1,
                    activityActualPrice: 1,
                    slug: 1,
                    image: { $arrayElemAt: ["$image", 0] },
                    reviewRating: 1,
                    totalReview: 1


                  },
                },
              ],
              as: "activity_details",
            },
          },
          {
            $unwind: "$activity_details",
          },
          {
            $project: {
              activity_details: 1,
              _id: 0,
            },
          },
        ],
        as: "wishlist",
      },
    },
    // {
    //   $unwind: "$folder",
    // },

    {
      $project: {
        folderName: 1,
        wishlist: 1,
      },
    },
  ])
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "view wishlist",
        data: data[0] ?? 0,
        totalActivity: data[0]?.wishlist.length > 0 ? data[0].wishlist.length : 0

      });
    })
    .catch((error) => {
      console.log(error);
      const errors = DBerror(error);
      console.log(errors);

      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error,Please try again",
        error: errors,
      });
    });
};

const deleteWishListActivity = async (req, res) => {
  Wishlist.deleteOne({
    activityId: new mongoose.Types.ObjectId(req.params.id),
    userId: req.user._id,
  })
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Activity is deleted from wishlist",
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
const viewAllPastWishlist = async (req, res) => {
  Wishlist.aggregate([
    {
      $match: {
        userId: req.user._id,
        pastWishlist: true
      },
    },
    {
      $lookup: {
        from: "activitydetails",
        localField: "activityId",
        foreignField: "_id",
        pipeline: [
          {
            $lookup: {
              from: "categories",
              localField: "categoryId",
              foreignField: "_id",
              as: "category",
            },
          },
          {
            $unwind: "$category",
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
              category: "$category.categoryName",
              activityTitle: 1,
              currency: 1,
              tourDuration: 1,
              specialOfferId: 1,
              activityActualPrice: 1,
              slug: 1,
              image: { $arrayElemAt: ["$image", 0] },
              reviewRating: 1,
              totalReview: 1


            },
          },
        ],
        as: "activity_details",
      },
    },
    {
      $unwind: "$activity_details",
    },
    {
      $project: {
        activity_details: 1,
        _id: 0,
      },
    },


  ])
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "view all past wishlist",
        data: data ?? 0,


      });
    })
    .catch((error) => {
      console.log(error);
      const errors = DBerror(error);
      console.log(errors);

      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error,Please try again",
        error: errors,
      });
    });
};



module.exports = {
  addToWishlist,
  SingleFolderWishlist,
  addFolder,
  viewAllFolder,
  deleteFolder,
  viewYourWishlist,
  deleteWishListActivity,
  viewAllPastWishlist
};
