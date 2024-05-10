var mongoose = require("mongoose");

const CurrencySchema = new mongoose.Schema({
  symbol: {
    type: String,
  },
  name: {
    type: String,
  },
  name_plural: {
    type: String,
  },
  symbol_native: {
    type: String,
  },
  decimal_digits: {
    type: Number,
  },
  rounding: {
    type: Number,
  },
  code: {
    type: String,
  },


});

module.exports = mongoose.model("currency", CurrencySchema);
