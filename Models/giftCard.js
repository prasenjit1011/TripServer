const mongoose = require("mongoose");

const giftCardSchema = new mongoose.Schema({
  giftId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  activityId: {
    type: mongoose.Schema.Types.ObjectId,
  },  
  amount: {
    type: Number,
  },
  giftApplyLink:{
    type: String
  },
  giftCode:{
    type:String
  },
  personalMsg: {
    type: String,
  },
  expirationDate: {
    type: Date,
    required: true,
  },
  cuponcode: {
    type: String,
  },
  isRedeemed: {
    type: Boolean,
    default: false,
  },
  bookingStatus:{
    type: Boolean,
    default: false,
  },
  GiftCertificate: {
    type: Boolean,
    default: false,
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

module.exports = mongoose.model("giftCard", giftCardSchema);
