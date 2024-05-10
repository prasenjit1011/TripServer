const mongoose = require("mongoose");

const participentSchema = new mongoose.Schema({
  addedById:{
    type: mongoose.Types.ObjectId,
  },
  activityDetailsId: {
    type: mongoose.Types.ObjectId,
  },
  participentType: {
    type: [
      {
        pertype: String,
        age: String,
        price: Number,
        discountPrice:{
            type:Number,
            default:0
        }
      },
    ],
  },
  addedBy:{
    type:String
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
    default: new Date(),
  },
});

module.exports = mongoose.model("participent", participentSchema);
