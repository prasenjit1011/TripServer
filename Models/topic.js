const mongoose = require("mongoose")

const TopicSchema = new mongoose.Schema({
    name: {
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

module.exports = mongoose.model("topic", TopicSchema);