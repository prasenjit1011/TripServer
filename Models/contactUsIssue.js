var mongoose = require("mongoose");

var ContactUsIssue = new mongoose.Schema({
  email: String,
  name: String,
  remarks: String,
  isDeleted: Boolean,
  createdOn: Date,
  updatedOn: Date,
});

module.exports = mongoose.model("contactUsIssue", ContactUsIssue);
