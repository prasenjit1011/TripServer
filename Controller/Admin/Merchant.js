const mongoose = require("mongoose");
var passwordHash = require("password-hash");
// const User = require("../../Model/user");
const Merchant = require("../../Models/merchant");
const CreateMarchents = require("../../Models/createMarchent");
const company = require("../../Models/companyDetails");
const companyTemp = require("../../Models/companyDetailsTemp");
const jwt = require("jsonwebtoken");
// var moment = require("moment");
const ResponseCode = require("../../service/responseCode");
const { Validator } = require("node-input-validator");
const { DBerror, InputError } = require("../../service/errorHandeler");
const crypto = require("crypto");
const algorithm = "aes-256-cbc";
const iv = "1234567812345678";
const Securitykey = "12345678123456781234567812345678";
const S3 = require("../../service/s3");
const nodemailer = require("nodemailer");
const { HtmlToPdf } = require("../../service/pdfGenerator");
const { doPDFUpload } = require("../../service/s3")


require('dotenv').config();
const CryptoJS = require('crypto-js');
const CryptoJSKey   = process.env.CryptoJSKey;


var Admin = require("../../Models/admin");
let notificationModel = require("../../Models/notification");
let MarchentsnotificationModel = require("../../Models/marchentNotification");
let Marchentspayment = require("../../Models/marchentsPayment");
let Invoice = require("../../Models/invoice");
let Siteconfig  = require("../../Models/siteConfig");


let request = require("request");
var subAdmin = require("../../Models/subAdmin");
const SecretKey =
  "key=AAAA6-brgqU:APA91bFVDR2FmnNTPjzcWCCF6KtFWVUJx_gak-G9_BRnEzBWPNTCTMUfTd5MW7KaDUNvM6gI3qF0VEhXZpDC_j35batDjqsgURZ_bRkQ4HeQk5qqbUxHazXplO3jQSUfrJoBg3deeu0P";

function createToken(data) {
  return jwt.sign(data, "happy");
}

const merchantimage = async (req, res) => {
  let uploadDAta = await S3.doUpload(req, "merchant/image");
  if (uploadDAta.status) {
    res.send(uploadDAta);
  } else {
    res.send(uploadDAta);
  }
};

const sendPasswordMail = async (name, email, user_id) => {
  console.log("hhhhhhh");
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: "thingstodoo85@gmail.comz",
        pass: "fnuf lemg isln emly",
      },
    });
    const mailOption = {
      from: "thingstodoo85@gmail.comz",
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
              <p>We are excited to have you as a new member of our team.</p>
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

const adminRegisterMerchant00 = async (req, res) => {
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
        _id: new mongoose.Types.ObjectId(req.body.id),
        saveAsDraft: true,
      }).exec();
      if (check) {
        Merchant.findOneAndUpdate(
          { _id: check._id },
          { ...req.body },
          { saveAsDraft: req.body.saveAsDraft }
        )
          .then((data) => {
            res.status(ResponseCode.errorCode.success).json({
              status: true,
              message: "Merchant update sucessfully",
            });
          })
          .catch((error) => {
            const errors = DBerror(error);
            res.status(ResponseCode.errorCode.serverError).json({
              status: false,
              message: "Server error,Please try again",
              error: errors,
            });
          });
      } else {
        await Merchant.find({ email: req.body.email, isDeleted: false })
          .then(async (data) => {
            if (data.length > 0) {
              res.status(ResponseCode.errorCode.dataExist).json({
                status: false,
                message: "email already exist,Please try another email",
              });
            } else {
              let merchantData = {
                ...req.body,
                // image: img_loc,
                addedBy: new mongoose.Types.ObjectId(req.user._id),
                subMrchent: false,
                type: "merchant",
                isApproval: true,
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
                new company(compData).save();

                const name = data.firstName;
                // console.log("name",data.firstName);

                if (data) {
                  sendPasswordMail(name, req.body.email, data._id);
                  res.status(ResponseCode.errorCode.success).json({
                    status: true,
                    message: "Merchant created successfully",
                  });
                } else {
                  res.status(ResponseCode.errorCode.requiredError).json({
                    status: false,
                    message: "Merchant register failed",
                  });
                }
              });
            }
          })
          .catch((error) => {
            const errors = DBerror(error);
            res.status(ResponseCode.errorCode.serverError).json({
              status: false,
              message: "Server error,Please try again",
              error: errors,
            });
          });
      } //hjukhjukhjyuk
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

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: "thingstodoo85@gmail.comz",
    pass: "fnuf lemg isln emly",
  },
});

const adminRegisterMerchant = async (req, res) => {

  console.log(44444444444);

  const v = new Validator(req.body, {
    // password: "required|minLength:8",
    email: "required|email",
    // firstName: "required",
    // lastName: "required",
    // image:"required"
  });

  const mailOption = {
    from: "thingstodoo85@gmail.comz",
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
          <p>We are excited to inform you that your new account has successfully created as a merchant.</p>
          <p>Best regards,</p>
          <p>ThingsToDo</p>
        </div>
        </body>
      </html>
    `,
  };

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
        _id: new mongoose.Types.ObjectId(req.body.id),
        saveAsDraft: true,
      }).exec();
      if (check) {
        Merchant.findOneAndUpdate(
          { _id: check._id },
          { ...req.body },
          { saveAsDraft: req.body.saveAsDraft }
        )
          .then((data) => {
            res.status(ResponseCode.errorCode.success).json({
              status: true,
              message: "Merchant update sucessfully",
            });
          })
          .catch((error) => {
            const errors = DBerror(error);
            res.status(ResponseCode.errorCode.serverError).json({
              status: false,
              message: "Server error,Please try again",
              error: errors,
            });
          });
      }
      else {
        await Merchant.find({ email: req.body.email, isDeleted: false })
          .then(async (data) => {
            if (data.length > 0) {
              res.status(ResponseCode.errorCode.dataExist).json({
                status: false,
                message: "email already exist,Please try another email",
              });
            } else {
              // for random marchentCode generate
              var marchentCode = "";
              var code = await Merchant.findOne(
                {},
                { marchentCode: 1 },
                { sort: { createdOn: -1 } }
              ).exec();
              console.log("code is", code);

              var inputString = "M0001";
              if (
                code == null ||
                code.marchentCode == null ||
                code.marchentCode == ""
              ) {
                marchentCode = inputString;
              } else {
                const substring = Number(code.marchentCode.slice(1)) + 1;
                console.log("subsstring===", substring);
                marchentCode = "M" + String(substring).padStart(4, "0");
                // marchentCode = "M" + substring;
              }

              let merchantConfig = await Siteconfig.findOne({configName:"merchantCode"});
              marchentCode  = "M"+merchantConfig.configValue.padStart(4, '0');
              console.log("marchent code is==", marchentCode);

              let merchantData = {
                ...req.body,
                // image: img_loc,
                addedBy: new mongoose.Types.ObjectId(req.user._id),
                marchentCode: marchentCode,
                subMrchent: false,
                type: "merchant",
                isApproval: true,
                designation: "marchentAdminstrative",
                passwordCrypto: encryptedMsg,
                password: passwordHash.generate(req.body.password),
                token: createToken(req.body),
                createdOn: new Date(),
                isDeleted: false,
              };
              const admin = new Merchant(merchantData);

              admin.save().then(async (data) => {
                await Siteconfig.findOneAndUpdate({configName:"merchantCode"},{configValue:parseInt(merchantConfig.configValue)+1});
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
                new company(compData).save();

                const name = data.firstName;
                // console.log("name",data.firstName);

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

                  res.status(ResponseCode.errorCode.success).json({
                    status: true,
                    message: "Merchant created successfully",
                  });

                  console.log("data", data);
                  let merchantID = data._id;

                  // Save notification data
                  const notificationData = {
                    marchentsID: merchantID, // Assuming you want to use req.user._id
                    title: "Your account has created as a marchent",
                    description: req.body.description,
                    // notification_type: 'special_offer',
                  };

                  const savedNotification =
                    await new MarchentsnotificationModel(
                      notificationData
                    ).save();
                  console.log("saved notification data is", savedNotification);

                  if (savedNotification) {
                    // push notification using FCM(firebase cloud messaging)
                    const options = {
                      method: "POST",
                      url: "https://fcm.googleapis.com/fcm/send",
                      headers: {
                        "content-type": "application/json",
                        Authorization: SecretKey,
                      },
                      body: JSON.stringify({
                        //device token is not set yet.............
                        // registration_ids: [postData.deviceToken],
                        priority: "high",
                        data: {},
                        notification: {
                          title: "Your account has created as a marchent ",
                          body: req.body.description,
                          // userId: req.user._id,
                          // image: req.body.image,
                          userId: merchantID, // Assuming you want to use req.user._id
                          title: "Your account has created as a marchent",
                          description: req.body.description,
                          vibrate: 1,
                          sound: 1,
                          show_in_foreground: true,
                          priority: "high",
                          content_available: true,
                        },
                      }),
                    };

                    const response = await request(options);

                    console.log("Notification sent:", response.body);
                    // return res.status(ResponseCode.errorCode.success).json({
                    //   status: true,
                    //   message1: "Review notification sent successfully",
                    //   // message2: "Advocacy content posted successfully, wait for admin approval"
                    // });
                  } else {
                    return res.status(ResponseCode.errorCode.serverError).json({
                      status: false,
                      message: "Error saving notification data",
                    });
                  }
                } else {
                  res.status(ResponseCode.errorCode.requiredError).json({
                    status: false,
                    message: "Merchant register failed",
                  });
                }
              });
            }
          })
          .catch((error) => {
            const errors = DBerror(error);
            res.status(ResponseCode.errorCode.serverError).json({
              status: false,
              message: "Server error,Please try again",
              error: errors,
            });
          });
      } //hjukhjukhjyuk
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

const getAllMemberProfile = async (req, res) => {
  let deCryptStr  = undefined;
  await Merchant.aggregate([
      {
        $match: {
          isDeleted: false,
          designation: "marchentAdminstrative",
          //status: true,
          saveAsDraft : false,
          //addedBy: new mongoose.Types.ObjectId(req.user._id),
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
     
      // for (let i = 0; i < data.length; i++) {
      //   if(data[i].password != ''){
      //     deCryptStr  = CryptoJS.AES.decrypt(data[i].password, process.env.CryptoJSKey).toString(CryptoJS.enc.Utf8);
      //     data[i].password = deCryptStr;
      //     data[i].passwordCrypto = deCryptStr;
      //   }
      // }
      
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Get All profile  Successfully",
        data: data,
      });
    })
    .catch((error) => {
      console.log("Error", error);
      //const errors = DBerror(error);

      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error,Please try again.......",
        error: [],
      });
    });
};

const updateMemberProfile = async (req, res) => {
  let updValue = {...req.body};

  let pwd = CryptoJS.AES.encrypt(updValue.password.toString(), CryptoJSKey).toString();
  updValue.password       = pwd;
  updValue.passwordCrypto = pwd;

  if(updValue?.approvalStatus && updValue?.approvalStatus == true){
    updValue.newSupplier = false;
    updValue.newSupplier = false;
    updValue.status = true;
    updValue.isActive = true;
    updValue.isApproval = true;
  }
 

  console.log('MY CryptoJSKey ::', CryptoJSKey);

  //return res.send(new mongoose.Types.ObjectId(req.params.id));

  console.log('---------HERE---------------\n\n', req.params.id, updValue.approvalStatus,'\n=============================\n');

  Merchant.findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(req.params.id) },
    {
      $set: updValue,
    }
  )
    .then((data) => {    
      //return res.send('--here--01--');
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Merchant  profile updated successfully",
      });
    })
    .catch((error) => {
      //return res.send('--here--02--');

      console.log(error);
      const errors = DBerror(error);
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error,Please try again",
        error: errors,
      });
    });
};

const singleMemberProfile = async (req, res) => {
  Merchant.aggregate([
      {
        $match: {
          isDeleted: false,
          //addedBy: new mongoose.Types.ObjectId(req.user._id),
          _id: new mongoose.Types.ObjectId(req.params.id),
        },
      },
      {
        $project: {
          __v: 0,
          _id: 1,
          isDeleted: 0,
          createdOn: 0,
          token: 0,
          updatedOn: 0,
        },
      },
    ])
    .then((data) => {
      if(data[0].password != ''){
        deCryptStr  = CryptoJS.AES.decrypt(data[0].password, process.env.CryptoJSKey).toString(CryptoJS.enc.Utf8);
        data[0].password = deCryptStr;
        data[0].passwordCrypto = deCryptStr;
      }
      
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Merchant profile get Successfully",
        data: data[0],
      });
    })
    .catch((error) => {
      const errors = DBerror(error);
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error,Please try again..........",
        error: errors,
      });
    });
};

const deleteMarchent = async (req, res) => {
  await Merchant.findOneAndUpdate(
    {
      //addedBy: new mongoose.Types.ObjectId(req.user._id),
      _id: new mongoose.Types.ObjectId(req.params.id),
    },
    {
      $set: { isDeleted: true },
    }
  )
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Marchent profile delete successfully",
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

const setMerchentActivityStatus = async (req, res) => {
  var id = req.params.id;
  await Merchant.findById({ _id: id }).then(async (data) => {
    // console.log("data", data);
    // return false
    if (data.status === true) {
      console.log(true);

      await Merchant.findOneAndUpdate(
        { _id: id },
        { $set: { status: false } },
        { new: true }
      ).then((data) => {
        res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "Merchant has been made inactive.",
          // data: data,
        });
      });
    } else {
      await Merchant.findOneAndUpdate(
        { _id: id },
        { $set: { status: true } },
        { new: true }
      )
        .then((data) => {
          res.status(ResponseCode.errorCode.success).json({
            status: true,
            message: "Merchant has been made active.",
            // data: data,
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
  });
};

const viewApprovalCompanyReq = async (req, res) => {
  try {
    const dataGet = await companyTemp.find({ isApprove: false });

    const dataCompany = await company.aggregate([
      {
        $match: {
          isApprove: false,
        },
      },
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
          marchentFirstName: "$marchentDetails.firstName",
          marchentLastName: "$marchentDetails.lastName",
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
        },
      },
      {
        $sort: {
          _id: -1,
          createdOn: -1,
        },
      },
    ]);

    const dataCompanyTemp = await companyTemp.aggregate([
      {
        $match: {
          isApprove: false,
        },
      },
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
          marchentFirstName: "$marchentDetails.firstName",
          marchentLastName: "$marchentDetails.lastName",
        },
      },
      {
        $lookup: {
          from: "companydetails",
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
              $unwind: {
                path: "$marchentDetails",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $addFields: {
                marchentFirstName: "$marchentDetails.firstName",
                marchentLastName: "$marchentDetails.lastName",
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
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$oldData",
          preserveNullAndEmptyArrays: true,
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
        },
      },
      {
        $sort: {
          _id: -1,
          createdOn: -1,
        },
      },
    ]);

    res.status(200).json({
      status: true,
      message: "Data got successfully !!",
      data: dataCompanyTemp,
    });
  } catch (error) {
    console.log(error);
    const errors = DBerror(error);
    return res.status(ResponseCode.errorCode.serverError).json({
      status: false,
      message: "Server error,Please try again",
      error: error.message,
    });
  }
};

const updateApprovalCompanyReq = async (req, res) => {
  ///\/\/\\/\

  try {
    /*1*/ const companyTempDataUpdate = await companyTemp.findOneAndUpdate(
      // Company   ********
      { _id: req.params.id },
      {
        $set: { isApprove: true, updatedOn: new Date() },
      },
      { new: true }
    );

    if (companyTempDataUpdate) {
      let newData = JSON.parse(JSON.stringify(companyTempDataUpdate));
      newData._id = undefined;
      /*2*/ const companyDataChange = await company.findOneAndUpdate(
        //  companyTemp  ***************
        { merchantId: companyTempDataUpdate.merchantId },
        { ...newData },
        { new: true }
      );

      console.log(companyDataChange);
      /*3*/ const chnageUpdatedDataMerchantProfile =
        await Merchant.findOneAndUpdate(
          {
            _id: companyTempDataUpdate.merchantId,
          },
          {
            ...newData,
          },
          { new: true }
        );

      /**4 */    
      await companyTemp.deleteOne({ merchantId: companyTempDataUpdate.merchantId });

    }

    res.status(200).json({
      status: true,
      message: "Update Approval CompanyReq",
    });
  } catch (error) {
    const errors = DBerror(error);
    return res.status(ResponseCode.errorCode.serverError).json({
      status: false,
      message: "Server error,Please try again",
      error: errors,
    });
  }

  //  companyTemp.findOneAndUpdate(     // Company   ********
  //   { _id: req.params.id },
  //   {
  //     $set: { isApprove: true, updatedOn: new Date(), },
  //   },
  //   { new: true }
  // )
  //   .then(async (data) => {
  //     console.log(data)
  //     if (data) {
  //       let newData = JSON.parse(JSON.stringify(data))
  //       newData._id = undefined
  //        company.findOneAndUpdate(       //  companyTemp  ***************
  //         { merchantId: data.merchantId },
  //         { ...newData }
  //       ).then((data)=> {
  //         console.log("success !!")

  //       }).catch((error) => {

  //       })

  //   }
  // })
  // .then(async (data) => {
  //   res.status(200).json({
  //     status: true,
  //     message: "Update Approval CompanyReq",
  //   });
  // })
  // .catch((error) => {
  //   const errors = DBerror(error);
  //   return res.status(ResponseCode.errorCode.serverError).json({
  //     status: false,
  //     message: "Server error,Please try again",
  //     error: errors,
  //   });
  // });

  // await company
  //   .findOneAndUpdate(
  //     { _id: req.params.id },
  // {
  //   $set: { isApprove: true },
  //   updatedOn: new Date(),
  // }
  //   )
  // .then(async (data) => {
  //   res.status(200).json({
  //     status: true,
  //     message: "Update Approval CompanyReq",
  //   });
  // })
  // .catch((error) => {
  //   const errors = DBerror(error);
  //   return res.status(ResponseCode.errorCode.serverError).json({
  //     status: false,
  //     message: "Server error,Please try again",
  //     error: errors,
  //   });
  // });
};

const viewDraftMarchentProfile = async (req, res) => {
  await Merchant.aggregate([
    {
      $match: {
        saveAsDraft: true,
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
      $unwind: {
        path: "$languageDetails",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        language: "$languageDetails.name",
      },
    },
    {
      $project: {
        isDeleted: 0,
        designation: 0,
        subMrchent: 0,
        acessLogin: 0,
        addedBy: 0,
        languageDetails: 0,
        token: 0,
        password: 0,
        passwordCrypto: 0,
        type: 0,
        emailNotification: 0,
        status: 0,
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
      res.status(200).json({
        status: true,
        message: "get all draft merchents",
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

const allUpcomingMerchantRequest00 = async (req, res) => {
  await Merchant.aggregate([
    {
      $match: {
        isDeleted: false,
        // designation: "marchentAdminstrative",
        isApproval: false,
        rejectedStatus: false,
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
      $sort: {
        createdOn: -1,
      },
    },
    {
      $project: {
        __v: 0,
        langId: 0,
        languageDetails: 0,
        emailNotification: 0,
        isDeleted: 0,
        // createdOn: 0,
        password: 0,
        token: 0,
        updatedOn: 0,
      },
    },
  ])
    .then((data) => {
      // console.log("data",data);
      for (let i = 0; i < data.length; i++) {
        const decrypter = crypto.createDecipheriv(
          "aes-256-cbc",
          Securitykey,
          iv
        );
        var decryptedMsg = decrypter.update(
          data[i].passwordCrypto,
          "hex",
          "utf8"
        );
        decryptedMsg += decrypter.final("utf8");
        data[i].passwordCrypto = decryptedMsg;
      }
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Get All profile  Successfully",
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

const allUpcomingMerchantRequest = async (req, res) => {
  await CreateMarchents.aggregate([
    {
      $match: {
        isDeleted: false,
        isApprove: false,
      },
    },
    {
      $project: {
        isDeleted: 0,
        createdOn: 0,
        __v: 0,
      },
    },
  ])
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Get All profile  Successfully",
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

const sendMail = async (name, email, approval) => {
  console.log("hhhhhhh");
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: "pal.happytome88@gmail.comz",
        pass: "vgtubapoawagvfcv",
      },
    });
    const mailOption = {
      from: "pal.happytome88@gmail.comz",
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
              <p>Your Request for a merchant is ${approval}</p>
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

const approvalOfMerchantstatus = async (req, res) => {  //not completed
  ///\/\/\/\/\/\/\/\/\/\/\/\/

  try {
    const { id } = req.params;
    const companyTempDataUpdate = await companyTemp.findOneAndUpdate(
      // changing status in temp
      {
        _id: new mongoose.Types.ObjectId(id),
      },
      {
        isApproval: true,
      },
      { new: true }
    );

    console.log("companyTempDataUpdate",companyTempDataUpdate)

    const { _id, ...newOb } = companyTempDataUpdate;

    const companyDataUpdate = await company.findOneAndUpdate(
      {
        merchantId: new mongoose.Types.ObjectId(
          companyTempDataUpdate.merchantId
        ),
      },
      newOb,
      {
        new: true,
      }
    );

    const merchantOb = {
      bankCode: newOb.merchantBankCode,
      firstName: newOb.merchantFirstName,
      lastName: newOb.merchantLastName,
      langId: newOb.langId,
      branchName: newOb.merchantBranchName,
      marBankIfscCode: newOb.marBankIfscCode,
      commisionPercentage: newOb.commisionPercentage,
      zip: newOb.zip
    };

    const {
      merchantBankCode,
      merchantFirstName,
      merchantLastName,
      merchantLangId,
      merchantBranchName,
      merchantBankIfscCode,
      merchantCommisionPercentage,
      ...newObMerchant     
    } = newOb;

    const data = await Merchant.findOneAndUpdate(
      // finally changing data in merchant profile
      {
        _id: new mongoose.Types.ObjectId(req.params.id),
      },
      { ...merchantOb, ...newObMerchant, updatedOn: new Date() }
    );
    console.log("data", data);

    if (req.body.isApproval) {
      sendMail(data.firstName, data.email, "approved");
    } else {
      sendMail(data.firstName, data.email, "rejected");
    }

    res.status(ResponseCode.errorCode.success).json({
      status: true,
      message: "Request status updated sucessfully",
    });
  } catch (error) {
    console.log(error);
    const errors = DBerror(error);
    return res.status(ResponseCode.errorCode.serverError).json({
      status: false,
      message: "Server error,Please try again",
      error: error.message,
    });
  }
};

const randomEmailprev1 = async (req, res) => {
  var arr = [];

  for (let i = 0; i < 3; i++) {
    // const firstName = faker.name.firstName();
    // const lastName = faker.name.lastName();
    // console.log(firstName)

    const email = generateRandomEmail(req.body.fname, req.body.lname);
    console.log(`Email: ${email}`);
    arr.push(email);
  }

  res.status(ResponseCode.errorCode.success).json({
    status: true,
    message: "suggested emails are",
    data: arr,
  });

  function generateRandomEmail(firstName, lastName) {
    const randomDigits = Math.floor(Math.random() * 10000);

    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomDigits}@thingstodo.com`;
    return email;
  }
};

const randomEmailprev2 = async (req, res) => {
  var arr = [];
  await Merchant.aggregate([
    {
      $match: {
        $or: [
          { email: { $regex: ".*" + req.body.fname + ".*", $options: "i" } },
          { email: { $regex: ".*" + req.body.lname + ".*", $options: "i" } },
        ],
      },
    },
    { $limit: 4 },
    {
      $project: {
        email: 1,
        _id: 0,
      },
    },
  ])
    .then((data) => {
      var emailArray = data.map((obj) => obj.email);

      res.status(200).json({
        status: true,
        message: "get all existing gmail",
        data: emailArray,
      });
    })
    .catch((error) => {
      console.log(error);
      const errors = DBerror(error);
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error,Please try again",
        error: errors,
      });
    });
};

const randomEmail = async (req, res) => {
  Merchant.find({ isDeleted: false }, { email: 1 })
    .then((data) => {
      var emailArray = data.map((obj) => obj.email);

      res.status(200).json({
        status: true,
        message: "get all existing gmail",
        data: emailArray,
      });
    })
    .catch((error) => {
      console.log(error);
      const errors = DBerror(error);
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error,Please try again",
        error: errors,
      });
    });
};

const viewMarchentsPayments = (req, res) => {
  Merchant.aggregate([
    {
      $match: {
        isDeleted: false,
        // addedBy:req.user._id
      },
    },
    {
      $lookup:{
        from:"invoices",
        localField:"_id",
        foreignField:"marchantId",
        as:"invoiceData",
        pipeline:[
          {
            $match:{
              isDeleted:false
            }
          },
          {
            $project:{
              invoiceNo:1,
              bookingTotalAmmount:1,
              merchentGetAmmount:1,
              adminGetAmmount:1
            }
          }
        ]
      }
    },
    {
      $project:{
        firstName:1,
        lastName:1,
        marBankAccNo:1,
        marBankIfscCode:1,
        marBankName:1,
        branchName:1,
        bankCode:1,
        branchCode:1,
        bankAcctCurrency:1,
        swiftCode:1,
        marAccHolderName:1,
        invoiceData:1,
        // branchCode:1,

      }
    }
  ])
    .then((data) => {
      res.status(ResponseCode.errorCode.success).json({
        status: true,
        messsage: "view successfully !",
        data: data,
      });
    })
    .catch((error) => {
      res.status(ResponseCode.errorCode.serverError).json({
        status: true,
        messsage: "Server error, please try again !",
      });
    });
};

const addPayments = async(req,res)=>{

  let invoiceData = await Invoice.findOne({isDeleted:false,invoiceNo:req.body.invoiceNo}).exec()
  const formattedDate = invoiceData.createdOn.toISOString().split("T")[0].split("-").reverse().join("-");
      let MerchantData =await Merchant.find({isDeleted:false,_id:new mongoose.Types.ObjectId(req.body.marchantId)}).exec()
      console.log("MerchantData",MerchantData)
      let marBankdata = MerchantData[0].marBankName
      let brancecode = MerchantData[0].branchCode
      let acHolderNAme = MerchantData[0].marAccHolderName
      let bankAcNumber = MerchantData[0].marBankAccNo
      let ifscCode = MerchantData[0].marBankIfscCode
      let country = MerchantData[0].country
      // let adressline = MerchantData[0].marBankName
      let city = MerchantData[0].city

      console.log("branchCode",brancecode)
      let todaydate = new Date()
      const todayDate = todaydate.toISOString().split("T")[0].split("-").reverse().join("-");

      console.log("todaydate",todayDate)


  var timestamp = `${new Date().getDate()}${new Date().getHours()}${new Date().getSeconds()}${new Date().getMilliseconds()}`;

  let options = {
    format: "A4",
    landscape: true,
  };

  var result = "";

  result += `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>GetYourGuide</title>
    </head>
    <body style="max-width: 100%; height: auto; overflow-x: hidden">
      <section style="width: 100%; height: auto; padding: 30px 0px">
        <div style="max-width: 95%; width: 100%; margin: 0px auto">
          <table style="width: 100%">
            <tbody>
              <tr>
                <td style="width: 70%">
                  <div style="width: 80px; height: 60px">
                    <img
                      src="Images/Logo.png"
                      alt="logo"
                      style="width: 100%; height: 100%"
                    />
                  </div>
                </td>
                <td style="width: 30%">
                  <div style="text-align: right">
                    <div>${req.body.invoiceNo}</div>
                    <div>${todayDate}</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
  
          <div style="padding: 50px 0px">
            <table style="width: 100%">
              <tr>
                <td style="font-size: 15px; color: #000; width: 70%">
                  Finn Tours LTD
                </td>
              </tr>
  
              <tr>
                <td style="width: 70%">121 Fitzroy Ave, Belfast</td>
              </tr>
  
              <tr>
                <td style="font-size: 15px; color: #000; width: 70%">
                  BT71HU Belfast
                </td>
                <td style="width: 15%"></td>
                <td style="width: 15%"></td>
              </tr>
  
              <tr>
                <td style="font-size: 15px; color: #000; width: 70%">
                  Northern Ireland
                </td>
                <td style="width: 15%"></td>
                <td style="width: 15%"></td>
              </tr>
  
              <tr>
                <td style="font-size: 15px; color: #000; width: 70%">
                  United Kingdom
                </td>
                <td style="width: 15%"></td>
                <td style="width: 15%"></td>
              </tr>
            </table>
          </div>
  
          <p style="font-size: 20px; font-weight: 600; margin-top: 50px">
            Payment confirmation GPS-65606-00983900
          </p>
  
          <table style="width: 100%; border-bottom: 1px solid grey">
            <tr>
              <td></td>
              <td></td>
              <td
                style="
                  text-align: end;
                  font-size: 15px;
                  color: #000;
                  font-weight: 600;
                  text-align: right;
                  padding-bottom: 20px;
                "
              >
                Amount GBP
              </td>
            </tr>
            <tr style="margin-bottom: 20px">
              <td style="font-size: 15px; color: #000; padding-bottom: 20px">
                ${formattedDate}
              </td>
              <td style="font-size: 15px; color: #000; padding-bottom: 20px">
                ${req.body.invoiceNo}
              </td>
              <td
                style="
                  text-align: end;
                  font-size: 15px;
                  color: #000;
                  padding-bottom: 20px;
                "
              >
                ${req.body.merchentGetAmmount}
              </td>
            </tr>
            <tr>
              <td style="font-size: 15px; color: #000; font-weight: 600">
                Total payment
              </td>
              <td></td>
              <td
                style="
                  text-align: end;
                  font-size: 15px;
                  color: #000;
                  font-weight: 600;
                "
              >
              ${req.body.merchentGetAmmount}
              </td>
            </tr>
          </table>
  
          <p style="width: 50%; color: #000; font-size: 15px; line-height: 26px">
            The funds will be transferred to the bank account below.
          </p>
  
          <p style="color: #000; font-size: 15px; line-height: 26px">
            The recipient bank and/or intermediary banks may deduct charges,
            affecting the final amount received.
          </p>
  
          <table style="width: 100%">
            <tr>
              <td style="vertical-align: top; width: 15%">
                <div>
                  <p style="margin: 5px 0px">Bank Name</p>
                  
                  <p style="margin: 5px 0px">Branch Code</p>
                  <p style="margin: 5px 0px">Account Holder Name</p>
                  <p style="margin: 5px 0px">Bank Account Number</p>
                  <p style="margin: 5px 0px">IFSC Code</p>
                  <p style="margin: 5px 0px">Country/Region</p>
                  <p style="margin: 5px 0px">Address Line 1</p>
                  <p style="margin: 5px 0px">City</p>
                </div>
              </td>
              <td>
                <div style="font-weight:bold;">
                  <p style="margin: 5px 0px">${marBankdata }</p>
                  <p style="margin: 5px 0px">${acHolderNAme }</p>

                  <p style="margin: 5px 0px">${brancecode }</p>
                  <p style="margin: 5px 0px">${acHolderNAme }</p>
                  <p style="margin: 5px 0px">${bankAcNumber}</p>
                  <p style="margin: 5px 0px">${ifscCode}</p>
                  <p style="margin: 5px 0px">${country}</p>
                  <p style="margin: 5px 0px">${city}</p>
                </div>
              </td>
            </tr>
          </table>
          <p style="padding-top: 100px; font-weight: 600; margin-bottom: 8px;">Thingstodooo Deutschland GmbH</p>
          <table style="width: 100%;">
              <tr>
                  <td style="border-right: 1px solid grey; vertical-align: top; width: 30%;">
                      <div>
                          <p style="margin: 5px 0px;">Sonnenburger Strasse 73</p>
                          <p style="margin: 5px 0px;">10437 Berlin</p>
                          <p style="margin: 5px 0px;">Germany</p>
                      </div>
                  </td>
                  <td style="border-right: 1px solid grey; vertical-align: top; width: 30%;">
                      <div style="padding: 0px 20%;">
                          <p style="margin: 5px 0px;">Phone: +49 30 568 394 45</p>
                          <p style="margin: 5px 0px;">supplier@Thingstodooo.com</p>
                          <p style="margin: 5px 0px;">www.Thingstodooo.com</p>
                      </div>
                  </td>
                  <td style="vertical-align: top; width: 30%;">
                      <div style="padding: 0px 20%;">
                          <p style="margin: 5px 0px;">Amtsgericht Charlottenburg</p>
                          <p style="margin: 5px 0px;">HRB 132059</p>
                          <p style="margin: 5px 0px;">VAT ID No. DE276456081</p>
                          <p style="margin: 5px 0px;">Managing Directors: Johannes Reck, Tao </p>
                          <p style="margin: 5px 0px;">Tao, Nils Chrestin</p>
                      </div>
                  </td>
                  <td style="vertical-align: bottom; width: 5%; text-align: end;">1/1</td>
              </tr>
          </table>
        </div>
      </section>
    </body>
  </html>
    `

    let file = result;
    let path = "pdf/" + timestamp + ".pdf"

    const pdfBuffer = await HtmlToPdf(file, options);
    console.log("pdf buffer file===", pdfBuffer);
    const uploadResult = await doPDFUpload(pdfBuffer, timestamp);

    // if (uploadResult.status) {
    //   return res.status(200).json({
    //     status: true,
    //     data: uploadResult.url,
    //     message: "Pdf Created and Uploaded Successfully",
    //   });
    // } else {
    //   return res.status(500).json({
    //     status: false,
    //     error: uploadResult.error,
    //     message: "Error uploading PDF to AWS S3",
    //   });
    ;

    const invoiceUrl = uploadResult.url;




  let paymentData = {
    ...req.body,
    paymentUrl:invoiceUrl
  }
 let insertData = await Marchentspayment(paymentData).save().then((data)=>{
  // console.log("data",data)
  res.status(ResponseCode.errorCode.success).json({
    status:true,
    message:"payment add successfully!",
    data:data.paymentUrl
  })
 }).catch((error)=>{
  res.status(ResponseCode.errorCode.serverError).json({
    status:false,
    message:"Server error , please try again!"
  })
 })
}



module.exports = {
  adminRegisterMerchant,
  getAllMemberProfile,
  updateMemberProfile,
  singleMemberProfile,
  merchantimage,
  deleteMarchent,
  setMerchentActivityStatus,
  viewApprovalCompanyReq,
  updateApprovalCompanyReq,
  viewDraftMarchentProfile,
  allUpcomingMerchantRequest,
  approvalOfMerchantstatus,
  randomEmail,
  viewMarchentsPayments,
  addPayments
};

// async function findUsersWithNameAndGetEmail(name) {
//   try {
//     const query = {
//       $or: [
//         { firstname: { $regex: name, $options: "i" } }, // Case-insensitive regex match for firstname
//         { lastname: { $regex: name, $options: "i" } }, // Case-insensitive regex match for lastname
//       ],
//     };

//     const projection = { _id: 0, email: 1 }; // Display only the email field

//     const result = await collection.find(query, { projection }).toArray();

//     if (result.length > 0) {
//       console.log(`Users with name "${name}" and their associated emails:`);
//       result.forEach((user) => {
//         console.log(`Email: ${user.email}`);
//       });
//     } else {
//       console.log(`No users found with name "${name}".`);
//     }
//   } catch (err) {
//     console.error(err);
//   } finally {
//     client.close();
//   }
// }

// const searchName = "John"; // Replace with the name you want to search for
// findUsersWithNameAndGetEmail(searchName);
