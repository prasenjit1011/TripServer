const mongoose = require("mongoose");
const aboutUsModel = require("../../Models/aboutUs");
const Merchant = require("../../Models/merchant");
const SubAdmin = require("../../Models/subAdmin");
const User = require("../../Models/user");
const ActivityDetails = require("../../Models/activityDetails");

const ResponseCode = require("../../service/responseCode");
const { Validator } = require("node-input-validator");
const { DBerror, InputError } = require("../../service/errorHandeler");

const S3 = require("../../service/s3");

const aboutUsimage = async (req, res) => {
  let uploadData = await S3.doUpload(req, "aboutUs/image");
  if (uploadData.status) {
    res.send(uploadData);
  } else {
    res.send(uploadData);
  }
};

const addAboutUs = async (req, res) => {
  aboutUsModel
    .find({})
    .then((data) => {

      if (data.length > 0) {
        aboutUsModel.findOneAndUpdate(
          {
            _id: data[0]._id,
          },
          {
            ...req.body,
          }
        ).exec()
      } else {
        const aboutUsData = {
          ...req.body,
        };
        new aboutUsModel(aboutUsData).save();
      }
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "aboutUs added successfully",
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

const viewAboutUs = async (req, res) => {
  await aboutUsModel
    .aggregate([
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
    ])
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "View aboutUs Notice",
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

const singleAboutUs = async (req, res) => {
  await aboutUsModel
    .aggregate([
      {
        $match: {
          isDeleted: false,
          _id: new mongoose.Types.ObjectId(req.params.id),
        },
      },
      {
        $project: {
          status: 0,
          isDeleted: 0,
          createdOn: 0,
          updatedOn: 0,
          __v: 0,
        },
      },
    ])
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "single AboutUs fatch successfully",
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

const editAboutUs = async (req, res) => {
  await aboutUsModel
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
        message: "AboutUs update successfully",
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

const deleteAboutUs = async (req, res) => {
  await aboutUsModel
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
        message: "aboutUs delete successfully",
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

const personCountInDashboard=async (req,res)=>{
  // addedBy: new mongoose.Types.ObjectId(req.user._id),
  var totalM=await Merchant.find({isDeleted:false ,status :true ,}).exec()

  var totalS=await SubAdmin.find({isDeleted:false ,status:true  }).exec() 
  var totalU=await User.find({isDeleted:false ,status: true}).exec() 
  var totalA=await ActivityDetails.find({isDeleted:false , status:true}).exec() 


  var obj={
    TotalMerchant:totalM.length,
    TotalSubAdmin:totalS.length,
    TotalUser:totalU.length,
    TotalActivity:totalA.length,
  }  

  return res.status(ResponseCode.errorCode.success).json({
    status: true,
    message: "Show all person",
    data: obj,
  });
}



module.exports = {
  aboutUsimage,
  addAboutUs,
  viewAboutUs,
  editAboutUs,
  deleteAboutUs,
  singleAboutUs,
  personCountInDashboard
};


// about  us testing 