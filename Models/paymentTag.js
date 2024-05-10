const mongoose = require("mongoose");

const paymentTagSchema = new mongoose.Schema({

  paymentTag: {
    type: String,
  },
  paymentTagColor: {
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

module.exports = mongoose.model("paymentTag", paymentTagSchema);
