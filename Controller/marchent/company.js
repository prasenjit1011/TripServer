const mongoose = require("mongoose");
const Company = require("../../Models/companyDetails");
const marchent = require("../../Models/merchant");
// const marchent = require("../../Models/merchant");

const ResponseCode = require("../../service/responseCode");
const { DBerror, InputError } = require("../../service/errorHandeler");
const S3 = require("../../service/s3");
const companyDetailsTemp = require("../../Models/companyDetailsTemp");
const crypto = require("crypto");
const Securitykey = "12345678123456781234567812345678";
const iv = "1234567812345678";

require('dotenv').config();
const CryptoJS = require('crypto-js');

const companyImageUpload = async (req, res) => {
  let uploadDAta = await S3.doPDFUpload(req, "comapany/image");
  if (uploadDAta.status) {
    res.send(uploadDAta);
  } else {
    res.send(uploadDAta);
  }
};

const editCompany33330000000000 = async (req, res) => {
  console.log(req.user._id);

  try {

    const cpmpanyDetailsChange = await marchent
      .findOneAndUpdate(
        { merchantId: req.user._id },
        { isApproval: true },
        {new:true}
      ) 
    
    const  companyDetailsChange= await Company.findOneAndUpdate(
      { merchantId: req.user._id },
      { isApprove: false },
      { upsert: true }
    )

    const  companyTempDetailsChange= await companyDetailsTemp.findOneAndUpdate(
      { merchantId: req.user._id },
      { ...req.body, isApproval: false },
      { upsert: true }
    )

      
    return res.status(ResponseCode.errorCode.success).json({
          status: true,    
          message: "Company details change request sent sucessfully",
          data:companyTempDetailsChange
    });
     
  } catch (error) {
    const errors = DBerror(error);
    console.log("error",error)
    return res.status(ResponseCode.errorCode.serverError).json({
      status: false,
      message: "Server error,Please try again",
      error: error.message,
    });
  }
  ////////////////////////

  // var check = await Company.findOne({
  //   merchantId: req.user._id,
  // }).exec();
  // console.log("check", check);

  // if (check != null || check != null) {
  //   Company.findOneAndUpdate(
  //     { _id: check._id },
  //     { ...req.body, isApprove: false }
  //   )

  //     .then((data) => {
  //       return res.status(ResponseCode.errorCode.success).json({
  //         status: true,
  //         message: "Company details change request sent sucessfully",
  //       });
  //     })
  //     .catch((error) => {
  //       return res.status(ResponseCode.errorCode.serverError).json({
  //         status: false,
  //         message: "Error occur",
  //         error: error,
  //       });
  //     });
  // }
};


const editCompany000000000000000000 = async (req, res) => {
  console.log(req.user);

  try {
    const companyDetailsChange = await marchent.findOneAndUpdate(
      { merchantId: req.user._id },
      { isApproval: true },
      { new: true }
    );

    await Company.findOneAndUpdate(
      { merchantId: req.user._id },
      { isApprove: false },
      { upsert: true }
    );

    const companyTempDetailsChange = await companyDetailsTemp.findOneAndUpdate(
      { merchantId: req.user._id },
      { ...req.body, isApproval: false, },
      { upsert: true, new: true }
    );

    return res.status(ResponseCode.errorCode.success).json({
      status: true,
      message: "Company details change request sent successfully",
      data: companyTempDetailsChange,
    });

  } catch (error) {
    const errors = DBerror(error);
    console.log("error", error);
    return res.status(ResponseCode.errorCode.serverError).json({
      status: false,
      message: "Server error, Please try again",
      error: error.message,
    });
  }
};





const editCompany = async (req, res) => {
  try {
    const CompanyDetails = await Company
      .findOne({
        merchantId: new mongoose.Types.ObjectId(req.user._id),
        isApproval: true, 
      },
      )
      .exec();

    if (CompanyDetails != null || CompanyDetails != "") {
      console.log("reqbody is", req.body);


      const companyDetailsTempData = await companyDetailsTemp
        .findOneAndUpdate(
          { merchantId: new mongoose.Types.ObjectId(req.user._id) },
          { ...req.body,
            isApproval: false,
      
           },
          {  upsert: true, new: true } 
        )
        .exec();

      const CompanyDetailsData = await Company
      .findOneAndUpdate(
       {merchantId: new mongoose.Types.ObjectId(req.user._id) },
        { upsert: true }
      )
      .exec();

      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Company details update request sent successfully",
        data: companyDetailsTempData,
      });
    } else {
      res.status(ResponseCode.errorCode.success).json({
        status: false,
        message:
          "You cannot update Company details until the profile is approved by admin",
      });
    }
  } catch (error) {
    console.log("error is==", error);
    const errors = DBerror(error);
    return res.status(ResponseCode.errorCode.serverError).json({
      status: false,
      message: "Server error. Please try again",
      error: error.message,
    });
  }
};


const viewCompany0000 = async (req, res) => {

  console.log("merchant_id :",req.user._id) 
 
  try {
    let dataCompany = null
    const checkDataInTemp  = await companyDetailsTemp.findOne({merchantId: new mongoose.Types.ObjectId(req.user._id)})
     
     if (checkDataInTemp) {  /////////////////////////////////////////////////////// ______________if 
       dataCompany = await companyDetailsTemp   //   new changes 
      .aggregate([
        {
          $match: {
            merchantId: new mongoose.Types.ObjectId(req.user._id) ,
            isDeleted: false,
            // isApprove: false,
          },
        },
        {
          $lookup: {
            from: "merchants",
            localField: "merchantId",
            foreignField: "_id",
            as: "merchantDetails",
          },
        },
        {
          $unwind: { path: "$merchantDetails", preserveNullAndEmptyArrays: true },
        },
        {
          $addFields: {
            // merchantFirstName: "$merchantDetails.firstName",
            // merchantLastName: "$merchantDetails.lastName",
            // merchantBankAccNo : "$merchantDetails.marBankAccNo",
            // merchantMICR : "$merchantDetails.MICR",
            //merchantEmail : "$merchantDetails.email" ,
            // merchantBankIfscCode : "$merchantDetails.marBankIfscCode" ,
            // merchantBankBranchName : "$merchantDetails.branchName" ,
            // merchantCompanyMobile : "$merchantDetails.companyMobile" ,
            // merchantDirectorName : "$merchantDetails.directorName" ,
            // merchantLicenseNumber : "$merchantDetails.licenseNumber" , 
            // merchantCommisionPercentage : "$merchantDetails.commisionPercentage" ,
            // merchantLangId : "$merchantDetails.langId" ,
            // merchantZipCode:"$merchantDetails.zip"
          },
        },
        {
          $lookup: {
            from: "companydetails",   // companydetailtemps  .// old data in this collection
            localField: "merchantId",
            foreignField: "merchantId",
            as: "oldData",
            pipeline: [
              {
                $lookup: {
                  from: "merchants",
                  localField: "merchantId",
                  foreignField: "_id",
                  as: "marchentDetails",
                },
              },
              {
                $unwind: { path: "$marchentDetails", preserveNullAndEmptyArrays: true },
              },
              {
                $addFields: {
                  // marchentFirstName: "$marchentDetails.firstName",
                  // marchentLastName: "$marchentDetails.lastName",
                },
              },
              {
                $project: {
                  __v: 0,
                  status: 0,
                  // isApprove: 0,
                  isDeleted: 0,
                  createdOn: 0,
                  updatedOn: 0,
                  marchentDetails: 0,
                  merchantEmail : 0 ,
                },
              },
    
            ]
          }
        },
        {
          $unwind: { path: "$oldData", preserveNullAndEmptyArrays: true },
        }, 
        
        {
          $project: {
            __v: 0,
            status: 0,
            // isApprove: 0,
            isDeleted: 0,
            createdOn: 0,
            updatedOn: 0,
            merchantDetails: 0,
            merchantEmail : 0 ,
          },
        },
        {
          $sort: {
            _id: -1,
            createdOn: -1,
          },
        },
      ])
    
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "company details view successfully ;)!!",
        data: {...dataCompany[0],newDataAvailable:true }
      });

    
     } else{  ////////////////////////////////////////////////////////_______________________________ else 
         
      dataCompany = await Company   //
      .aggregate([
        {
          $match: {
            merchantId: new mongoose.Types.ObjectId(req.user._id) ,
            isDeleted: false,
            // isApprove: false,
          },
        },
        {
          $lookup: {
            from: "merchants",
            localField: "merchantId",
            foreignField: "_id",
            as: "merchantDetails",
          },
        },
        {
          $unwind: { path: "$merchantDetails", preserveNullAndEmptyArrays: true },
        },
        {
          $addFields: {
            // merchantFirstName: "$merchantDetails.firstName",
            // merchantLastName: "$merchantDetails.lastName",
            // merchantBankAccNo : "$merchantDetails.marBankAccNo",
            // merchantMICR : "$merchantDetails.MICR",
            // merchantEmail : "$merchantDetails.email" ,
            // merchantBankIfscCode : "$merchantDetails.marBankIfscCode" ,
            // merchantBankBranchName : "$merchantDetails.branchName" ,
            // merchantCompanyMobile : "$merchantDetails.companyMobile" ,
            // merchantDirectorName : "$merchantDetails.directorName" ,
            // merchantLicenseNumber : "$merchantDetails.licenseNumber" , 
            // merchantCommisionPercentage : "$merchantDetails.commisionPercentage" ,
            // merchantLangId : "$merchantDetails.langId" 
          },
        },
        {
          $project: {
            __v: 0,
            status: 0,
            // isApprove: 0,
            isDeleted: 0,
            createdOn: 0,
            updatedOn: 0,
            merchantDetails: 0,
            merchantEmail : 0 ,
          },
        },
        {
          $sort: {
            _id: -1,
            createdOn: -1,
          },
        },
      ])

      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "company details view successfully ;)!!",
        data: {oldData :dataCompany[0],newDataAvailable:false }
      });

     }
 
  }catch(error){
     
    const errors = DBerror(error);
    return res.status(ResponseCode.errorCode.serverError).json({
      status: false,
      message: "Server error,Please try again",
      error: error.message,
    });
  }


};



const viewCompany = async (req, res) => {
  await marchent.aggregate([
    {
      $match: {
        isDeleted: false,
        // designation: "marchentAdminstrative",
        _id:req.user._id,
        status: true,
        // saveAsDraft : false
        // addedBy: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "languages",
        localField: "langId",
        foreignField: "_id",
        as: "languageDetails",
      },
    },
 
    {
      $unwind: { path: "$languageDetails", preserveNullAndEmptyArrays: true },
    },
    {
      $addFields: {
        lamguage: "$languageDetails.name",
      },
    },
    {
      $lookup: {
        from: "companydetailtemps",
        localField: "_id",
        foreignField: "merchantId",
        as: "tempData",
      },
    },
    {
      $unwind: { path: "$tempData", preserveNullAndEmptyArrays: true },
    },
    {
      $project: {
        __v: 0,
        languageDetails: 0,
        emailNotification: 0,
        isDeleted: 0,
        createdOn: 0,
        //password: 0,
        token: 0,
        updatedOn: 0,
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
      for (let i = 0; i < data.length; i++) {
        /*const decrypter = crypto.createDecipheriv(
          "aes-256-cbc",
          Securitykey,
          iv
        );

        var decryptedMsg = decrypter.update(
          data[i].passwordCrypto,
          "hex",
          "utf8"
        );*
        decryptedMsg += decrypter.final("utf8");
        data[i].passwordCrypto = decryptedMsg;*/

        let deCryptStr  = CryptoJS.AES.decrypt(data[i].password, process.env.CryptoJSKey).toString(CryptoJS.enc.Utf8);
        data[i].password  = deCryptStr;
      }
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Get profile  Successfully",
        data: data[0],
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

module.exports = {
  companyImageUpload,
  editCompany,
  viewCompany,
};
