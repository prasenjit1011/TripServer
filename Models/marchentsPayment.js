const mongoose = require('mongoose')
const MarchentsPaymentSchema = mongoose.Schema({
    marchantId:{
        type:String
    },
    invoiceNo:{
        type:Number
    },
    merchentGetAmmount:{
        type:Number
    },
    paymentUrl:{
        type:String
    },
    status: {
        type: Boolean,
        default: true
    },
    paymentStatus: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    createdOn: {
        type: Date,
        default: new Date(),
    },
    updatedOn: {
        type: Date,
    },

})

module.exports = mongoose.model("marchentspayment", MarchentsPaymentSchema);
