const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
    topic: {
        type: String,
    },
    subTopic: {
        type: String,
    },
    description: {
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
        default: new Date(),
    },
    updatedOn: {
        type: Date,
        default: new Date(),
    },
});
module.exports = mongoose.model("contact", contactSchema);
