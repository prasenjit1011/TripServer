const mongoose=require('mongoose')
const GiftQuestionSchema = mongoose.Schema({
    question:{
        type:String
    },
    answer:{
        type:String
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
    },
})

module.exports = mongoose.model('giftquestion',GiftQuestionSchema)