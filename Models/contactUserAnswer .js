const mongoose = require("mongoose");

const ContactAnswerSchema = new mongoose.Schema({
  topicId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  answer: {
    type: String,
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

module.exports = mongoose.model("UserAnswer", ContactAnswerSchema);
