const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema({

    categoryId:{
        type:mongoose.Schema.Types.ObjectId
    },
    authorImage: {
        type: String,
    },
    authorName: {
        type: String,
    },
    image: {
        type: String,
    },
    description: {
        type: String,
    },
    title: {
        type: String,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    status: {
        type: Boolean,
        default: true,
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
module.exports = mongoose.model("blog", blogSchema);
