const mongoose = require("mongoose");

const careerSchema = new mongoose.Schema({
    image: {
        type: String,
    },
    category: {
        type: String,
    },
    subCategory: {
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

module.exports = mongoose.model("career", careerSchema);
