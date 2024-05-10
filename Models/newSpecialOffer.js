const mongoose = require("mongoose")

const newSpecialOfferSchema = new mongoose.Schema({
    specialOfferId: {
        type: mongoose.Types.ObjectId
    },
    merchantId: {
        type: mongoose.Types.ObjectId
    },
    specialOfferName: {
        type: String
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    duration: {
        value: {
            type: Number,
            required: true
        },
        unit: {
            type: String,
            enum: ['hours', 'days'],
            required: true
        }
    },
    offerType: {
       type: String
    },
    discountPercentage: {
        type:Number
    },
    description: {
        type: String  
    },
    activityDetailsId: {
        type: [{
          type: mongoose.Types.ObjectId,
        }],
      },
    addedBy:{
        type: String 
    },
    isApproval:{
        type: Boolean,
        default: false,
      },
    status: {
        type: Boolean,
        default: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    createdOn: {
        type: Date,
        default: Date.now
    },
    updatedOn: {
        type: Date,
        default: Date.now
    },
    
})

module.exports = mongoose.model("newSpecialOffer", newSpecialOfferSchema);
