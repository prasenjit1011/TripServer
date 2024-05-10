var mongoose = require("mongoose");
var SubAdmin = require("../../Models/subAdmin");
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








const subAdminImageUpload = async (req, res) => {
  let uploadDAta = await S3.doPDFUpload(req, "subadmin/image");
  if (uploadDAta.status) {
    res.send(uploadDAta);
  } else {
    res.send(uploadDAta);
  }
};

const login = async (req, res) => {
  const v = new Validator(req.body, {
    email: "required",
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

  const q = SubAdmin.findOne({
    email: req.body.email,
    isDeleted: false,
    status: true,
  })
    .then((subadmin) => {
        
      if (subadmin != null){ //} && subadmin.comparePassword(req.body.password)) {
        const DataFormate = {
          token: subadmin.token,
          userType: subadmin.userType,
        };
        res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "SubAdmin login successfully",
          data: DataFormate,
        });
      } else {
        res.status(ResponseCode.errorCode.serverError).json({
          status: false,
          message: "Server error. Please try again.",
          // error: err,
        });
      }
    })
    .catch((err) => {
      console.log("error is===",err);
      res.status(ResponseCode.errorCode.dataNotmatch).json({
        status: false,
        message: "Not found",
      });
    });
};

const updateProfile = (req, res) => {
  return SubAdmin.findOneAndUpdate(
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
          message: "SubAdmin data updated successfully",
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
const getTokenData = async (token) => {
  let adminData = await SubAdmin.findOne({ token: token }).exec();
  return adminData;
};

const getProfile = async (req, res) => {
  return SubAdmin.aggregate([
    {
      $match: {
        isDeleted: false,
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
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
      const decrypter = crypto.createDecipheriv("aes-256-cbc", Securitykey, iv);
      var decryptedMsg = decrypter.update(
        data[0].passwordCrypto,
        "hex",
        "utf8"
      );
      decryptedMsg += decrypter.final("utf8");
      data[0].passwordCrypto = decryptedMsg;
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
    const admin = await SubAdmin.findOne({
      _id: new mongoose.Types.ObjectId(req.user._id),
    });
    if (!admin) {
      return res
        .status(404)
        .json({ status: false, message: "Subadmin not found" });
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
    await SubAdmin.findOneAndUpdate(
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
      message: "Subadmin password changed successfully",
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

module.exports = {
  login,
  updateProfile,
  getTokenData,
  getProfile,
  passwordChange,
  subAdminImageUpload,
};
