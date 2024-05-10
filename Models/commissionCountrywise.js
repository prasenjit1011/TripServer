const mongoose = require("mongoose");
const CommissionCountrywiseSchema = mongoose.Schema({
  countryID:{
    type: mongoose.Schema.Types.ObjectId,
  },

  commissionType: {
    enum:["countryWise","global","individualLevel"],
    type: String,
  },

  countryID: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    required:false,
  },

  commissionPercentage:{
    type: Number,
    default: null,
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
    default: new Date()
  },
});


module.exports=mongoose.model('CommissionCountrywise',CommissionCountrywiseSchema)