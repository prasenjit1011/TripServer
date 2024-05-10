const mongoose = require("mongoose")
const marchentsNotificationSchema = new mongoose.Schema({
    title: {
        type: String,
        require: true,
    },
    description: {
        type: String,
        require: true
    },
    marchentsID: {
        type: mongoose.Schema.Types.ObjectId,
        require: true
    },
    // notification_type: {
    //     type: String,
    // },
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
        // default: new Date(),
    },
})

module.exports = mongoose.model("marchentsnotification", marchentsNotificationSchema);