const mongoose = require("mongoose");
const passwordHash = require("password-hash");
// const User = require("../../Model/user");
const SubAdmin = require("../../Models/subAdmin");
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
const Merchant = require("../../Models/merchant");
var Admin = require("../../Models/admin");
// const faker = require('faker');
const { faker } = require("@faker-js/faker");

require('dotenv').config();
const CryptoJS = require('crypto-js');


const subadminimage = async (req, res) => {

  let uploadDAta = await S3.doUpload(req, "subadmin/image");
  if (uploadDAta.status) {
    res.send(uploadDAta);
  } else {
    res.send(uploadDAta);
  }
};

function createToken(data) {
  return jwt.sign(data, "happy");
}

const sendPasswordMail = async (name, email, user_id) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: "thingstodoo85@gmail.com",
        pass: "yzqkegawigupokwq",
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

const adminRegisterSubAdmin = async (req, res) => {

  let str         = req.body.password;
  let enCryptStr  = CryptoJS.AES.encrypt(str, process.env.CryptoJSKey).toString();

  /*res.status(200).json({
    status: false,
    message: "email already exist,Please try another email............",
    enCryptStr: enCryptStr
  });*/


  // var v1 = req.body.assignAccess.split(",");
  // var arr = [];
  // v1.forEach((ele) => {
  //   arr.push(ele.trim());
  // });

  const v = new Validator(req.body, {
    // email: "required|email",
    password: "required|minLength:8",
    email: "required",
    firstName: "required",
    lastName: "required",
    // image:"required"
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
    return res.status(200).send({
      status: false,
      error: v.errors,
      message: InputError(v.errors),
    });
  }

  const encrypter = crypto.createCipheriv("aes-256-cbc", Securitykey, iv);
  var encryptedMsg = encrypter.update(req.body.password, "utf8", "hex");
  encryptedMsg += encrypter.final("hex");

  const merchentCheck = await Merchant.findOne({
    email: req.body.email,
    isDeleted: false,
  }).exec();
  if (!merchentCheck) {
    const adminCheck = await Admin.findOne({
      email: req.body.email,
      isDeleted: false,
    }).exec();
    if (!adminCheck) {
      await SubAdmin.find({ email: req.body.email, isDeleted: false })
        .then(async (data) => {
          if (data.length > 0) {
            res.status(ResponseCode.errorCode.dataExist).json({
              status: false,
              message: "email already exist,Please try another email",
            });
          } else {
            // let img_loc;
            // if (!req.file) {
            //   img_loc = "";
            // } else {
            //   var { url } = await S3.doPDFUpload(req, "subadmin/image/");
            //   img_loc = url;
            // }
            let subadminData = {
              ...req.body,
              // image: img_loc,
              // assignAccess: arr,
              addedBy: new mongoose.Types.ObjectId(req.user._id),
              //passwordCrypto: encryptedMsg,
              //password: passwordHash.generate(req.body.password),

              password: enCryptStr,
              userType: "subadmin",
              token: createToken(req.body),
            };
            console.log(data);
            const subadmin = new SubAdmin(subadminData);
            return subadmin.save().then((data) => {
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

                res.status(ResponseCode.errorCode.success).json({
                  status: true,
                  message: "Subadmin created successfully",
                  // data:data
                });
              } else {
                res.status(ResponseCode.errorCode.requiredError).json({
                  status: false,
                  message: "Subadmin register failed",
                });
              }
            });
          }
        })
        .catch((error) => {
          const errors = DBerror(error);
          return res.status(ResponseCode.errorCode.serverError).json({
            status: false,
            message: "Server error,Please try again",
            error: errors,
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

const getAllMemberProfile = async (req, res) => {
  SubAdmin.aggregate([
    {
      $match: {
        isDeleted: false,
        userType: 'subadmin',
        //status: true ,
        // addedBy: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $project: {
        __v: 0,
        isDeleted: 0,
        createdOn: 0,
        //password: 0,
        // passwordCrypto:0,
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
        );

        decryptedMsg += decrypter.final("utf8");*/
        

        enCryptStr  = data[i].password;

        console.log('PWD :: ', data[i].password);

        deCryptStr  = CryptoJS.AES.decrypt(enCryptStr, process.env.CryptoJSKey).toString(CryptoJS.enc.Utf8);
        data[i].password = deCryptStr;
      }
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Get All profile  Successfully....",
        data: { len :data.length,data:data},

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

const updateMemberProfile = async (req, res) => {

  let str         = req?.body?.password;
  let enCryptStr  = CryptoJS.AES.encrypt(str, process.env.CryptoJSKey).toString();

  await SubAdmin.findOneAndUpdate(
    { _id: req.params.id },
    {
      ...req.body,
      // image: img_loc,
      password: enCryptStr,

      assignAccess: req.body.assignAccess,
    },
    { new: true }
  )
    .then((data) => {
      // console.log("data", data);
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        enCryptStr:enCryptStr,
        message: "Member profile updated successfully",
        data:data

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

const singleMemberProfile = async (req, res) => {
  SubAdmin.aggregate([
    {
      $match: {
        isDeleted: false,
        addedBy: new mongoose.Types.ObjectId(req.user._id),
        _id: new mongoose.Types.ObjectId(req.params.id),
      },
    },
    {
      $project: {
        __v: 0,
        _id: 1,
        isDeleted: 0,
        password: 0,
        createdOn: 0,
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
        message: "User profile get Successfully",
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

const deleteSubadmin = async (req, res) => {
  await SubAdmin.findOneAndUpdate(
    {
      addedBy: new mongoose.Types.ObjectId(req.user._id),
      _id: new mongoose.Types.ObjectId(req.params.id),
    },
    {
      isDeleted: true,
    }
  )
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "subadmin delete successfully",
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

const setSubAdminActivityStatus = async (req, res) => {
  var id = req.params.id;
  await SubAdmin.findById({ _id: id }).then(async (data) => {
    // console.log("data", data);
    // return false
    if (data.status === true) {
      console.log(true);

      await SubAdmin.findOneAndUpdate(
        { _id: id },
        { $set: { status: false } },
        { new: true }
      ).then((data) => {
        res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "subadmin has been made inactive.",
          // data: data,
        });
      });
    } else {
      await SubAdmin.findOneAndUpdate(
        { _id: id },
        { $set: { status: true } },
        { new: true }
      )
        .then((data) => {
          res.status(ResponseCode.errorCode.success).json({
            status: true,
            message: "subadmin has been made active.",
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

const randomEmailprev1 = async (req, res) => {
  var arr = [];
  // console.log("hiiii")

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
  await SubAdmin.aggregate([
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

      var emailArray = data.map(obj => obj.email);

      res.status(200).json({
        status: true,
        message: "get all existing gmail",
        data: emailArray,
      });
    })
    .catch((error) => {
      console.log(error)
      const errors = DBerror(error);
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error,Please try again",
        error: errors,
      });
    });
};
const randomEmail = async (req, res) => {
 
  SubAdmin.find({isDeleted:false},{email:1})
    .then((data) => {

      var emailArray = data.map(obj => obj.email);

      res.status(200).json({
        status: true,
        message: "get all existing gmail",
        data: emailArray,
      });
    })
    .catch((error) => {
      console.log(error)
      const errors = DBerror(error);
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error,Please try again",
        error: errors,
      });
    });
};


const checkEmail = async(req, res) => {

  SubAdmin.find({email:req.body.email})
          .then((data) => {
            console.log('++++++++++++++',data);
            if(data.length){
              return res.status(200).json({
                status: false,
                message: "Email id "+req.body.email+" already exit.",
                error: [],
              });
            }
            else{
              return res.status(200).json({
                status: true,
                message: "Success.",
                error: [],
              });
            }

            
          })
          .catch((error) => {           
            return res.status(200).json({
                status: false,
                message: "Database error.",
                error: [],
            });
          });
}


module.exports = {
  adminRegisterSubAdmin,
  getAllMemberProfile,
  updateMemberProfile,
  singleMemberProfile,
  subadminimage,
  deleteSubadmin,
  setSubAdminActivityStatus,
  randomEmail,
  checkEmail
};
