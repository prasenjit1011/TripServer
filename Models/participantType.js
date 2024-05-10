const mongoose = require("mongoose");

const participantTypeSchema = new mongoose.Schema({

  type: {
    type: String,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  status: {
    type: Boolean,
    default: true,
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
module.exports = mongoose.model("participantType", participantTypeSchema);
