const mongoose = require("mongoose")
const activityAssignSchema = new mongoose.Schema({
    assignTo:{
        type:mongoose.Types.ObjectId
    },
    activityId:{
        type:[mongoose.Schema.Types.ObjectId]
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
})

module.exports = mongoose.model("activityAssign", activityAssignSchema);