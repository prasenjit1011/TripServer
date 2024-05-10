const mongoose = require("mongoose");

const aboutUsSchema = new mongoose.Schema({
  // image: {
  //   type: String,
  // },
  topic: {
    type: String,
  },
  subTopic:{
    type:Array
  },
  // subTopic: {
  // type: String,
  // },
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
module.exports = mongoose.model("aboutUs", aboutUsSchema);
