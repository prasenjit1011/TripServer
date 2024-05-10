const mongoose = require("mongoose")

const giftSchema = new mongoose.Schema({
    price: {
        type: Number
    },
    image:{
        type:String
    },
    status: {
        type: Boolean,
        default: true
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
})

module.exports = mongoose.model("gift", giftSchema);