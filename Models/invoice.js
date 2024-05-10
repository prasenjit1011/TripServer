var mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
    {
        invoiceNo: {
            type: String,
        },
        invoiceUrl: {
            type: String,
        },
        marchantId: {
            type: mongoose.Schema.Types.ObjectId,
        },
        bookingTotalAmmount: {
            type: String,
        },
        merchentGetAmmount: {
            type: String,
        },
        adminGetAmmount: {
            type: String,
        },
        invoiceDate: {
            type: String
        },
        status: {
            type: Boolean,
            default: true,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        createdOn: {
            type: Date,
            default: new Date(),
        },
        updatedOn: {
            type: Date,
            default: new Date(),
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("invoice", invoiceSchema);
