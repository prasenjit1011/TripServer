const mongoose = require("mongoose");
const legalNoticeModel = require("../../Models/legalNotice");
const ResponseCode = require("../../service/responseCode");
const { Validator } = require("node-input-validator");
const { DBerror, InputError } = require("../../service/errorHandeler");

// const addLegalNotice = async (req, res) => {
//   await legalNoticeModel
//     .aggregate([
//       {
//         $match: { status: true },
//       },
//       {
//         $project: {
//           _id: 1,
//         },
//       },
//     ])
//     .then((data) => {
//       // console.log("contactData", data);
//       if (data.length > 0) {
//         res.status(404).json({
//           status: false,
//         //   data: data,
//           message: "person to send legal notice already added",
//         });
//       } else {
//         const legalNoticeData = {
//           ...req.body,
//         };
//         new legalNoticeModel(legalNoticeData).save().then((data) => {
//           return res.status(ResponseCode.errorCode.success).json({
//             status: true,
//             message: "legalnotice added successfully",
//           });
//         });
//       }
//     })
//     .catch((error) => {
//       const errors = DBerror(error);
//       return res.status(ResponseCode.errorCode.serverError).json({
//         status: false,
//         message: "Server error,Please try again",
//         error: errors,
//       });
//     });
// };

const addLegalNotice=async (req,res)=>{
  legalNoticeModel
  .find({})
  .then((data) => {

      console.log({data})
    if (data.length > 0) {
      legalNoticeModel.findOneAndUpdate(
        {
          _id: data[0]._id,
        },
        {
          ...req.body,
        }
      ).exec()
    } else {
      const legal = {
        ...req.body,
      };
      new legalNoticeModel(legal).save();
    }
    return res.status(ResponseCode.errorCode.success).json({
      status: true,
      message: "Legal notice  added successfully",
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
const viewLegalNotice = async (req, res) => {
  await legalNoticeModel
    .aggregate([
      {
        $match: {
          isDeleted: false,
          status: true,
        },
      },
      {
        $project: {
          createdOn: 0,
          updatedOn: 0,
          isDeleted:0,
          status:0,
          __v: 0,
        },
      },
    ])
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "View legal Notice",
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

const editlegalNotice = async (req, res) => {
  await legalNoticeModel
    .findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(req.params.id),
      },
      {
        ...req.body,
      }
    )
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "legalnotice update successfully",
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



module.exports = {
  addLegalNotice,
  viewLegalNotice,
  editlegalNotice,

};
