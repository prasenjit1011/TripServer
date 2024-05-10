const mongoose = require("mongoose");

const merchantTopicSchema = new mongoose.Schema({
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

module.exports = mongoose.model("merchantTopic", merchantTopicSchema);
