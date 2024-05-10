var mongoose = require("mongoose");

const SectionSchema = new mongoose.Schema({
  activityTypeId: {
    type: mongoose.Types.ObjectId,  
  },
  subType: {
    type: String,   // only has 3 option 
  },
  title: {
    type: String,
  },
  image: {
    type: String,
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

module.exports = mongoose.model("section", SectionSchema);

