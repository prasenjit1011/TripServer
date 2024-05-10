var mongoose = require("mongoose");
var Admin = require("../../Models/admin");
var merchent = require("../../Models/merchant");
var subAdmin = require("../../Models/subAdmin");
var passwordHash = require("password-hash");
var ResponseCode = require("../../service/responseCode");
const { DBerror, InputError } = require("../../service/errorHandeler");
const crypto = require("crypto");
const algorithm = "aes-256-cbc";
const iv = "1234567812345678";
const Securitykey = "12345678123456781234567812345678";

require('dotenv').config();
const CryptoJS = require('crypto-js');


const S3 = require("../../service/s3");


const adminImageUpload = async (req, res) => {
  let uploadDAta = await S3.doUpload(req, "admin/image");
  console.log("uploadDAta",uploadDAta);
  if (uploadDAta.status) {
    res.send(uploadDAta);
  } else {
    res.send(uploadDAta);
  }
};


const adminImageUploadBase64 = async (req, res) => {
  let uploadDAta = await S3.doUploadBase64digi(req, "admin/baseimage");
  if (uploadDAta.status) {
    res.send(uploadDAta);
  } else {
    res.send(uploadDAta);
  }
};


var jwt = require("jsonwebtoken");
const { Validator } = require("node-input-validator");
// const S3 = require('../../service/s3');

function createToken(data) {
  return jwt.sign(data, "DonateSmile");
}

const register = async (req, res) => {
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

  const encrypter = crypto.createCipheriv("aes-256-cbc", Securitykey, iv);
  var encryptedMsg = encrypter.update(req.body.password, "utf8", "hex");
  encryptedMsg += encrypter.final("hex");
  console.log("encryptedMsg", encryptedMsg);

  // const decrypter = crypto.createDecipheriv("aes-256-cbc", Securitykey, iv);
  // var decryptedMsg = decrypter.update(encryptedMsg, "hex", "utf8");
  // decryptedMsg += decrypter.final("utf8");
  // console.log("decryptedMsg", decryptedMsg);
  // const
  const subAdminCheck = await subAdmin.findOne({ email: req.body.email, isDeleted: false }).exec()
  if (!subAdminCheck) {
    const merchentcheck = await merchent.findOne({ email: req.body.email, isDeleted: false }).exec();
    if (!merchentcheck) {
      await Admin.findOne({ email: req.body.email, isDeleted: false })
        .then((data) => {
          if (data == null || data == "") {
            let adminData = {
              ...req.body,
              password: passwordHash.generate(req.body.password),
              passwordCrypto: encryptedMsg,
              userType: "admin",
              token: createToken(req.body),
              createdOn: new Date(),
            };

            const admin = new Admin(adminData);
            return admin.save().then((data) => {
              const dataFormate = {
                email: data.email,
                token: data.token,
              };

              return res.status(ResponseCode.errorCode.success).json({
                status: true,
                success: true,
                message: "New Admin created successfully",
                data: dataFormate,
              });
            });
          } else {
            return res.status(ResponseCode.errorCode.dataExist).json({
              status: false,
              message: "email already exist,please try another email",
            });
          }
        })
        .catch((error) => {
          const errors = DBerror(error);
          res.status(ResponseCode.errorCode.serverError).json({
            status: false,
            message: errors,
            error: error,
          });
        });
    } else {
      return res.status(ResponseCode.errorCode.dataExist).json({
        status: false,
        message: "email already exist",
      });
    }
  } else {
    return res.status(ResponseCode.errorCode.dataExist).json({
      status: false,
      message: "email already exist ",
    });
  }

};

const login = async (req, res) => {
  const v = new Validator(req.body, {
    email: "required",
    password: "required|minLength:8",
  });
  let matched = await v.check().then((val) => val);
  if (!matched) {
    return res
      .status(200)
      .send({ status: false, error: v.errors, message: InputError(v.errors) });
  }

  const q = Admin.findOne({ email: req.body.email })
    .then((Admin) => {


      
      if (Admin != null && Admin?.password != '') {
        let enCryptStr  = Admin.password;
        let deCryptStr  = CryptoJS.AES.decrypt(enCryptStr, process.env.CryptoJSKey).toString(CryptoJS.enc.Utf8);
        
        if (deCryptStr == req.body.password) {
          const DataFormate = {
            token: Admin.token,
            userType: Admin.userType
          };
          res.status(ResponseCode.errorCode.success).json({
            status: true,
            message: "Admin login successfully",
            data: DataFormate,
          });
        }
        else {
          res.status(ResponseCode.errorCode.serverError).json({
            status: false,
            message: "Password not matched",
            password:Admin.password,
            orgPwd:deCryptStr,
            insPwd:req.body.password
          });
        }

      }
      else {
        res.status(ResponseCode.errorCode.serverError).json({
          status: false,
          message: "Username name not found",
        });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(ResponseCode.errorCode.dataNotmatch).json({
        status: false,
        message: "Not found",
      });
    });
};

const getTokenData = async (token) => {
  let adminData = await Admin.findOne({ token: token }).exec();
  return adminData;
};

const update = (req, res) => {
  return Admin.findOneAndUpdate(
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
          message: "Admin data updated successfully",
          // data: data,
        });
      } else {
        return res.status(ResponseCode.errorCode.dataNotmatch).json({
          status: false,
          message: "Admin not match",
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

const passwordChange = async (req, res) => {
  const v = new Validator(req.body, {
    newPassword: "required|minLength:8",
    oldPassword: "required|minLength:8",
  });
  let matched = await v.check().then((val) => val);
  if (!matched) {
    return res.status(500).send({ status: false, error: v.errors });
  }

  let b = Admin.findOne({ _id: new mongoose.Types.ObjectId(req.user._id) })
    .then(async (admin) => {
      console.log(admin);

      if (admin != null && req.body.oldPassword == req.body.newPassword) {
        res.status(ResponseCode.errorCode.dataExist).json({
          status: false,
          message: "Your old and new password are same.",
          // data: admin
        });
      } else if (admin != null && admin.comparePassword(req.body.oldPassword)) {
        const encrypter = crypto.createCipheriv("aes-256-cbc", Securitykey, iv);
        var encryptedMsg = encrypter.update(
          req.body.newPassword,
          "utf8",
          "hex"
        );
        encryptedMsg += encrypter.final("hex");
        await Admin.findOneAndUpdate(
          { _id: new mongoose.Types.ObjectId(admin._id) },
          {
            $set: {
              password: passwordHash.generate(req.body.newPassword),
              passwordCrypto: encryptedMsg,
            },
          }
        );
        admin.password = null;
        res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "Admin password changed successfully",
          // data: admin
        });
      } else {
        res.status(ResponseCode.errorCode.dataNotmatch).json({
          status: false,
          message: "Password not match",
          data: null,
        });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error. Please try again.",
        error: err,
      });
    });
};

// const imageUploadProfile = async (req, res) => {

//     let uploadDAta = await S3.doUpload(req, "admin/profile/");
//     // let orignalName = uploadDAta.

//     res.status(200).json({
//       status: true,
//       url: uploadDAta.url,
//       error: null,
//     });
// }

const getProfile = (req, res) => {
  return Admin.aggregate([
    {
      $match: {
        isDeleted: false,
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $project: {
        __v: 0,
        // _id: 0,
        token: 0,
        isDeleted: 0,
        password: 0,
        createdOn: 0,
        updatedOn: 0,
      },
    },
    {
      $sort: {
        _id: -1,
        createdOn: -1
      },
    },
  ])
    .then((data) => {
      /*
      const decrypter = crypto.createDecipheriv("aes-256-cbc", Securitykey, iv);
      var decryptedMsg = decrypter.update(
        data[0].passwordCrypto,
        "hex",
        "utf8"
      );
      decryptedMsg += decrypter.final("utf8");
      data[0].passwordCrypto = decryptedMsg;*/

      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Get All profile deatils  Successfully",
        data: data[0],
      });
    })
    .catch((error) => {
      console.log(error);
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error. Please try again.",
        error: error,
      });
    });
};

module.exports = {
  register,
  login,
  getProfile,
  getTokenData,
  update,
  passwordChange,
  adminImageUpload,
  adminImageUploadBase64
  // imageUploadProfile
};
