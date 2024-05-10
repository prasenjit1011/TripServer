var mongoose = require("mongoose");

const CompanydetailsSchema = new mongoose.Schema({
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  legalStatus: {
    type: String,
    enum: ["registered_company", "individual_traders"],
  },
  companyName: {  
    type: String,
  },
  legalCompanyName: {
    type: String,
  },
  companyMobile: {
    type: String,
  },
  directorName: {
    type: String,
  },
  individualName: {
    type: String,
  },
  companyDob: {
    type: String,
  },
  companyStreetAddress: {
    type: String,
  },
  postalCode: {
    type: String,
  },
  compCity: {
    type: String,
  },
  compState: {
    type: String,
  },
  compCountry: {
    type: String,
  },
  licenseNumber: {
    type: String,
  },
  registrationNumber: {
    type: String,
  },
  description: {
    type: String,
  },
  socialLink: {
    type: String,
  },
  logo: {
    type: String,
  },
  insurancePolicy: {
    type: String,
  },
 
 merchantEmail :{
     type : String // newly added field email,**dont add this field merchant , email is a login credential 
} ,
merchantBankAccNo: {      //  number new field added bank account
  type: String,
},
merchantBankCode :{
    type : String    // newly added field Bnak Code
} ,
merchantFirstName :{
  type : String    // newly added field first name
} ,
merchantLastName :{
  type : String    // newly added field  last name
} ,
merchantZipCode: {  // newly added field mercha t zip code available in merchant schema 
  type:String
},
// zip
merchantLangId :{
  type : mongoose.Types.ObjectId    // newly added field language Id
} ,
merchantBranchName :{
  type : String    // newly added field BranchName
} ,
merchantBankIfscCode :{
  type : String    // newly added field IFSC code
} ,
merchantCommisionPercentage : {  // newly added field commisionPercentage
  type : Number 
}  ,        
compamyRegistrationImage: {   // insurancePolicy  compamyRegistrationImage logo
    type: String,
},
  status: {
    type: Boolean,
    default: true,
  },
  isApprove: {
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

module.exports = mongoose.model("companyDetails", CompanydetailsSchema);
