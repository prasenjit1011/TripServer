const mongoose = require("mongoose");
const CreateMarchent = require("../../Models/createMarchent");
const Marchent = require("../../Models/merchant");
const Language = require("../../Models/language");
const ResponseCode = require("../../service/responseCode");
const {InputError}  = require("../../service/errorHandeler");
const { Validator } = require("node-input-validator");
const nodemailer = require("nodemailer");
require('dotenv').config();
const CryptoJS = require('crypto-js');
const CryptoJSKey   = process.env.CryptoJSKey;
const jwt = require("jsonwebtoken");
let Siteconfig  = require("../../Models/siteConfig");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: "thingstodoo85@gmail.comz",
    pass: "fnuf lemg isln emly"
  },
});

const sendEmail = (options) => {
  transporter.sendMail(options, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log(`Email has been sent: ${info.response}`);
    }
  });
};

const addcreateMarchents = async (req, res) => {
  let v = new Validator(req.body, {
    email: "required",
    // password: "required",
  });

  let matched = await v.check().then((data) => data);
  console.log("matched data", matched);

  if (!matched) {
    res.status(ResponseCode.errorCode.serverError).json({
      status: false,
      error: v.errors,
      message: InputError(v.errors),
    });
    return;
  }

  
  const marchentData = await Marchent.findOne({
    userID: req.user._id,
  }).exec();

  //console.log('-: marchentData :-',marchentData, req.user._id, '\n\n\n\n\n');


  if (marchentData) {
      //console.log(req.user._id)
      return res.status(ResponseCode.errorCode.success).json({
        status: false,
        message:
          "Already submited for request,Awaiting admin approval.",
      });
  }else {

    let langData        = await Language.findOne();
    let enCryptStr      = CryptoJS.AES.encrypt('12345678', process.env.CryptoJSKey).toString();
    let merchantConfig  = await Siteconfig.findOne({configName:"merchantCode"});
    marchentCode        = "M"+merchantConfig.configValue.padStart(4, '0');

    let marData = {
      ...req.body,
      userID: new mongoose.Types.ObjectId(req.user._id),
      newSupplier: true,
      status: false,
      isActive: false,
      saveAsDraft : false,
      isApproval: false,
      subMrchent: false,
      designation: "marchentAdminstrative",
      companyName: req.body.legalCompanyName,
      password: enCryptStr,
      commisionPercentage:0,
      position:'',
      acessLogin:'marchentAdminstrative',
      marchentCode: marchentCode,
      langId: langData?._id,
      token: jwt.sign(req.body, "happy"),
      createdOn: Date.now(),
    };

  
    let newMarchant = new Marchent(marData);
    newMarchant
    .save()
    .then(async (newMarchant) => {
      await Marchent.findOne({
        email: req.body.email,
        userID: req.user._id,
        isApprove: false,
      }).then(async (data) => {

        await Siteconfig.findOneAndUpdate({configName:"merchantCode"},{configValue:parseInt(merchantConfig.configValue)+1});

        return res.status(ResponseCode.errorCode.success).json({
          status: true,
          message:
            "Merchant created successfully. Awaiting admin approval.",
        });



        if (data) {
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
                  <p>We are excited to inform you that your merchant account has been successfully created.</p>
                  <p>Awaiting admin approval.</p>
                  <p>If you have any questions or need assistance, feel free to reach out to us.</p>
                  <p>Thank you and welcome aboard!</p>
                  <p>Best regards,</p>
                  <p>ThingsToDo</p>
                </div>
                </body>
              </html>
            `,
          };

          const adminMailOptions = {
            from: "thingstodoo85@gmail.comz",
            to: 'nilam1111nitu@gmail.comz',
            subject: "New Merchant Request",
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
                    <h1>New Merchant Request</h1>
                    <p>Dear Admin,</p>
                    <p>A new user has requested merchant status. Here are the details:</p>
                    <ul>
                      <li><strong>Name:</strong> ${req.body.firstName} ${req.body.lastName}</li>
                      <li><strong>Email:</strong> ${req.body.email}</li>
                    </ul>
                    <p>Please review and take necessary actions.</p>
                    <p>If you have any questions or need assistance, feel free to reach out to us.</p>
                    <p>Thank you!</p>
                    <p>Best regards,</p>
                    <p>ThingsToDo</p>
                  </div>
                </body>
              </html>
            `,
          };

          sendEmail(mailOption);  
          sendEmail(adminMailOptions);

          return res.status(ResponseCode.errorCode.success).json({
            status: true,
            message:
              "Merchant created successfully. Awaiting admin approval.",
          });
        }
      });
    })
    .catch((error) => {

      console.log(error);

      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error, please try again.....",
        error:error
      });
    });
  }




};

const ViewCreateMarchents = (req, res) => {
  CreateMarchent.aggregate([
    {
      $match: {
        isDeleted: false,
      },
    },
    {
      $project: {
        isDeleted: 0,
        createdOn: 0,
        __v: 0,
        status: 0
      }
    }
  ]).then((data) => {
    res.status(ResponseCode.errorCode.success).json({
      status: true,
      message: "Data get successfully!.",
      data: data
    });
  }).catch((err) => {
    res.status(ResponseCode.errorCode.serverError).json({
      status: false,
      message: "Server error please try again!.",
    });
  })
};

module.exports = {
  addcreateMarchents,
  ViewCreateMarchents,
};
