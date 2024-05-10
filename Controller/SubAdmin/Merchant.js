const mongoose = require("mongoose");
const passwordHash = require("password-hash");
// const User = require("../../Model/user");
const Merchant = require("../../Models/merchant");
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

function createToken(data) {
    return jwt.sign(data, "happy");
}

const subadminRegisterMerchant = async (req, res) => {
    SubAdmin.aggregate([

        {
            $match: {
                _id: req.user._id,
                assignAccess: { $in: ['add'] }
            }
        }

    ]).then(async (data) => {

        if (data.length == 0) {

            res.status(ResponseCode.errorCode.dataNotmatch).json({
                status: false,
                message: "You can not add merchant"
            });

        }
        else {
            const v = new Validator(req.body, {

                password: "required|minLength:8",
                email: "required|email",
                firstName: "required",
                lastName: "required",
                // image:"required"
            });
            let matched = await v.check().then((val) => val);
            if (!matched) {
                return res
                    .status(200)
                    .send({ status: false, error: v.errors, message: InputError(v.errors) });
            }


            const encrypter = crypto.createCipheriv("aes-256-cbc", Securitykey, iv);
            var encryptedMsg = encrypter.update(req.body.password, "utf8", "hex");
            encryptedMsg += encrypter.final("hex");

            let merchantData = {
                ...req.body,
                addedBy: new mongoose.Types.ObjectId(req.user._id),
                passwordCrypto: encryptedMsg,
                type: "subadmin",
                password: passwordHash.generate(req.body.password),
                token: createToken(req.body),
                createdOn: new Date(),
            };

            const subadmin = new Merchant(merchantData);
            subadmin
                .save()

            res.status(ResponseCode.errorCode.serverError).json({
                status: true,
                message: "Merchant created successfully"

            });
        }
    }).catch((error) => {

        const errors = DBerror(error);
        res.status(ResponseCode.errorCode.serverError).json({
            status: false,
            error: errors,
        });


    })

};

const getAllMemberProfile = async (req, res) => {

    var check = await SubAdmin.findOne({ assignAccess: { $in: ['view'] } }).exec()

    console.log("check", check)
    if (check != null ) {

        Merchant.aggregate([
            {
                $match: {
                    isDeleted: false,
                    
                    // addedBy: new mongoose.Types.ObjectId(req.user._id),
                },
            },
            {
                $project: {
                    __v: 0,
                    isDeleted: 0,
                    createdOn: 0,
                    password: 0,
                    token: 0,
                    updatedOn: 0,
                },
            },
        ])
            .then((data) => {
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
                return res.status(ResponseCode.errorCode.serverError).json({
                    status: false,
                    message: "Server error. Please try again.",
                    error: error,
                });
            });

    } else {
        return res.status(ResponseCode.errorCode.serverError).json({
            status: false,
            message: "You have no access to view merchant profile",

        });
    }



};

const updateMemberProfile = async (req, res) => {
    var check = await SubAdmin.findOne({ assignAccess: { $in: ['edit'] } }).exec()

    if(check!=null){
        Merchant.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(req.params.id) },
            {
                ...req.body,
                updatedOn: new Date(),
            }
        )
            .then((data) => {
                return res.status(ResponseCode.errorCode.success).json({
                    status: true,
                    message: "Merchant  profile updated successfully",
                });
            })
            .catch((error) => {
                return res.status(ResponseCode.errorCode.serverError).json({
                    status: false,
                    message: "Server error. Please try again.",
                    error: err,
                });
            });

    }else{
        return res.status(ResponseCode.errorCode.serverError).json({
            status: false,
            message: "You have no access to view merchant profile",

        });

    }


};

const deleteMemberProfile = async (req, res) => {

    var check = await SubAdmin.findOne({ assignAccess: { $in: ['delete'] } }).exec()

    if(check!=null){
        Merchant.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(req.params.id) },
            {
              $set:{
                isDeleted:true
              },
                updatedOn: new Date(),
            }
        )
            .then((data) => {
                return res.status(ResponseCode.errorCode.success).json({
                    status: true,
                    message: "Merchant  profile deleted successfully",
                });
            })
            .catch((error) => {
                return res.status(ResponseCode.errorCode.serverError).json({
                    status: false,
                    message: "Server error. Please try again.",
                    error: err,
                });
            });


    }else{

        return res.status(ResponseCode.errorCode.serverError).json({
            status: false,
            message: "You have no access to view merchant profile",

        });
 
    }

 
};

const singleMemberProfile = async (req, res) => {
    Merchant.aggregate([
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
                message: "Merchant profile get Successfully",
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

// const updateMemberStatus = async (req, res) => {
//   const v = new Validator(req.body, {
//     status: "required",
//   });
//   let matched = await v.check().then((val) => val);
//   if (!matched) {
//     return res
//       .status(200)
//       .send({ status: false, error: v.errors, message: InputError(v.errors) });
//   }

//   User.findOneAndUpdate(
//     { _id: new mongoose.Types.ObjectId(req.params.id) },
//     {
//       ...req.body,
//       updatedOn: new Date(),
//     }
//   )
//     .then((data) => {
//       return res.status(ResponseCode.errorCode.success).json({
//         status: true,
//         message: "User status updated successfully",
//       });
//     })
//     .catch((error) => {
//       return res.status(ResponseCode.errorCode.serverError).json({
//         status: false,
//         message: "Server error. Please try again.",
//         error: err,
//       });
//     });
// };

// const viewMemberBasedOnStatus = async (req, res) => {
//   if (req.body.status == "all") {
//     User.aggregate([
//       {
//         $match: {
//           isDeleted: false,
//           addedBy: new mongoose.Types.ObjectId(req.user._id),
//         },
//       },
//       {
//         $project: {
//           __v: 0,
//           isDeleted: 0,
//           createdOn: 0,
//           token: 0,
//           updatedOn: 0,
//         },
//       },
//     ])
//       .then((data) => {
//         for (let i = 0; i < data.length; i++) {
//           // console.log("passss", data[i].passwordCrypto)
//           const decrypter = crypto.createDecipheriv(
//             "aes-256-cbc",
//             Securitykey,
//             iv
//           );
//           var decryptedMsg = decrypter.update(
//             data[i].passwordCrypto,
//             "hex",
//             "utf8"
//           );
//           decryptedMsg += decrypter.final("utf8");
//           data[i].passwordCrypto = decryptedMsg;
//         }
//         return res.status(ResponseCode.errorCode.success).json({
//           status: true,
//           message: "Get All profile  Successfully",
//           data: data,
//         });
//       })
//       .catch((error) => {
//         return res.status(ResponseCode.errorCode.serverError).json({
//           status: false,
//           message: "Server error. Please try again.",
//           error: error,
//         });
//       });
//   } else {
//     User.aggregate([
//       {
//         $match: {
//           isDeleted: false,
//           addedBy: new mongoose.Types.ObjectId(req.user._id),
//           status: req.body.status,
//         },
//       },
//       {
//         $project: {
//           __v: 0,
//           isDeleted: 0,
//           createdOn: 0,
//           token: 0,
//           updatedOn: 0,
//         },
//       },
//     ])
//       .then((data) => {
//         for (let i = 0; i < data.length; i++) {
//           // console.log("passss", data[i].passwordCrypto)
//           const decrypter = crypto.createDecipheriv(
//             "aes-256-cbc",
//             Securitykey,
//             iv
//           );
//           var decryptedMsg = decrypter.update(
//             data[i].passwordCrypto,
//             "hex",
//             "utf8"
//           );
//           decryptedMsg += decrypter.final("utf8");
//           data[i].passwordCrypto = decryptedMsg;
//         }
//         return res.status(ResponseCode.errorCode.success).json({
//           status: true,
//           message: "Get All profile  Successfully",
//           data: data,
//         });
//       })
//       .catch((error) => {
//         return res.status(ResponseCode.errorCode.serverError).json({
//           status: false,
//           message: "Server error. Please try again.",
//           error: error,
//         });
//       });
//   }
// };


// const searchMember = async (req, res) => {
//   User.aggregate([
//     {
//       $match: {
//         userName: { $regex: ".*" + req.body.searchName + ".*", $options: "i" },
//         addedBy: req.user._id,
//       },
//     },
//     {
//       $project: {
//         createdOn: 0,
//         updatedOn: 0,
//         isDeleted: 0,
//         __v: 0,
//         token: 0,
//         password: 0,
//       },
//     },
//   ])
//     .then((data) => {
//       if (data.length > 0) {
//         for (let i = 0; i < data.length; i++) {
//           const decrypter = crypto.createDecipheriv(
//             "aes-256-cbc",
//             Securitykey,
//             iv
//           );
//           var decryptedMsg = decrypter.update(
//             data[i].passwordCrypto,
//             "hex",
//             "utf8"
//           );
//           decryptedMsg += decrypter.final("utf8");
//           data[i].passwordCrypto = decryptedMsg;
//         }

//         return res.status(ResponseCode.errorCode.success).json({
//           status: true,
//           message: "Get all matched member Successfully",
//           data: data,
//         });

//       }
//       else {

//         return res.status(ResponseCode.errorCode.dataNotmatch).json({
//           status: false,
//           message: "No data found",
//           data: 0,
//         });
//       }



//     })
//     .catch((error) => {
//       return res.status(ResponseCode.errorCode.serverError).json({
//         status: false,
//         message: "Server error. Please try again.",
//         error: error,
//       });
//     });
// };


const merchantimage = async (req, res) => {

    let uploadDAta = await S3.doPDFUpload(req, "merchant/image/");
    if (uploadDAta.status) {
        res.send(uploadDAta);
    } else {
        res.send(uploadDAta);
    }
}


module.exports = {
    subadminRegisterMerchant,
    getAllMemberProfile,
    updateMemberProfile,
    singleMemberProfile,
    merchantimage,
    deleteMemberProfile
    //   updateMemberStatus,
    //   viewMemberBasedOnStatus,

    //   searchMember,



};
