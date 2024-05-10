const mongoose = require("mongoose");

const blogCategorySchema = new mongoose.Schema({
    typeId: {
        type: mongoose.Schema.Types.ObjectId,
      },
    name: {
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
module.exports = mongoose.model("blogCategory", blogCategorySchema);
