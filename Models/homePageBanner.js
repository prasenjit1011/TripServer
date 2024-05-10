var mongoose = require('mongoose')

var HomePageBannerSchema = new mongoose.Schema({
    bannerImg: {
        type: String
    },
    bannerTitle: {
        type: String
    },
    countryId:{
        type:mongoose.Schema.Types.ObjectId
    },
    activityTypeId:{
        type:mongoose.Schema.Types.ObjectId
    },
    activityId:{
        type:mongoose.Schema.Types.ObjectId
    },
    bannerDesc: {
        type: String
    },
    video: {
        type: String
    },
    active: {
        type: Boolean,
        default:true
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
})
module.exports = mongoose.model('homePageBanner', HomePageBannerSchema);