const mongoose = require("mongoose");
const Country = require("../../Models/country");
const City = require("../../Models/city");
const TourModule = require("../../Models/tourModule");
const ActivityDetails = require("../../Models/activityDetails")
const SiteMap = require("../../Models/siteMaps")
const ResponseCode = require("../../service/responseCode");
const { DBerror, InputError } = require("../../service/errorHandeler");
const S3 = require("../../service/s3");

const countryImage = async (req, res) => {
  let countryimg = await S3.doUpload(req, "country/image");

  res.status(ResponseCode.errorCode.success).json({
    status: true,
    data: countryimg.url,
  });
};

const addCountry = async (req, res) => {
  var check = await Country.findOne({
    name: req.body.name,
    isDeleted: false,
  }).exec();

  if (check == "" || check == null) {
    var checkCity = Country.aggregate([
      {
        $match: {
          topPriority: req.body.topPriority,
          isDeleted: false,
        },
      },
    ])
      .then(async (data) => {
        if (data.length > 0) {
          var updateID = data[0]._id;

          var countryP = await Country.aggregate([
            {
              $match: {
                isDeleted: false,
              },
            },
            {
              $sort: {
                topPriority: -1,
              },
            },
            {
              $limit: 1,
            },
            {
              $project: {
                topPriority: 1,
              },
            },
          ]).exec();

          var priorityOld = countryP[0].topPriority;
          var priorityNew = priorityOld + 1;

          new Country({
            ...req.body,
          })
            .save()
            .then(async (result) => {
              await Country.findOneAndUpdate(
                { _id: { $in: [new mongoose.Types.ObjectId(updateID)] } },
                {
                  $set: {
                    topPriority: priorityNew,
                  },
                  updatedOn: new Date(),
                }
              ).exec();

              res.status(ResponseCode.errorCode.success).json({
                status: true,
                message: "New country added successfully",
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
        } else {
          new Country({
            ...req.body,
          })
            .save()
            .then((data) => {
              res.status(ResponseCode.errorCode.success).json({
                status: true,
                message: "New country added successfully",
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
        }
      })
      .catch((error) => { });
  } else {
    res.status(ResponseCode.errorCode.dataExist).json({
      status: false,
      message: "country already exist",
    });
  }
};

const viewCountry = async (req, res) => {
  Country.aggregate([
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
        __v: 0,
      },
    },
    {
      $sort: {
        _id: -1,
        createdOn: -1,
      },
    },
  ])
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Country list",
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

const editCountry = async (req, res) => {
  var check = await Country.findOne({
    name: req.body.name,
    _id: { $nin: [new mongoose.Types.ObjectId(req.params.id)] },
    isDeleted: false,
  }).exec();

  if (check) {
    res.status(ResponseCode.errorCode.dataExist).json({
      status: false,
      message: "country already exist",
    });
  } else {
    if (req.body.topPriority != undefined || req.body.topPriority != "") {
      var checkCountry = await Country.aggregate([
        {
          $match: {
            isDeleted: false,
            topPriority: req.body.topPriority,
          },
        },
      ])
        .then(async (data) => {
          if (data.length > 0) {
            var updateID = data[0]._id;

            var ownPriorityData = await Country.aggregate([
              {
                $match: {
                  _id: new mongoose.Types.ObjectId(req.params.id),
                },
              },
              {
                $project: {
                  topPriority: 1,
                },
              },
            ]).exec();

            var ownPriority = ownPriorityData[0].topPriority;

            await Country.findOneAndUpdate(
              {
                _id: new mongoose.Types.ObjectId(req.params.id),
              },
              {
                ...req.body,
              }
            )
              .then(async (data1) => {
                await Country.findOneAndUpdate(
                  {
                    _id: new mongoose.Types.ObjectId(updateID),
                  },
                  {
                    topPriority: ownPriority,
                  }
                ).exec();

                res.status(ResponseCode.errorCode.success).json({
                  status: true,
                  message: "Country update successfully",
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
          } else {
            await Country.findOneAndUpdate(
              {
                _id: new mongoose.Types.ObjectId(req.params.id),
              },
              {
                ...req.body,
              }
            )
              .then((data) => {
                res.status(ResponseCode.errorCode.success).json({
                  status: true,
                  message: "Country update successfully",
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
          }
        })
        .catch((error) => {
          const errors = DBerror(error);
          res.status(ResponseCode.errorCode.serverError).json({
            status: false,
            message: "Server error,Please try again",
            error: errors,
          });
        });
    } else {
      await Country.findOneAndUpdate(
        {
          _id: new mongoose.Types.ObjectId(req.params.id),
        },
        {
          ...req.body,
        }
      )
        .then((data) => {
          res.status(ResponseCode.errorCode.success).json({
            status: true,
            message: "Country update successfully",
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
    }
  }
};

const deleteCountry = async (req, res) => {


  var check = await City.find({ countryId: new mongoose.Types.ObjectId(req.params.id) });
  var check1 = await TourModule.find({ countryId: new mongoose.Types.ObjectId(req.params.id) });
  var check2 = await ActivityDetails.find({ countryId: new mongoose.Types.ObjectId(req.params.id) });
  var check3 = await SiteMap.find({ countryId: new mongoose.Types.ObjectId(req.params.id) });

  // console.log("check", check1)

  if (check.length > 0 && check1.length > 0 && check2.length > 0 && check3.length > 0) {

    return res.status(ResponseCode.errorCode.dataNotmatch).json({
      status: false,
      message: "You have to delete this from other areas first",
    });

  } else {

    await Country.findOneAndUpdate(
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
          message: "Country delete successfully",
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
module.exports = {
  countryImage,
  addCountry,
  viewCountry,
  editCountry,
  deleteCountry,
};
