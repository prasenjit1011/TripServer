const mongoose = require("mongoose")

const legalNoticeSchema = new mongoose.Schema({
    address: {
        type:String
    },
    managmentPersonName: {
        type:String
    },
    contactInformation: {
        type:String
    },
    comapnyRegistration: {
        type:String
    },
    VATRegistrationNo: {
        type:String
    },
    isDeleted: {
        type: Boolean,
        default:false
    },
    status: {
        type: Boolean,
        default: true
    },
    createdOn: {
        type: Date,
        default: new Date(),
    },
    updatedOn: {
        type: Date,
        default: new Date(),
    },
})
module.exports = mongoose.model('legalNotice', legalNoticeSchema);