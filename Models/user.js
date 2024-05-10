const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
    googleId:{
        type:String
    },
    email: {
        type: String
    },
    mobileNo: {
        type: String
    },
    dob: {
        type: String
    },
    language: {
        type:  mongoose.Schema.Types.ObjectId
    },
    currency: {
        type: mongoose.Schema.Types.ObjectId
    },
    country: {
        type: String
    },
    password: {
        type: String
    },
    countryCode: {
        type: String
    },
    token: {
        type: String
    },
    status: {
        type: Boolean,
        default: true
    },
    bookingStatus:{
        type:Boolean,
        default:false
    },
    reviewStatus:{
        type:Boolean,
        default:false
    },
    dealsStatus:{
        type:Boolean,
        default:false
    },
    deviceToken: {
        type: String
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
        default: new Date(),
    },
});

module.exports = mongoose.model('User', UserSchema);