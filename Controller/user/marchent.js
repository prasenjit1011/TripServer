const mongoose = require("mongoose");
const Merchant = require("../../Models/merchant");
const ResponseCode = require("../../service/responseCode");
const { Validator } = require("node-input-validator");
const { DBerror, InputError } = require("../../service/errorHandeler");
const crypto = require("crypto");
const Securitykey = "12345678123456781234567812345678";
const iv = "1234567812345678";

const singleMemberProfile = async (req, res) => {
    Merchant.aggregate([
      {
        $match: {
          isDeleted: false,
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
        console.log(data)
        // const decrypter = crypto.createDecipheriv("aes-256-cbc", Securitykey, iv);
        // var decryptedMsg = decrypter.update(
        //   data[0].passwordCrypto,
        //   "hex",
        //   "utf8"
        // );
        // decryptedMsg += decrypter.final("utf8");
        // data[0].passwordCrypto = decryptedMsg;
  
        return res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "Merchant profile get Successfully",
          data: data,
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

  module.exports = {
    singleMemberProfile
  }


