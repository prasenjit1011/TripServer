var mongoose = require("mongoose");
var Merchant = require("../../Models/merchant");
var Company = require("../../Models/companyDetails");
var Admin = require("../../Models/admin");
var subAdmin = require("../../Models/subAdmin");
var passwordHash = require("password-hash");
var ResponseCode = require("../../service/responseCode");
const crypto = require("crypto");
const algorithm = "aes-256-cbc";
const iv = "1234567812345678";
const Securitykey = "12345678123456781234567812345678";
var jwt = require("jsonwebtoken");
const { Validator } = require("node-input-validator");
const { DBerror, InputError } = require("../../service/errorHandeler");
const S3 = require("../../service/s3");

require('dotenv').config();
const CryptoJS = require('crypto-js');


function createToken(data) {
  return jwt.sign(data, "happy");
}

const merchantImageUpload = async (req, res) => {
  let uploadDAta = await S3.doUpload(req, "merchant/image"); //changed from doPdfUpload to doUpload
  if (uploadDAta.status) {
    res.send(uploadDAta);
  } else {
    res.send(uploadDAta);
  }
};

const getTokenData = async (token) => {
  let adminData = await Merchant.findOne({ token: token }).exec();
  return adminData;
};

const login = async (req, res) => {
  const v = new Validator(req.body, {
    email: "required|email",
    password: "required|minLength:8",
  });
  let matched = await v.check().then((val) => val);
  if (!matched) {
    return res.status(200).send({
      status: false,
      error: v.errors,
      message: InputError(v.errors),
    });
  }

  // const q = Merchant.findOne({ email: req.body.email, isDeleted: false, status: true, isApproval })
  const q = Merchant.findOne({ email: req.body.email, isDeleted: false, status: true })
    .then((merchant) => {

      if(merchant == null){
        return res.status(401).json({
          status: false,
          message: 'Merchant email id not found',
        });
      }

      if(!merchant.status){
        return res.status(401).json({
          status: false,
          message: 'Merchant status is dectivate.',
        });
      }

      if (merchant != null && merchant.password != ''){
        let enCryptStr  = merchant.password;
        let deCryptStr  = CryptoJS.AES.decrypt(enCryptStr, process.env.CryptoJSKey).toString(CryptoJS.enc.Utf8);

        if (deCryptStr == req.body.password) {
          const DataFormate = {token: merchant.token};
          return res.status(ResponseCode.errorCode.success).json({
            status: true,
            message: "Merchant login successfully",
            data: DataFormate,
          });
        }
        else {
          res.status(ResponseCode.errorCode.serverError).json({
            status: false,
            message: "Credentials not match.",
          });
        }
      }
      else{
        return res.status(200).json({
          status: 200,
          message: 'Merchant email id not found',
        });
      }
    })
    .catch((err) => {
      console.log("error is ===",err);
      res.status(ResponseCode.errorCode.dataNotmatch).json({
        status: false,
        message: "Not found",
      });
    });
};

const updateProfile = (req, res) => {
  return Merchant.findOneAndUpdate(
    { _id: { $in: [new mongoose.Types.ObjectId(req.user._id)] } },
    {
      ...req.body,
      updated_on: new Date(),
    }
  )
    .then((data) => {
      if (data != null) {
        data = { ...data._doc, ...req.body };
        return res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "Merchant data updated successfully",
          // data: data,
        });
      } else {
        return res.status(ResponseCode.errorCode.dataNotmatch).json({
          status: false,
          message: "Merchant not match",
          data: null,
        });
      }
    })
    .catch((err) => {
      console.log(err);

      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error. Please try again.",
        error: err,
      });
    });
};

const addCompanyDetails = async (req, res) => {

  try{
    /*1*/    var check = await Company.findOne({
              merchantId: new mongoose.Types.ObjectId(req.user._id),
             }).exec();
    
    /*2*/   const merchantDetail = await Merchant.find({_id:new mongoose.Types.ObjectId(req.user._id)})
  
    console.log(merchantDetail)

    if (check) {
      return Company.findOneAndUpdate(
        { merchantId: { $in: [new mongoose.Types.ObjectId(req.user._id)] } },
        {
          merchantFirstName:merchantDetail[0].firstName,
          merchantLastName:merchantDetail[0].lastName,
          merchantBankAccNo:merchantDetail[0].marBankAccNo,
          merchantBankCode:merchantDetail[0].bankCode,
          merchantZipCode:merchantDetail[0].zip,
          merchantLangId:merchantDetail[0].langId,
          merchantBranchName:merchantDetail[0].branchName,
          merchantBankIfscCode:merchantDetail[0].marBankIfscCode,
          merchantCommisionPercentage:merchantDetail[0].commisionPercentage,
          compamyRegistrationImage:merchantDetail[0].compamyRegistrationImage,
          ...req.body,  
          updatedOn: new Date(),
        }
      )
        .then((data) => {
          if (data != null) {
            data = { ...data._doc, ...req.body };
            return res.status(ResponseCode.errorCode.success).json({
              status: true,
              message: "Merchant company details updated successfully",
              data: data,
            });
          } else {
            return res.status(ResponseCode.errorCode.dataNotmatch).json({
              status: false,
              message: "Merchant not match",
              data: null,
            });
          }
        })
        .catch((err) => {
          console.log(err);
  
          return res.status(ResponseCode.errorCode.serverError).json({
            status: false,
            message: "Server error. Please try again.",
            error: err,
          });
        });
    } else {
      new Company({
        merchantFirstName:merchantDetail[0].firstName,
          merchantLastName:merchantDetail[0].lastName,
          merchantBankAccNo:merchantDetail[0].marBankAccNo,
          merchantBankCode:merchantDetail[0].bankCode,
          merchantZipCode:merchantDetail[0].zip,
          merchantLangId:merchantDetail[0].langId,
          merchantBranchName:merchantDetail[0].branchName,
          merchantBankIfscCode:merchantDetail[0].marBankIfscCode,
          merchantCommisionPercentage:merchantDetail[0].commisionPercentage,
          compamyRegistrationImage:merchantDetail[0].compamyRegistrationImage,
        ...req.body,
        merchantId: req.user._id,
        createdOn: new Date(),
      })
        .save()
        .then((data) => {  
          return res.status(ResponseCode.errorCode.success).json({
            status: true,
            message: "Merchant company details added successfully",
            data: data,
          });
        })
        .catch((err) => {
          console.log(err);
  
          return res.status(ResponseCode.errorCode.serverError).json({
            status: false,
            message: "Server error. Please try again.",
            error: err,
          });
        });
    }
  }catch(error){
    return res.status(500).json({status:false,msg:"Server error !! ",data:error.message})
  }

};

const getProfile = async (req, res) => {
  console.log('********', req.user._id);


  return Merchant.aggregate([
    {
      $match: {
        isDeleted: false,
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "languages",
        localField: "langId",
        foreignField: "_id",
        pipeline: [
          {
            $project: {
              status: 0,
              isDeleted: 0,
              createdAt: 0,
              updatedAt: 0,
              __v: 0,
            },
          },
        ],
        as: "language",
      },
    },
    {
      $unwind: { path: "$language", preserveNullAndEmptyArrays: true },
    },
    {
      $lookup: {
        from: "companydetails",
        localField: "_id",
        foreignField: "merchantId",
        pipeline: [
          {
            $project: {
              __v: 0,
              createdOn: 0,
              updatedOn: 0,
              isDeleted: 0,
            },
          },
        ],
        as: "companyDetails",
      },
    },
    {
      $unwind: { path: "$companyDetails", preserveNullAndEmptyArrays: true },
    },
    {
      $project: {
        __v: 0,
        _id: 1,
        isDeleted: 0,
        createdOn: 0,
        password: 0,
        token: 0,
        updatedOn: 0,
      },
    },
  ])
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Get All data  Successfully",
        data: data[0],
      });
    })
    .catch((error) => {
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error. Please try again.",
        error: error,
      });
    });
};

const passwordChange = async (req, res) => {
  // const { password, oldPassword } = req.body;

  const validator = new Validator(req.body, {
    password: "required|minLength:8",
    oldPassword: "required|minLength:8",
  });
  const isValid = await validator.check();

  if (!isValid) {
    return res.status(500).send({ status: false, error: validator.errors });
  }

  try {
    const admin = await Merchant.findOne({
      _id: new mongoose.Types.ObjectId(req.user._id),
    });
    if (!admin) {
      return res
        .status(404)
        .json({ status: false, message: "Merchant not found" });
    }

    if (!admin.comparePassword(req.body.oldPassword)) {
      return res
        .status(401)
        .json({ status: false, message: "Password not match" });
    }

    const encrypter = crypto.createCipheriv("aes-256-cbc", Securitykey, iv);
    var encryptedMsg = encrypter.update(req.body.password, "utf8", "hex");
    encryptedMsg += encrypter.final("hex");
    //   admin.password = null;
    await Merchant.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(admin._id) },
      {
        $set: {
          password: passwordHash.generate(req.body.password),
          passwordCrypto: encryptedMsg,
        },
      }
    );

    res.status(200).json({
      status: true,
      message: "Merchant password changed successfully",
      // data: admin
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: false,
      message: "Server error. Please try again.",
      error: err,
    });
  }
};


const selfRegistration = async (req, res) => {
  const v = new Validator(req.body, {
    // password: "required|minLength:8",
    email: "required|email",
    // firstName: "required",
    // lastName: "required",
    // image:"required"
  });
  let matched = await v.check().then((val) => val);
  if (!matched) {
    return res
      .status(400)
      .send({ status: false, error: v.errors, message: InputError(v.errors) });
  }

  const encrypter = crypto.createCipheriv("aes-256-cbc", Securitykey, iv);
  var encryptedMsg = encrypter.update(req.body.password, "utf8", "hex");
  encryptedMsg += encrypter.final("hex");

  const admincheck = await Admin.findOne({
    email: req.body.email,
    isDeleted: false,
  }).exec();
  if (!admincheck) {
    const subAdminCheck = await subAdmin
      .findOne({ email: req.body.email, isDeleted: false })
      .exec();
    if (!subAdminCheck) {
      var check = await Merchant.findOne({
        email: req.body.email, isDeleted: false
      }).exec();
      if (check) {
        res.status(ResponseCode.errorCode.dataExist).json({
          status: false,
          message: "email already exist,Please try another email",
        });
      } else {
        let merchantData = {
          ...req.body,
          // image: img_loc,
          // addedBy: req.user._id,
          subMrchent: false,
          type: "merchant",
          designation: "marchentAdminstrative",
          passwordCrypto: encryptedMsg,
          password: passwordHash.generate(req.body.password),
          token: createToken(req.body),
          createdOn: new Date(),
        };

        const admin = new Merchant(merchantData);
        admin.save().then((data) => {
          const compData = {
            merchantId: data._id,
            legalStatus: req.body.legalStatus,
            companyName: req.body.companyName,
            legalCompanyName: req.body.legalCompanyName,
            directorName: req.body.directorName,
            companyMobile: req.body.companyMobile,
            individualName: req.body.individualName,
            companyDob: req.body.companyDob,
            companyStreetAddress: req.body.companyStreetAddress,
            postalCode: req.body.postalCode,
            compCity: req.body.compCity,
            compState: req.body.compState,
            compCountry: req.body.compCountry,
            licenseNumber: req.body.licenseNumber,
            registrationNumber: req.body.registrationNumber,
            description: req.body.description,
            socialLink: req.body.socialLink,
            logo: req.body.logo,
            insurancePolicy: req.body.insurancePolicy,
            compamyRegistrationImage: req.body.compamyRegistrationImage,

          };
          new Company(compData).save()

          if (data) {

            res.status(ResponseCode.errorCode.success).json({
              status: true,
              message: "Request send for approval is successfull",
            });
          } else {
            res.status(ResponseCode.errorCode.requiredError).json({
              status: false,
              message: "Merchant register failed",
            });
          }
        });
      }



    } else {
      res.status(ResponseCode.errorCode.dataExist).json({
        status: false,
        message: "email already exist ",
      });
    }
  } else {
    res.status(ResponseCode.errorCode.dataExist).json({
      status: false,
      message: "email already exist ",
    });
  }
};

module.exports = {
  login,
  updateProfile,
  getTokenData,
  getProfile,
  passwordChange,
  merchantImageUpload,
  addCompanyDetails,
  selfRegistration
};
