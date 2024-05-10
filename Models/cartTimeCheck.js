const mongoose = require("mongoose");

const cartTimeCheckSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    cartId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    activityId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    bookDateFor: {
        type: String,
    },
    bookTimeFor: {
        type: String,
    },

    totalPerson: {
        type: Number,
    },
    currentDate: {
        type: String,
    },
    currentTime: {
        type: String,
    },
    timeAfter10Minutes: {
        type: String,
    },   

    isDeleted: {
        type: Boolean,
        default: false,
    },
    status: {
        type: Boolean,
        default: true,
    },
    createdOn: {
        type: Date,
        
    },
    updatedOn: {
        type: Date,
       
    },
});

module.exports = mongoose.model("cartTimeCheck", cartTimeCheckSchema);
