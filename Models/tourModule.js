var mongoose = require("mongoose");

const tourModuleSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  cityId:{
    type:mongoose.Types.ObjectId
  },
  countryId:{
    type:mongoose.Types.ObjectId
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

module.exports = mongoose.model("tourModule", tourModuleSchema);
