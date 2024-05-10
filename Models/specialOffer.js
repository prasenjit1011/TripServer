const mongoose = require("mongoose");

// const offerTypeDropDownSchema = new mongoose.Schema({
//    name: {
//     type : String ,
//     enum:["limitedTimeOffer" ,"earlyBirdOffer" ,"lastMinuteOffer"]
//    }  ,            // {name : "limitedTimeOffer" ,time : "2:00 PM" }
//    time : {        // {name : "earlyBirdOffer" , time : "10"}
//     type : String , // {name : "lastMinuteOffer" , time : "9:00 PM"}
//    }
// })


const specialOfferSchema = new mongoose.Schema({
  addedById: {  
    type: mongoose.Types.ObjectId,
  },
  specialOfferId: {
    type: mongoose.Schema.Types.ObjectId
  },
  specialOfferName: {
    type: String,
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  duration: {
    value: {
      type: Number,
      // required: true,
    },
    unit: {
      type: String,
      enum: ["hours", "days","minutes"],

      // required: true,
    },
  },
  rejectedStatus:{
    type: Boolean,
    default:false
  },
  updatedStatus: {
    type: Boolean,
    default:false
   
  },
  // offerType: {  /*{name : "limitedTimeOffer" ,time : "2:00 PM" } or {name : "earlyBirdOffer" , time : "30 days"}  or  {name : "lastMinuteOffer" , time : "3 days"} */  
  //   type: offerTypeDropDownSchema  
  // },
  offerType: {
    type : String ,
    enum:["limitedTimeOffer" ,"earlyBirdOffer" ,"lastMinuteOffer"]
   },
   limitedStartDate: {
    type: String,
   },
   limitedEndDate: {  
    type: String
   },
   limitedOfTime:{
    type: String
  },
  earlyNoOfDays:{
    type: String 
   },
   lastMinuteValue:{
    type: String // 6
   },

   lastMinuteUnit:{
    type: String //  hours or minutes or days
   },

   slotStartDate: {
    type: String
   },
   slotEndDate: {
    type: String
   },

   daySlot: {
    type: Array // sunday.. staterday
   },

  discountPercentage: {
    type: Number,
  },
  description: {
    type: String,
  },
  // activityDetailsId: {
  //   type: [
  //     {
  //       type: mongoose.Types.ObjectId,
  //     },
  //   ],
  // },
  activityDetailsId: {
    type: Array
  },
  addedBy: {
    type: String,
  },
  remarks: {
    type: String,
  },
  status: {
    type: Boolean,
    default: true,
  },
  isApproval: {
    type: Boolean,
    default: false,
  },
  visibleStatus: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  createdOn: {
    type: Date,
    default: Date.now,
  },
  updatedOn: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("specialOffer", specialOfferSchema);