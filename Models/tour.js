var mongoose = require('mongoose')

const tourSchema = new mongoose.Schema({
    tourId: {
        type: String,
    },
    tourType: {
        type: String,
     }  , 
    name: {
        type: String,
        required: true,
    },
    status: {
        type: Boolean,
        default: true
    },
    dataGet: {
        type: Boolean,
        required: true,
        default: false
    },
    createdOn: {
        type: Date
    },
    updatedOn: {
        type: Date
    },
   
})

module.exports = mongoose.model('tour', tourSchema);
