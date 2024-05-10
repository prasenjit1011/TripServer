const mongoose = require("mongoose");

const merchentCommissionSchema = new mongoose.Schema({

  marchentID: {
    type: mongoose.Schema.Types.ObjectId,
  },
  percentage: {
    type: Number,
  },
  activityID: {
    type: mongoose.Schema.Types.ObjectId,
  },
  orderID: {
    type: mongoose.Schema.Types.ObjectId,
  },
  activityAmount: {
    type: Number,
  },
  marchentCommissionAmount: {
    type: Number,
  },
  adminAmount: {
    type: Number,
  },
  bookingDate: {
    type: String,
  },
  bookingDateFormate: {
    type: Date
  },
  activityPrice:{
    type:Number
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


module.exports = mongoose.model("merchentCommission", merchentCommissionSchema);
