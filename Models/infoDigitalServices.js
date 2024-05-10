const mongoose = require("mongoose")

const infoDigitalServicesSchema = new mongoose.Schema({
    topic: {
        type: String
    },
    desc: {
        type: String,
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

module.exports = mongoose.model("infoDigitalServices", infoDigitalServicesSchema);