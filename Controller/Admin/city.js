const mongoose = require("mongoose");
const cityModel = require("../../Models/city");
const zipcode = require("../../Models/zipcode");
const TourModule = require("../../Models/tourModule");
const ActivityDetails = require("../../Models/activityDetails")
const ActivitySite = require("../../Models/activitySite")
const ResponseCode = require("../../service/responseCode");
const { Validator } = require("node-input-validator");
const { DBerror, InputError } = require("../../service/errorHandeler");
const S3 = require("../../service/s3");
const City = require("../../Models/city");
const SiteMap = require("../../Models/siteMaps")

const cityImage = async (req, res) => {
  let cityimg = await S3.doUpload(req, "city/image");

  res.status(ResponseCode.errorCode.success).json({
    status: true,
    data: cityimg.url,
  });
};

const addCity = async (req, res) => {
  const v = new Validator(req.body, {
    cityName: "required",
  });
  let matched = await v.check().then((val) => val);
  if (!matched) {
    return res.status(200).send({
      status: false,
      error: v.errors,
      message: InputError(v.errors),
    });
  }

  var check = cityModel
    .aggregate([
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

        var cityP = await cityModel
          .aggregate([
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
          ])
          .exec();

        var priorityOld = cityP[0].topPriority;
        var priorityNew = priorityOld + 1;

        const cityData = {
          ...req.body,
        };
        new cityModel(cityData)
          .save()
          .then(async (result) => {
            await cityModel
              .findOneAndUpdate(
                { _id: { $in: [new mongoose.Types.ObjectId(updateID)] } },
                {
                  $set: {
                    topPriority: priorityNew,
                  },
                  updatedOn: new Date(),
                }
              )
              .exec();

            res.status(ResponseCode.errorCode.success).json({
              status: true,
              message: "City added successfully",
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
        const cityData = {
          ...req.body,
        };
        new cityModel(cityData)
          .save()
          .then((result1) => {
            res.status(ResponseCode.errorCode.success).json({
              status: true,
              message: "City added successfully",
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
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error,Please try again",
        error: errors,
      });
    });
};

const viewCity = async (req, res) => {
  await cityModel
    .aggregate([
      {
        $match: {
          isDeleted: false,
          status: true,
        },
      },
      {
        $lookup: {
          from: "countries",
          localField: "countryId",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                name: 1,
              },
            },
          ],
          as: "countryDetails",
        },
      },
      {
        $unwind: { path: "$countryDetails", preserveNullAndEmptyArrays: true },
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

const editCity = async (req, res) => {
  if (req.body.topPriority != undefined && req.body.topPriority != "") {
    var check = await cityModel
      .aggregate([
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

          var ownPriorityData = await cityModel
            .aggregate([
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
            ])
            .exec();

          var ownPriority = ownPriorityData[0].topPriority;

          await cityModel
            .findOneAndUpdate(
              {
                _id: new mongoose.Types.ObjectId(req.params.id),
              },
              {
                ...req.body,
              }
            )
            .then(async (data1) => {
              await cityModel
                .findOneAndUpdate(
                  {
                    _id: new mongoose.Types.ObjectId(updateID),
                  },
                  {
                    topPriority: ownPriority,
                  }
                )
                .exec();

              res.status(ResponseCode.errorCode.success).json({
                status: true,
                message: "City update successfully",
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
        } else {
          await cityModel
            .findOneAndUpdate(
              {
                _id: new mongoose.Types.ObjectId(req.params.id),
              },
              {
                ...req.body,
              }
            )
            .then((data2) => {
              res.status(ResponseCode.errorCode.success).json({
                status: true,
                message: "City update successfully",
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
      });
  } else {
    await cityModel
      .findOneAndUpdate(
        {
          _id: new mongoose.Types.ObjectId(req.params.id),
        },
        {
          ...req.body,
        }
      )
      .then((data) => {
        return res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "City update successfully",
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

const deleteCity = async (req, res) => {

  var check = await City.find({ cityId: new mongoose.Types.ObjectId(req.params.id) });
  var check1 = await TourModule.find({ cityId: new mongoose.Types.ObjectId(req.params.id) });
  var check2 = await ActivityDetails.find({ cityId: new mongoose.Types.ObjectId(req.params.id) });
  var check3 = await SiteMap.find({ cityId: new mongoose.Types.ObjectId(req.params.id) });

  if (check.length > 0 && check1.length > 0 && check2.length > 0 && check3.length > 0) {

    return res.status(ResponseCode.errorCode.dataNotmatch).json({
      status: false,
      message: "You have to delete this from other areas first",
    });

  } else {
    await cityModel
      .findOneAndUpdate(
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
          message: "City delete successfully",
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

const viewCountryAgainstCity = async (req, res) => {
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
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "City list",
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

const addZipcode = async (req, res) => {
  const v = new Validator(req.body, {
    zipCode: "required",
  });
  let matched = await v.check().then((val) => val);
  if (!matched) {
    return res.status(200).send({
      status: false,
      error: v.errors,
      message: InputError(v.errors),
    });
  }

  const cityData = {
    ...req.body,
  };
  new zipcode(cityData)
    .save()
    .then((result) => {
      res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Zipcode added successfully",
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

const viewZipcode = async (req, res) => {
  await zipcode
    .aggregate([
      {
        $match: {
          cityName: req.body.cityName,
          isDeleted: false

        },
      },
      {
        $project: {
          isDeleted: 0,
          status: 0,
          createdOn: 0,
          updatedOn: 0,
          countryId: 0,
          __v: 0,
        },
      },
    ])
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "zipcode list",
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
  cityImage,
  addCity,
  viewCity,
  editCity,
  deleteCity,
  viewCountryAgainstCity,
  addZipcode,
  viewZipcode
};
