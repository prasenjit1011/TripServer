const mongoose = require("mongoose");
const CxommissionPercentageSchema = mongoose.Schema({


  merchantID:{
    type: mongoose.Schema.Types.ObjectId,
  },

  commissionType: {
    enum:["countryWise","global","individualLevel"],
    type: String,
  },

  commissionPercentage:{
    type: Number,
    default: null,
  },

  countryWisePercentage: [{
    countryID: {
      type: mongoose.Schema.Types.ObjectId,
    },
    commissionPercentage: {
      type: Number,
    },
  }],
  
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

module.exports=mongoose.model('CommissionPercentage',CxommissionPercentageSchema)
