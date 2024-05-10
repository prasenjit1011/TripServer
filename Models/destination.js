var mongoose = require("mongoose");

const DestinationSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  siteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref:'activitySite'
  },
  status: {
    type: Boolean,
    default: true,
  },
  topPriority:{
    type: Number
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

module.exports = mongoose.model("destination", DestinationSchema);
