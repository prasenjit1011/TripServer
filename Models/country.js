var mongoose = require('mongoose')


const CountrySchema = new mongoose.Schema({

    name: {
        type: String,

    },
    topPriority: {
        type: Number,
      },
    image:{
        type: String,
    },
    flag:{
        type: String,
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
        default: new Date(),
    },
    updatedOn: {
        type: Date,
        default: new Date(),
    },
});


module.exports = mongoose.model('country', CountrySchema);