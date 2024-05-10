const mongoose = require("mongoose");

const WishlistSchema = new mongoose.Schema({
  folderId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  activityId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  pastWishlist: {
    type: Boolean,
    default:false
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
module.exports = mongoose.model("wishlist", WishlistSchema);
