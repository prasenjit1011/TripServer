var mongoose = require('mongoose')


const ContactIssueSchema = new mongoose.Schema({
   
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    merchantId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    message: {
        type: String,
    },
    file: {
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
    }
});


module.exports = mongoose.model('contactIssue', ContactIssueSchema);