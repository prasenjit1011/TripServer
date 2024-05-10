const mongoose = require("mongoose");
const EmailSchema = require("../../Models/email");
const ResponseCode = require("../../service/responseCode");
const { DBerror, InputError } = require("../../service/errorHandeler");


const manageEmail = (req, res) => {


    EmailSchema.aggregate([
        {
            $match: {
                isDeleted: false
            }
        },
        {
            $project: {
                _id: 1
            }
        }
    ])
        .then((data) => {


            if (data.length > 0) {

                EmailSchema.findOneAndUpdate(
                    {
                        isDeleted: false
                    },
                    {
                        $set: {
                            email: req.body.email
                        }
                    }
                )
                    .then((data) => {
                        return res.status(ResponseCode.errorCode.success).json({
                            status: true,
                            message: "Updated successfully",
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

            } else {


                let emailData = {
                    ...req.body,
                    createdOn: new Date()
                }

                new EmailSchema(emailData)
                    .save()
                    .then((data) => {
                        return res.status(ResponseCode.errorCode.success).json({
                            status: true,
                            message: "Added successfully",
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
        })
        .catch((error) => {
            const errors = DBerror(error);
            return res.status(ResponseCode.errorCode.serverError).json({
                status: false,
                message: "Server error,Please try again",
                error: errors,
            });
        })

}

const deleteEmail = (req, res) => {

    EmailSchema.deleteOne({ isDeleted: false })
        .then((data) => {
            res.status(ResponseCode.errorCode.success).json({
                status: true,
                message: "Deleted successfully"
            })
        })
        .catch((error) => {
            res.status(ResponseCode.errorCode.serverError).json({
                status: false,
                message: "Server error, Please try again later"
            })
        })
}

const getEmail = async (req, res) => {

    return EmailSchema.aggregate([
        {
            $match: {
                isDeleted: false
            }
        },
        {
            $project: {
                isDeleted: 0,
                status: 0,
                createdOn: 0,
                updatedOn: 0,
                __v: 0
            }
        }
    ])
        .then((data) => {
            res.status(ResponseCode.errorCode.success).json({
                status: true,
                message: "Get all the data successfully",
                data: data.length > 0 ? data[0] : null
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


module.exports = {
    manageEmail,
    deleteEmail,
    getEmail
}