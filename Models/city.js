var mongoose = require('mongoose')

const CitySchema = new mongoose.Schema({
    countryId: {
        type: mongoose.Types.ObjectId,
    },
    cityName: {
        type: String,
    },
    picture: {
        type: String,
    },
    location: {
        type: Object,
        // required: true,
    },
    topPriority: {
        type: Number,
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
    }
});


module.exports = mongoose.model('city', CitySchema);