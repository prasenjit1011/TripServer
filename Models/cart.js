const mongoose = require("mongoose");

const CartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  activityId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  giftId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  totalPerson: {
    type: Number,
    required: true,
  },
  totalPrice: {
    type: Number
  },
  statingTime: {
    type: String,
  },
  bookedOn: {
    type: String,
    required: true,
  },
  participentType: {
    type: Array
  },
  status: {
    type: Boolean,
    default: true,
  },
  currentStatus:{
    type:String,

    default:"available"
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

module.exports = mongoose.model("Cart", CartSchema);
