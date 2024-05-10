const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Types.ObjectId,
  },
  userId: {
    type: mongoose.Types.ObjectId,
  },
  email: {
    type: String
  },
  giftCode: {
    type: String,
  },
  expirationDate: {
    type: Date,
  },
  personalMsg: {
    type: String,
  },
  activityDetailsId: {
    type: mongoose.Types.ObjectId,
  },
  bookingDate: {
    type: String,
  },
  alpfaNueID: {
    type: String,
  },
  bookingTime: {
    type: String,
  },
  reviewStatus: {
    type: String,
  },
  totalTourPerson: {
    type: Number,
  },
  amount: {
    type: Number,
  },
  participentType: [
    {
      pertype: String,
      person: Number,
      age: String,
      perPerson: Number,
      typeId: mongoose.Types.ObjectId,
    },
  ],
  isDeleted: {
    type: Boolean,
    default: false,
  },
  bookingStatus: {
    type: String,
    default: "pending",
  },
  bookingType: {
    type: String,
  },
  sendToEmail: {
    type: String,
    default: "",
  },
  paymentMode: {
    type: String,
    default: "online",
  },

  cancelledBy: {
    type: mongoose.Types.ObjectId,
  },

  reason: {
    type: String
  },

  description: {
    type: String
  },

  paymentStatus: {
    type: String
  },
  createdOn: {
    type: Date,
  },
  updatedOn: {
    type: Date,
  },
});
module.exports = mongoose.model("userBooking", bookingSchema);
