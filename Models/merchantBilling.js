const mongoose = require("mongoose");

const merchantBillingSchema = new mongoose.Schema({
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  month: {
    type: Number,
  },
  year: {
    type: Number,
  },
  billingLink: {
    type: String,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  createdOn: {
    type: Date,
  },
  updatedOn: {
    type: Date,
  },
});

module.exports = mongoose.model("merchantBilling", merchantBillingSchema);
