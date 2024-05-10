const mongoose = require("mongoose")

const ContactQuestionSchema = new mongoose.Schema({
    topicId:{
        type: mongoose.Schema.Types.ObjectId,
    },
    questions: {
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

module.exports = mongoose.model("MerchentQuestion", ContactQuestionSchema);