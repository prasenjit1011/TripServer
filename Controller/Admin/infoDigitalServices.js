const mongoose = require("mongoose");
const infoDigitalService = require("../../Models/infoDigitalServices");
const ResponseCode = require("../../service/responseCode");
const { DBerror, InputError } = require("../../service/errorHandeler");


const addInfoDigitalService = async (req, res) => {
  await infoDigitalService
    .aggregate([
      {
        $match: { isDeleted: false },
      },
      {
        $project: {
          _id: 1,
        },
      },
    ])
    .then(async (data) => {
      console.log("adminData", data);
      // return false
      if (data.length > 0) {

        await infoDigitalService.findOneAndUpdate(
          { _id: new mongoose.Types.ObjectId(data[0]._id) },
          { ...req.body }
        ).then((data1)=>{
          res.status(200).json({
            status: true,
            message: "Updated successfully",
          })
        })


        
      } else {
        new infoDigitalService({
          ...req.body,
        })
          .save()
          .then((data) => {
            return res.status(ResponseCode.errorCode.success).json({
              status: true,
              message: "infoDigitalService added successfully",
            });
          })

      }
    }).catch((error) => {
      const errors = DBerror(error);
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error,Please try again",
        error: errors,
      });
    });
};

const viewInfoDigitalService = async (req, res) => {
  await infoDigitalService
    .aggregate([
      {
        $match: {
          isDeleted: false,
        },
      },

      {
        $project: {
          __v: 0,
          isDeleted: 0,
          createdOn: 0,
          updatedOn: 0,
        },
      },
    ])
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "infodigitalService viewed sucessfully",
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

const editInfoDigitalService = async (req, res) => {
  await infoDigitalService
    .findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(req.params.id) },
      { ...req.body }
    )
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "infodigitalService updated",
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
  addInfoDigitalService,
  viewInfoDigitalService,
  editInfoDigitalService,
};
