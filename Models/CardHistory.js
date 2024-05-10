const mongoose = require("mongoose");

const CardHistorySchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  recieverId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  receiverEmail: {
    type: String,
  },
  activityId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  amount: {
    type: Number,
  },
  giftCode: {
    type: String,
  },
  giftApplyLink:{
    type: String
  },
  personalMsg: {
    type: String,
  },
  expirationDate: {
    type: Date,
    required: true,
  },
  isRedeemed: {
    type: Boolean,
    default: false,
  },
  sendToMail:{
    type:Boolean,
    default:false
  },
  status: {
    type: Boolean,
    default: true,
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

module.exports = mongoose.model("cardHistory", CardHistorySchema);
