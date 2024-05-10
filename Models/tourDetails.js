var mongoose = require('mongoose')

const TourDetailsSchema = new mongoose.Schema({
    tour:{
        type: mongoose.Types.ObjectId,
    },
    heading: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },

    avgRating: {
        type: Number,
        required: true,
    },
    provider: {
        type: Object,
        required: true,
    },
    image: {
        type: Array,
        required: true,
    },
    tourDetails: {
        type: String,
        required: true,
    },
    tourPrice: {
        type: String,
        required: true,
    },
    tourPerson: {
        type: String,
        required: false,
    },
    tourActivity: {
        type: Array,
        required: false,
        default: []
    },
    highlights: {
        type: Array,
        required: false,
        default: []
    },
    description: {
        type: Array,
        required: false,
        default: []
    },
    includes: {
        type: Array,
        // required: false,
        default: []
    },
    suitable: {
        type: Array,
        // required: false,
        default: []
    },
    information: {
        type: Array,
        // required: false,
        default: []
    },

    status: {
        type: Boolean,
        // required: true,
        default: true
    },

    ImageStore: {
        type: Boolean,
        // required: true,
        default: false
    },
    createdOn: {
        type: Date
    },
    updatedOn: {
        type: Date
    },

})

module.exports = mongoose.model('tourDetails', TourDetailsSchema);
