const mongoose = require("mongoose")

const EmailSchema = new mongoose.Schema({

    email: {
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
})

module.exports = mongoose.model("Email", EmailSchema);