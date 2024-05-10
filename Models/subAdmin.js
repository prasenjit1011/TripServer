var mongoose = require("mongoose");
var passwordHash = require("password-hash");

const SubAdminSchema = new mongoose.Schema({
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
  },
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },

  image: {
    type: String,
  },
  email: {
    type: String,
    // unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  passwordCrypto: {
    type: String,
  },
  tabPermission: {
    type: Array,
  },

  token: {
    type: String,

    unique: true,
  },
  status:{
    type: Boolean,
    default: true,
  },
  isActive: {
    type: Boolean,
  },
  assignAccess: {
    type: Array,
  },
  country: {
    type: String,
  },
  userType:{
    type:String,
    default:"subadmin"
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

SubAdminSchema.methods.comparePassword = function (candidatePassword) {
  return passwordHash.verify(candidatePassword, this.password);
};

module.exports = mongoose.model("admin", SubAdminSchema);
