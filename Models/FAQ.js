const mongoose = require("mongoose")

const HelpFAQSchema = new mongoose.Schema({
    question: {
        type: String
    },
    FAQTypeId:{
        type:mongoose.Types.ObjectId,
    },
    userType: {
        type: String,
    },
    answer: {
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

module.exports = mongoose.model("FAQ", HelpFAQSchema);