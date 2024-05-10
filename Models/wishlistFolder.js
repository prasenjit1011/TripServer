const mongoose = require('mongoose');

const WishlistFolder = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    folderName: {
        type: String

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


})

module.exports = mongoose.model("wishlistFolder", WishlistFolder)