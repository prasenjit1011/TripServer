const mongoose = require("mongoose");

const userTopicSchema = new mongoose.Schema({
  topicName: {
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

module.exports = mongoose.model("userTopic", userTopicSchema);
