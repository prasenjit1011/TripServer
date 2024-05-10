var mongoose = require("mongoose");

const CompanydetailTempSchema = new mongoose.Schema({
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  langId: { //
    type: mongoose.Schema.Types.ObjectId,
  },
  commisionPercentage: {
    type: Number,
  },
  firstName: { //
    type: String,
  },
  lastName: {  //
    type: String,
  },
  image: { //
    type: String,
  },
  isApprove: { //isApproval // 21-03-2024 ::: change due to 
    type: Boolean,
    default: false,
  },
  rejectedStatus: {
    type: Boolean,
    default: false,
  },
  email: {  //
    type: String,
    // unique: true,
    required: true,
  },
  password: { //
    type: String,
    // required: true,
  },
  passwordCrypto: {
    type: String,
  },
  mobile: { //
    type: Number,
  },

  city: { //
    type: String,
  },
  state: { //
    type: String,
  },
  country: { //
    type: String,
  },
  // isActive: {
  //   type: Boolean,
  // },
  // isDeleted: {
  //   type: Boolean,
  //   default: false,
  // },
  // designation: {
  //   type: String,
  // },
  // position: {
  //   type: String,
  // },

  // emailNotification: {
  //   type: [
  //     {
  //       title: String,
  //       desc: String,
  //       status: {
  //         type: Boolean,
  //         default: false,
  //       },
  //     },
  //   ],
  // },
  // payeeType: {
  //   type: String,
  // },
  // accountType: {
  //   type: String,
  // },
  // branchName: {
  //   type: String,
  // },
  // bankAcctCurrency: {
  //   type: String,
  // },
  // swiftCode: {
  //   type: String,
  // },
  // marchentCode: {
  //   type: String,
  // },
  // MICR: {
  //   type: String,
  // },
  // bankCode: {
  //   type: String,
  // },
  // branchCode: {
  //   type: String,
  // },
  marBankAccNo: { //
    type: String,
  },
  marBankIfscCode: { //
    type: String,
  },
  marBankName: { //
    type: String,
  },
  marAccHolderName: { //
    type: String,
  },
  legalStatus: { //
    type: String,
    enum: ["registered_company", "individual_traders"],
    default: "individual_traders",
  },
  companyName: { //
    type: String,
  },
  legalCompanyName: { //
    type: String,
  },
  companyMobile: { //
    type: String,
  },
  directorName: { //
    type: String,
  },
  individualName: { //
    type: String,
  },
  companyDob: { //
    type: String,
  },
  companyStreetAddress: { //
    type: String,
  },
  postalCode: { //
    type: String,
  },
  compCity: { //
    type: String,
  },
  compState: { //
    type: String,
  },
  compCountry: { //
    type: String,
  },
  licenseNumber: { //
    type: String,
  },
  registrationNumber: { //
    type: String,
  },
  description: { //
    type: String,
  },
  socialLink: { //
    type: String,
  },
  logo: {  //
    type: String,
  },
  token:{
    type:String
  },
  insurancePolicy: { //
    type: String,
  },
  compamyRegistrationImage: { //
    type: String,
  },
  saveAsDraft: { //
    type: Boolean,
    default: false,
  },
  zip: {
    type: String,  // saveAsDraft: false,
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

// });

module.exports = mongoose.model("companyDetailTemp", CompanydetailTempSchema);

//   compCountryCode: "",  //  these two field are expectedin the above schema ,
//   compStateCode: "",   // but these two field are not maintained inside merchantModel schema
