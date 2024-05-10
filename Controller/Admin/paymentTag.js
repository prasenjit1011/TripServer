const mongoose = require("mongoose");
const PaymentTag = require("../../Models/paymentTag");
const { DBerror, InputError } = require("../../service/errorHandeler");
const ResponseCode = require("../../service/responseCode");


const addPayementTag = (req, res) => {

    let paymentData = {
        ...req.body,
        createdOn: new Date()
    }

    new PaymentTag(paymentData).save()
        .then((data) => {
            res.status(ResponseCode.errorCode.success).json({
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


const getPaymentTag = (req, res) => {

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
                data: data.length > 0 ? data: null
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

const editPaymentTag = async (req, res) => {
    await PaymentTag
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
};

const deletePaymentTag = async (req, res) => {

    await PaymentTag
        .findOneAndUpdate(
            {
                _id: new mongoose.Types.ObjectId(req.params.id),
            },
            {
                isDeleted: true,
            }
        )
        .then((data) => {
            return res.status(ResponseCode.errorCode.success).json({
                status: true,
                message: "Delete successfully",
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
    addPayementTag,
    getPaymentTag,
    editPaymentTag,
    deletePaymentTag
}