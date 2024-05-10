const mongoose = require("mongoose");


const ZipcodeSchema = new mongoose.Schema({
    cityName: {
        type: String,
    },
    countryName: {
        type:String,
    }, 
    zipCode: {
        type:String,
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
module.exports = mongoose.model("zipcode", ZipcodeSchema);
