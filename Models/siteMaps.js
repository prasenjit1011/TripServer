const mongoose = require("mongoose")
const sitemapSchema = new mongoose.Schema({
    continent : {
        type: String
    },
    countryId:{
        type:mongoose.Types.ObjectId
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
})

module.exports = mongoose.model("sitemap", sitemapSchema);