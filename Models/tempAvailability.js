const mongoose = require("mongoose");

const Tempavailabilities = new mongoose.Schema({
  addedById: {
    type: mongoose.Types.ObjectId,
  },
  activityDetailsId: {
    type: mongoose.Types.ObjectId,
  },
  availablityID: {
    type: mongoose.Types.ObjectId,
  },
  tourDate: {
    type: String,
  },
  changePrice: {
    type: Number,
  },
  // seatPercentage: {
  //   type: Number,
  // },
  cutoffTime: {
    type: String,
  },
  remeningUser:{
    type: Number,
  },
  isApprove:{
    type: Boolean,
    default: true
  },
  shift:{
    type:String
  },
  time:{
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
module.exports = mongoose.model("tempavailabilities", Tempavailabilities);
