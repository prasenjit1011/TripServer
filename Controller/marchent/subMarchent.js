var mongoose = require("mongoose");
var Merchant = require("../../Models/merchant");
var ResponseCode = require("../../service/responseCode");
var bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const { Validator } = require("node-input-validator");
const { DBerror, InputError } = require("../../service/errorHandeler");
const nodemailer = require("nodemailer");
const passwordHash = require("password-hash");
const crypto = require("crypto");
const iv = "1234567812345678";
const Securitykey = "12345678123456781234567812345678";
var Admin = require("../../Models/admin");
var subAdmin = require("../../Models/subAdmin");
const S3 = require("../../service/s3");

require('dotenv').config();
const CryptoJS = require('crypto-js');

function createToken(data) {
  return jwt.sign(data, "subMarchent@1234567890");
}

const getTokenData = async (token) => {
  let userData = await Merchant.findOne({ token: token }).exec();
  return userData;
};

const sendPasswordMail = async (name, email, user_id) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: "thingstodoo85@gmail.com",
        pass: "fnuf lemg isln emly",
      },
    });
    const mailOption = {
      from: "thingstodoo85@gmail.com",
      to: email,
      subject: "Welcome Message",
      html: `
          <html>
            <head>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  background-color: #f2f2f2;
                }
                .container {
                  max-width: 600px;
                  margin: 20px auto;
                  background-color: #ffffff;
                  padding: 20px;
                  border-radius: 5px;
                  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                }
                h1 {
                  color: #333333;
                  font-size: 24px;
                  margin-bottom: 20px;
                }
                p {
                  color: #666666;
                  font-size: 16px;
                  line-height: 1.5;
                  margin-bottom: 10px;
                }
                a {
                  color: #007bff;
                  text-decoration: none;
                }
                a:hover {
                  text-decoration: underline;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Welcome to Our Company!</h1>
                <p>Dear ${name},</p>
                <p>We are excited to have you as a new member of our team. Below are your account details:</p>
                <p>If you have any questions or need assistance, feel free to reach out to us.</p>
                <p>Thank you and welcome aboard!</p>
                <p>Best regards,</p>
                <p>ThingsToDo</p>
              </div>
            </body>
          </html>
        `,
    };
    transporter.sendMail(mailOption, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email has been sent:- ", info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

const marchentImage = async (req, res) => {
  let uploadData = await S3.doUpload(req, "marchant/image");
  if (uploadData.status) {
    res.send(uploadData);
  } else {
    res.send(uploadData);
  }
};

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: "thingstodoo85@gmail.com",
    pass: "fnuf lemg isln emly"
  },
});

const marchentAddSubMar = async (req, res) => {
  const v = new Validator(req.body, {
    email: "required",
    password: "required|minLength:8",
  });
  const mailOption = {
    from: "thingstodoo85@gmail.com",
    to: req.body.email,
    subject: "Welcome Message",
    html: `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f2f2f2;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background-color: #ffffff;
              padding: 20px;
              border-radius: 5px;
              box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            }
            h1 {
              color: #333333;
              font-size: 24px;
              margin-bottom: 20px;
            }
            p {
              color: #666666;
              font-size: 16px;
              line-height: 1.5;
              margin-bottom: 10px;
            }
            a {
              color: #007bff;
              text-decoration: none;
            }
            a:hover {
              text-decoration: underline;
            }
          </style>
        </head>
        <body>
        <div class="container">
          <h1>Welcome to Our Company!</h1>
          <p>Dear ${req.body.firstName} ${req.body.lastName},</p>
          <p>We are excited to inform you that your new account has been successfully created.</p>
          <p>You can login with ${req.body.email} ${req.body.password},</p>

          <p>Best regards,</p>
          <p>ThingsToDo</p>
        </div>
        </body>
      </html>
    `,
  };
  let matched = await v.check().then((val) => val);
  if (!matched) {
    return res.status(ResponseCode.errorCode.success).send({
      status: false,
      error: v.errors,
      message: InputError(v.errors),
    });
  }

  /**  Old Code 1602024:Start */
  const encrypter = crypto.createCipheriv("aes-256-cbc", Securitykey, iv);
  var encryptedMsg = encrypter.update(req.body.password, "utf8", "hex");
  encryptedMsg += encrypter.final("hex");

  /**  Old Code 1602024:End */

  let enCryptPwd  = CryptoJS.AES.encrypt(req.body.password, process.env.CryptoJSKey).toString();

  const adminCheck = await Admin.findOne({ email: req.body.email, isDeleted: false }).exec();
  if (!adminCheck) {
    const subAdminCheck = await subAdmin.findOne({ email: req.body.email, isDeleted: false }).exec();
    if (!subAdminCheck) {
      await Merchant.find({ email: req.body.email, isDeleted: false }).then(
        (data) => {
          if (data == null || data == "") {
            new Merchant({
              ...req.body,
              designation: "subMerchent",
              //passwordCrypto: encryptedMsg,
              password: enCryptPwd,
              token: createToken(req.body),
              addedBy: req.user._id,
            })
              .save()
              .then((data) => {
                const name = data.firstName;
                if (data) {
                  sendPasswordMail(name, req.body.email, data._id);
                  transporter.sendMail(mailOption, function (error, info) {
                    // console.log("mailOption===",mailOption);
                    if (error) {
                      console.log(error);
                    } else {
                      console.log("Email has been sent:- ", info.response);
                    }
                  });

                  return res.status(ResponseCode.errorCode.success).json({
                    status: true,
                    message: "Submerchant register successfully",
                    // data: data,
                  });
                } else {
                  return res.status(ResponseCode.errorCode.requiredError).json({
                    status: false,
                    message: "Submerchant register failed",
                  });
                }
              }).catch((err)=>{
                console.log("error is ===",err);
                return res.status(ResponseCode.errorCode.serverError).json({
                  status: false,
                  message: "Server error. Please try again.",
                  //   error: err,
                });
              })
          } else {
            return res.status(ResponseCode.errorCode.dataExist).json({
              status: false,
              message: "email already exist ,try another email",
            });
          }
        })
        }else {
          return res.status(ResponseCode.errorCode.dataExist).json({
            status: false,
            message: "email already exist ",
          });
        }
    } else {
      return res.status(ResponseCode.errorCode.dataExist).json({
        status: false,
        message: "email already exist",
      });
    }
  }


  const subMarchentLogin = async (req, res) => {
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
  const q = Merchant.findOne({ email: req.body.email,isDeleted:false })
    .then((merchant) => {
      if (merchant) {
        if (merchant.subMrchent == true && merchant.isDeleted == false) {
          if (merchant != null && merchant.comparePassword(req.body.password)) {
            const DataFormate = {
              token: merchant.token,
            };
            res.status(ResponseCode.errorCode.success).json({
              status: true,
              message: "Merchant login successfully",
              data: DataFormate,
            });
          }
        } else {
          return res.status(401).json({
            status: false,
            message:
              "your account is inactive,contact to Merchent administrative ",
          });
        }
      } else {
        return res.status(403).json({
          status: false,
          message: "email & Password Not Found",
        });
      }
    })
    .catch((err) => {
      res.status(ResponseCode.errorCode.dataNotmatch).json({
        status: false,
        message: "Not found",
      });
    });
};

const subMarchentStatus = async (req, res) => {
  var id = req.params.id;
  await Merchant.findById({ _id: id }).then(async (data) => {
    if (data.subMrchent === false) {
      console.log(false);
      await Merchant.findOneAndUpdate(
        { _id: id },
        { $set: { subMrchent: true } },
        { new: true }
      ).then((data) => {
        res.status(200).json({
          status: true,
          message: "Submerchant has been made active",
          // data: data,
        });
      });
    } else {
      await Merchant.findOneAndUpdate(
        { _id: id },
        { $set: { subMrchent: false } },
        { new: true }
      )
        .then((data) => {
          res.status(200).json({
            status: true,
            message: "Submerchant has been made inactive.",
            // data: data,
          });
        })
        .catch((error) => {
          const errors = DBerror(error);
          return res.status(ResponseCode.errorCode.serverError).json({
            status: false,
            message: "Invalid id. Server error.",
            error: errors,
          });
        });
       
    }
  });
};

const updateProfile = async (req, res) => {
  let enCryptPassword  = CryptoJS.AES.encrypt(req.body.password, process.env.CryptoJSKey).toString();

  await Merchant.findOneAndUpdate(
    { _id: req.params.id },
    { ...req.body, password:enCryptPassword },
    { new: true }
  )
    .then((data) => {
      // console.log("dataResult", data);
      res.status(200).json({
        status: true,
        message: "Updated Submerchant data successfully",
        // data: data,
      });
    })
    .catch((error) => {
      const errors = DBerror(error);
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Invalid id. Server error.",
        error: errors,
      });
    });
};

const deleteSubMarchent = async (req, res) => {
  await Merchant.findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(req.params.id) },
    {
      isDeleted: true,
    }
  )
    .then((data) => {
      res.status(200).json({
        status: true,
        message: "Submerchant profile delete Sucessfully",
        // data: data,
      });
    })
    .catch((error) => {
      const errors = DBerror(error);
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Invalid id. Server error.",
        error: errors,
      });
    });
};

const  viewSubMarchent = async (req, res) => {

  console.log(req.user._id)

  await Merchant.aggregate([
    {
      $match: {

        $and :[ {addedBy : new mongoose.Types.ObjectId(req.user._id)},
          {$or: [
          {
            $or: [
              {
                _id: req.user._id,
                isDeleted: false,
                designation: "marchentAdminstrative",
              },
              {
                _id: req.user._id,
                isDeleted: false,
                designation: "subMerchent",
              },
              
            ],
          },
          {
            addedBy: req.user._id,
            designation: "subMerchent",
            isDeleted: false,
          },
        ]},]
      },
    },

    {
      $project: {
        __v: 0,
        subMrchent: 0,
        // addedBy: 0,
        //password: 0,
        // passwordCrypto:0,
        token: 0,
        isDeleted: 0,
        createdOn: 0,
        updateOn: 0,
      },
    },
    {
      $sort: {
        _id: -1,
        createdOn:-1
      },
    },
  ])
    .then((data) => {
      // console.log("data", data);
      for (let i = 0; i < data.length; i++) {
        let enCryptStr  = data[i].password;
        let deCryptStr  = CryptoJS.AES.decrypt(enCryptStr, process.env.CryptoJSKey).toString(CryptoJS.enc.Utf8);
        data[i].password = deCryptStr;
      }
      return res.status(200).json({
        status: true,
        data: data,
        message: "Submerchant view Sucessfull",
      });
    })
    .catch((error) => {
      const errors = DBerror(error);
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Invalid id. Server error.",
        error: errors.message,
      });
    });
};


const  viewSubMarchentList = async (req, res) => {
  await Merchant.aggregate([
    {
      $match: {
          addedBy: new mongoose.Types.ObjectId(req.params.merchantid),
          designation: "subMerchent",
          isDeleted: false,
      },
    },
    {
      $project: {
        __v: 0,
        subMrchent: 0,
        // addedBy: 0,
        //password: 0,
        // passwordCrypto:0,
        token: 0,
        isDeleted: 0,
        createdOn: 0,
        updateOn: 0,
      },
    },
    {
      $sort: {
        _id: -1,
        createdOn:-1
      },
    },
  ])
    .then((data) => {
      // console.log("data", data);
      for (let i = 0; i < data.length; i++) {
        let enCryptStr  = data[i].password;
        let deCryptStr  = CryptoJS.AES.decrypt(enCryptStr, process.env.CryptoJSKey).toString(CryptoJS.enc.Utf8);
        data[i].password = deCryptStr;
      }
      return res.status(200).json({
        status: true,
        data: data,
        message: "Submerchant view Sucessfull..**",
      });
    })
    .catch((error) => {
      const errors = DBerror(error);
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Invalid id. Server error.",
        error: errors.message,
      });
    });
}


module.exports = {
  marchentAddSubMar,
  subMarchentLogin,
  subMarchentStatus,
  updateProfile,
  deleteSubMarchent,
  viewSubMarchent,
  viewSubMarchentList,
  getTokenData,
  marchentImage
};
