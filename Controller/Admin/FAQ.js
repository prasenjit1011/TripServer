const mongoose = require("mongoose");
const HelpFAQ = require("../../Models/FAQ");
const FAQType = require("../../Models/FAQType");
const ResponseCode = require("../../service/responseCode");
const { Validator } = require("node-input-validator");
const { DBerror, InputError } = require("../../service/errorHandeler");


const addHelpFAQ = async (req, res) => {


    const faqData = {
        ...req.body,
    };
    new HelpFAQ(faqData)
        .save()
        .then((data) => {
            return res.status(ResponseCode.errorCode.success).json({
                status: true,
                message: "Queation added sucessfully",
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

const addFAQType = async (req, res) => {


    const faqData = {
        ...req.body,
    };
    new FAQType(faqData)
        .save()
        .then((data) => {
            return res.status(ResponseCode.errorCode.success).json({
                status: true,
                message: "FAQ type added sucessfully",
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

const viewFAQTypes = async (req, res) => {
    await FAQType
        .aggregate([
            {
                $match: {
                    isDeleted: false,

                },
            },

            {
                $project: {
                    isDeleted: 0,
                    createdOn: 0,
                    updatedOn: 0,
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

const viewFAQ = async (req, res) => {
    await HelpFAQ
        .aggregate([
            {
                $match: {
                    isDeleted: false,

                },
            },
            { $group: { _id: "$FAQTypeId" } },
            {
                $lookup: {
                    from: "faqs",
                    localField: "_id",
                    foreignField: "FAQTypeId",
                    pipeline: [
                        {
                            $lookup: {
                                from: "faqtypes",
                                localField: "FAQTypeId",
                                foreignField: "_id",
                                pipeline: [
                                    {
                                        $project: {
                                            _id: 0,
                                            name: 1
                                        }
                                    }
                                ],
                                as: "type"
                            }
                        },
                        {
                            $unwind: {
                                path: "$type", preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $addFields: {
                                typeName: "$type.name"
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


                    ],
                    as: "FAQ"
                }
            },

            {
                $project:{
                    _id:0
                }
            }


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

const editFAQ = async (req, res) => {
    await HelpFAQ
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
                message: "FAQ updated successfully",
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

    addHelpFAQ,
    addFAQType,
    viewFAQ,
    editFAQ,
    viewFAQTypes



};
