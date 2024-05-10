var mongoose = require("mongoose");
var passwordHash = require("password-hash");

const MerchantSchema = new mongoose.Schema({
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
  },
  langId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  commisionPercentage: {
    type: Number,
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
  isApproval: {
    type: Boolean,
    default: false,
  },
  rejectedStatus: {
    type: Boolean,
    default: false,
  },
  email: {
    type: String,
    // unique: true,
    required: true,
  },
  password: {
    type: String,
    // required: true,
  },
  passwordCrypto: {
    type: String,
  },
  phonecode:{
    type:String,
    default:null,
  },
  mobile: {
    type: Number,
  },
  type: {
    type: String,
  },
  token: {
    type: String,
    unique: true,
  },

  city: {
    type: String,
  },
  state: {
    type: String,
  },
  country: {
    type: String,
  },
  isActive: {
    type: Boolean,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  designation: {
    type: String,
  },
  position: {
    type: String,
  },
  subMrchent: {
    type: Boolean,
    default: true,
  },
  acessLogin: {
    type: String,
    enum: ["marchentAdminstrative", "finance", "operations", "guides", "no"],
    default: "no",
  },
  emailNotification: {
    type: [
      {
        title: String,
        desc: String,
        status: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  payeeType: {
    type: String,
    default:null,
  },
  accountType: {
    type: String,
    default:null,
  },
  branchName: {
    type: String,
    default:null,
  },
  bankAcctCurrency: {
    type: String,
    default:null,
  },
  swiftCode: {
    type: String,
    default:null,
  },
  marchentCode: {
    type: String,
    default:null,
  },
  MICR: {
    type: String,
    default:null,
  },
  bankCode: {
    type: String,
    default:null,
  },
  branchCode: {
    type: String,
    default:null,
  },
  marBankAccNo: {
    type: String,
    default:null,
  },
  marBankIfscCode: {
    type: String,
    default:null,
  },
  marBankName: {
    type: String,
    default:null,
  },
  marAccHolderName: {
    type: String,
    default:null,
  },
  legalStatus: {
    type: String,
    enum: ["registered_company", "individual_traders"],
    default: "individual_traders",
  },
  companyName: {
    type: String,
    default:null,
  },
  legalCompanyName: {
    type: String,
    default:null,
  },
  phonecodecompany:{
    type:String,
    default:null,
  },
  companyMobile: {
    type: String,
    default:null,
  },
  directorName: {
    type: String,
    default:null,
  },
  individualName: {
    type: String,
    default:null,
  },
  companyDob: {
    type: String,
    default:null,
  },
  companyStreetAddress: {
    type: String,
    default:null,
  },
  postalCode: {
    type: String,
    default:null,
  },
  compCity: {
    type: String,
    default:null,
  },
  compState: {
    type: String,
    default:null,
  },
  compCountry: {
    type: String,
    default:null,
  },
  licenseNumber: {
    type: String,
    default:null,
  },
  registrationNumber: {
    type: String,
    default:null,
  },
  description: {
    type: String,
    default:null,
  },
  socialLink: {
    type: String,
    default:null,
  },
  logo: {
    type: String,
    default:null,
  },
  insurancePolicy: {
    type: String,
    default:null,
  },
  compamyRegistrationImage: {
    type: String,
    default:null,
  },
  saveAsDraft: {
    type: Boolean,
    default: false,
  },
  tabPermission: {
    type: Array,
    default:null,
  },
  zip: {
    type: String,  // saveAsDraft: false,
    default:null,
  },
  status: {
    type: Boolean,
    default: true,
  },
  newSupplier : {
    type: Boolean,
    default: false,
  },
  userID:{
    type: mongoose.Schema.Types.ObjectId,
    default: null,
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

MerchantSchema.methods.comparePassword = function (candidatePassword) {
  return passwordHash.verify(candidatePassword, this.password);
};

module.exports = mongoose.model("merchant", MerchantSchema);
