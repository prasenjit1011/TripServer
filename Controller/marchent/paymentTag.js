const mongoose = require("mongoose");
const PaymentTag = require("../../Models/paymentTag");
const { DBerror, InputError } = require("../../service/errorHandeler");
const ResponseCode = require("../../service/responseCode");

const getPaymentTag = async (req, res) => {

    return PaymentTag.aggregate([
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
                data: data.length > 0 ? data : null
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
    getPaymentTag,

}