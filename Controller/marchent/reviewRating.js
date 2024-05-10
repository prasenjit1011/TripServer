const mongoose = require("mongoose");
const reviewRatingModel = require("../../Models/reviewRating");
const activityDetailsModel = require("../../Models/activityDetails");
const ResponseCode = require("../../service/responseCode");
const { Validator } = require("node-input-validator");
const { DBerror, InputError } = require("../../service/errorHandeler");



const viewReviewRating = async (req, res) => {
    console.log("req.user._id====",req.user._id);
    try {
        const data = await activityDetailsModel.aggregate([
            {
                $match: {
                    isDeleted: false,
                    status: true,
                    addedByid: new mongoose.Types.ObjectId(req.user._id),
                    // addedByid: req.user._id,
                },
            },
            {
                $lookup: {
                    from: "reviewratings",
                    localField: "_id",
                    foreignField: "activityDetailsId",
                    pipeline: [
                        {
                            $match: {
                                isDeleted: false,
                            },
                        },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'userId',
                                foreignField: '_id',
                                pipeline: [
                                    {
                                        $match: {
                                            isDeleted: false,
                                        },
                                    },
                                    {
                                        $project: {
                                            firstName: 1,
                                            lastName: 1,
                                        },
                                    },
                                ],
                                as: 'userName',
                            },
                        },
                        {
                            $unwind: {
                                path: "$userName",
                                preserveNullAndEmptyArrays: true,
                            },
                        },
                        {
                            $addFields: {
                                submittedBy: {
                                    $concat: [
                                        "$userName.firstName",
                                        " ",
                                        "$userName.lastName",
                                    ],
                                },
                                submittedDate: "$updatedOn",
                                submittedRating: "$avgRating",
                                submittedComment: "$review",
                                userImage: null
                            },
                        },
                        // {
                        //     $project: {
                        //         _id: 0,
                        //         submittedBy: 1,
                        //         submittedRating: 1,
                        //         submittedDate: 1,
                        //         submittedComment: 1,
                        //         userImage:1
                        //     },
                        // },
                    ],
                    as: "activityReview",
                },
            },
            {
                $addFields: {
                    activityName: "$activityTitle",
                    startActivityDate: "$startDate",
                    reviewRating: {
                        $avg: "$activityReview.submittedRating",
                    },
                },
            },
            {
                $project: {
                    activityName: 1,
                    startActivityDate: 1,
                    reviewRating: 1,
                    activityReview: 1,
                },
            },
        ]);

        return res.status(ResponseCode.errorCode.success).json({
            status: true,
            message: "Review rating fetched successfully!",
            length: data.length,
            data: data,
        });
    } catch (error) {
        console.log(error, "error====");
        const errors = DBerror(error);
        return res.status(ResponseCode.errorCode.serverError).json({
            status: false,
            message: "Server error, please try again",
            error: errors,
        });
    }
};



module.exports = {
    viewReviewRating,
};
