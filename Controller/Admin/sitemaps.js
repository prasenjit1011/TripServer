const mongoose = require("mongoose");
const sitemap = require("../../Models/siteMaps");
const ResponseCode = require("../../service/responseCode");
const { DBerror, InputError } = require("../../service/errorHandeler");

const addSitemap = async (req, res) => {
await sitemap.find({
    continent: req.body.continent,
    countryId: new mongoose.Types.ObjectId(req.body.countryId),
  })
    .then((data) => {
      if (data.length > 0) {
        return res.status(ResponseCode.errorCode.dataExist).json({
          status: false,
          message: "sitemap exists",
        });

      } else {

        new sitemap({
          ...req.body,
        })
          .save()
          .then((data) => {
            return res.status(ResponseCode.errorCode.success).json({
              status: true,
              message: "sitemap added successfully",
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

const viewSitemap = async (req, res) => {
  await sitemap
    .aggregate([
      {
        $match: {
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
        $unwind: { path: "$countryDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $addFields: {
          countryName: "$countryDetails.name",
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

const editSitemap = async (req, res) => {
  await sitemap
    .findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(req.params.id) },
      { ...req.body }
    )
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "sitemap updated",
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

const deleteSitemap = async (req, res) => {
  await sitemap
    .findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(req.params.id) },
      { isDeleted: true }
    )
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "sitemap deleted",
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
  addSitemap,
  viewSitemap,
  editSitemap,
  deleteSitemap,
};
