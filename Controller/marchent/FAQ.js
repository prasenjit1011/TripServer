const mongoose = require("mongoose");
const FAQ = require("../../Models/FAQ");
const FAQType = require("../../Models/FAQType");
const ResponseCode = require("../../service/responseCode");
const { Validator } = require("node-input-validator");
const { DBerror, InputError } = require("../../service/errorHandeler");
const S3 = require("../../service/s3");


// const viewFAQ = async (req, res) => {
//     await FAQ
//         .aggregate([
//             {
//                 $match: {
//                     isDeleted: false,

//                 },
//             },
//             { $group: { _id: "$FAQTypeId" } },
//             {
//                 $lookup: {
//                     from: "faqs",
//                     localField: "_id",
//                     foreignField: "FAQTypeId",
//                     pipeline: [
//                         {
//                             $lookup: {
//                                 from: "faqtypes",
//                                 localField: "FAQTypeId",
//                                 foreignField: "_id",
//                                 pipeline: [
//                                     {
//                                         $project: {
//                                             _id: 0,
//                                             name: 1
//                                         }
//                                     }
//                                 ],
//                                 as: "type"
//                             }
//                         },
//                         {
//                             $unwind: {
//                                 path: "$type", preserveNullAndEmptyArrays: true
//                             }
//                         },
//                         {
//                             $addFields: {
//                                 typeName: "$type.name"
//                             }
//                         },

//                         {
//                             $project: {
//                                 isDeleted: 0,
//                                 createdOn: 0,
//                                 updatedOn: 0,
//                                 type: 0,
//                                 __v: 0,
//                             },
//                         },


//                     ],
//                     as: "FAQ"
//                 }
//             },

//         ])
//         .then((data) => {
//             return res.status(ResponseCode.errorCode.success).json({
//                 status: true,
//                 message: "get all FAQ data",
//                 data: data,
//             });
//         })
//         .catch((error) => {
//             return res.status(ResponseCode.errorCode.serverError).json({
//                 status: false,
//                 message: "Error occur",
//                 error: error,
//             });
//         });
// };

const viewFAQ = async (req, res) => {
    await FAQType
        .aggregate([
            {
                $match: {
                    isDeleted: false,

                },
            },
         
            {
                $lookup: {
                    from: "faqs",
                    localField: "_id",
                    foreignField: "FAQTypeId",
                    pipeline: [
                        {
                            $project: {
                                isDeleted: 0,
                                createdOn: 0,
                                updatedOn: 0,
                                type: 0,
                                __v: 0,
                            },
                        },
                    ],
                    as: "FAQ"
                }
            },
          
            {
                $project: {
                    isDeleted: 0,
                    createdOn: 0,
                    updatedOn: 0,
                    type: 0,
                    __v: 0,
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
            return res.status(ResponseCode.errorCode.success).json({
                status: true,
                message: "get all FAQ data",
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


module.exports = {

    viewFAQ
};
