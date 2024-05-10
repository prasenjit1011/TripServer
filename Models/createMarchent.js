const mongoose = require("mongoose");
const CreateMarchentsSchema = mongoose.Schema({
  country: {
    type: String,
  },

  city: {
    type: String,
  },
  userID: {
    type: mongoose.Schema.Types.ObjectId
},
  zip: {
    type: Number,
  },

  email: {
    type: String,
  },
  countryCode: {
    type: String
  },
  password: {
    type: String,
  },

  firstName: {
    type: String,
  },

  lastName: {
    type: String,
  },

  mobile: {
    type: Number,
  },
  websitelink: {
    type: String,
  },

  facebookPage: {
    type: String,
  },
  status: {
    type: Boolean,
    default: true,
  },
  isApprove: {
    type: Boolean,
    default: false,
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
  },
});

module.exports = mongoose.model("createmarchents", CreateMarchentsSchema);
