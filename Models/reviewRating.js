var mongoose = require("mongoose");

const reviewRatingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
  },
  activityDetailsId: {
    type: mongoose.Types.ObjectId,
  },
  avgRating: {
    type: Number,
  },
  review: {
    type: String,
  },
  guide: {
    type: Number,
  },
  valueForMoney: {
    type: Number,
  },
  service: {
    type: Number,
  },
  organization: {
    type: Number,
  },

  date: {
    type: Date,
  },
  // time: {
  //   type: Date,
  // },
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
    default: new Date(),
  },
});

module.exports = mongoose.model("reviewRating", reviewRatingSchema);
