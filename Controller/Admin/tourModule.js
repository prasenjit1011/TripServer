const mongoose = require("mongoose");
const tourModule = require("../../Models/tourModule");
const ResponseCode = require("../../service/responseCode");
const S3 = require("../../service/s3");

const tourModuleImage = async (req, res) => {
  let tourUpload = await S3.doUpload(req, "tourModule/image");

  res.status(ResponseCode.errorCode.success).json({
    status: true,
    data: tourUpload.url,
  });
};

const addTourModule = async (req, res) => {
  var check = await tourModule.findOne({ name: req.body.name,cityId:new mongoose.Types.ObjectId(req.body.cityId) }).exec();

  if (check == "" || check == null) {
    new tourModule({
      ...req.body,
    })
      .save()
      .then((data) => {
        return res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "New tourModule added successfully",
        });
      })
      .catch((error) => {
        return res.status(ResponseCode.errorCode.serverError).json({
          status: false,
          message: "Error occur",
          error: error,
        });
      });
  } else {
    return res.status(ResponseCode.errorCode.dataExist).json({
      status: false,
      message: "tourModule already exist.Please select the different module name",
    });
  }
};

const viewTourModule = async (req, res) => {
  tourModule
    .aggregate([
      {
        $match: {
          isDeleted: false,
          status: true,
        },
      },
      {
        $lookup:{
          from:"cities",
          localField:"cityId",
          foreignField:"_id",
          pipeline:[
            {
              $lookup:{
                from:"countries",
                localField:"countryId",
                foreignField:"_id",
                pipeline:[
                  {$project:{
                    name:1
                  }}
                ],
              
                as:"country"
              }
            },
            {
              $unwind:{
                path:"$country",preserveNullAndEmptyArrays:true
              }
            },
            {
              $project:{
                __v:0,
                updatedOn:0
              }
            }
          ],
          as:"city"
        }
      },
      
      {
        $project: {
          isDeleted: 0,
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
        message: "tourModule list",
        data: data,
      });
    })
    .catch((error) => {
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Error occur",
        error: error,
      });
    });
};

const editTourModule = async (req, res) => {
  await tourModule
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
        message: "tourModule update successfully",
      });
    })
    .catch((error) => {
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error,Please try again",
        error: error,
      });
    });
};

const deleteTourModule = async (req, res) => {
  await tourModule
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
        message: "tourModule delete successfully",
      });
    })
    .catch((error) => {
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error,Please try again",
        error: error,
      });
    });
};

const viewAllTourModule = async (req, res) => {
  let tourId = req.params.id;
  if(tourId == 'undefined'){
    tourId = null;
  }

  tourModule
    .aggregate([
      {
        $match: {
          isDeleted: false,
          cityId:new mongoose.Types.ObjectId(tourId),
          status: true,
        },
      },
      {
        $project: {
          isDeleted: 0,
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
        message: "tourModule list",
        data: data,
      });
    })
    .catch((error) => {
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Error occur",
        error: error,
      });
    });
};


module.exports = {
  tourModuleImage,
  addTourModule,
  viewTourModule,
  viewAllTourModule,
  editTourModule,
  deleteTourModule,
};
