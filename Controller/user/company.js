const mongoose = require("mongoose");
const Company = require("../../Models/companyDetails");
const marchent = require("../../Models/merchant");
const ResponseCode = require("../../service/responseCode");
const { DBerror, InputError } = require("../../service/errorHandeler");
const S3 = require("../../service/s3");

const viewCompany = async (req, res) => {

    await marchent
      .aggregate([
        {
          $match: {
            _id: req.params.id,
            isDeleted: false,
            saveAsDraft: false,
          },
        },
        // {
        //   $project: {
        //     _id:0,
        //     addedBy:0,
        //     langId:0,
        //     firstName:0,
        //     lastName:0,
        //     image:0,
        //     email:0,
        //     password:0,
        //     passwordCrypto:0,
        //     mobile:0,
        //     type:0,
        //     token:0,
        //     city:0,
        //     state:0,
        //     country:0,
        //     isDeleted:0,
        //     designation:0,
        //     subMrchent:0,
        //     acessLogin:0,
        //     marBankAccNo:0,
        //     marBankIfscCode:0,
        //     marBankName:0,
        //     marAccHolderName:0,
        //     saveAsDraft:0,
        //     image:0,
        //     image:0,
        //     image:0,
        //     image:0,
        //     image:0,
        //     status:0,
        //     createdOn:0,
        //     updatedOn:0,
        //     __v:0,
        //     emailNotification:0
  
        //   },
        // },
      ])
      .then((data) => {
        return res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: " company details view successfully",
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

  module.exports={
    viewCompany
  }