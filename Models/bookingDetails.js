const mongoose = require("mongoose");

const BookingDetailsSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Types.ObjectId,
  },
  userId: {
    type: mongoose.Types.ObjectId,
  },
  email: {
    type: String,
  },
  bookingDate: {
    type: String,
  },
  bookingTime: {
    type: String,
  },
  alpfaNueID:{
    type: String,
  },
  actualPrice: {
    type: Number,
  },
  discountedPrice: {
    type: Number,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  // bookingStatus: {
  //   type: String,
   
  // },
  paymentMode: {
    type: String,
    default: "online",
  },
  createdOn: {
    type: Date,
  },
  updatedOn: {
    type: Date,
  },
});
module.exports = mongoose.model("bookingDetails", BookingDetailsSchema);
