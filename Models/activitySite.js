var mongoose = require("mongoose");

var ActivitySiteSchema = new mongoose.Schema({

  siteName: {
    type: String,
  },
  image: {
    type: String,
  },
  cityId:{
    type:mongoose.Schema.Types.ObjectId
  },
  topPriority: {
    type: Number,
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
  },
  updatedOn: {
    type: Date,
  },
});
module.exports = mongoose.model("activitySite", ActivitySiteSchema);
// module.exports = mongoose.model("activitySitekms", ActivitySiteSchema);
