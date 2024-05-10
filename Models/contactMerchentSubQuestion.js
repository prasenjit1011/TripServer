const mongoose = require("mongoose");

const ContactSubQuestionSchema = new mongoose.Schema({
  topicId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  subQuestion: {
    type: [
        { 
            subDesc: String, 
            subItem: Array 
        }
    ],
  },
  link:{
    type:String
  },
  image:{
    type:String
  },
  isDeleted: {
    type: Boolean,
    default: false,
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

module.exports = mongoose.model("MerchentSubQuestion", ContactSubQuestionSchema);
