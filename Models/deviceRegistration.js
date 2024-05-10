const mongoose = require("mongoose")
const deviceRegistrationSchema = new mongoose.Schema({
    deviceId: {
        type: String,
        require: true,
    },
    deviceToken: {
        type: String,
        require: true
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

module.exports = mongoose.model("deviceRegistration", deviceRegistrationSchema);