const mongoose = require("mongoose");
const random = require("random-string-alphanumeric-generator");
const newActivityDetails = require("../../Models/newActivityDetails");
const specialOfferModel = require("../../Models/specialOffer");
const activityDetailsModel = require("../../Models/activityDetails");
 const availabilityModel = require("../../Models/availability")
const ResponseCode = require("../../service/responseCode");
const { DBerror, InputError } = require("../../service/errorHandeler");
var moment = require("moment");
const tempAvailability = require("../../Models/tempAvailability");


const editActivityDetails = async (req, res) => {
    try {
      const activityDetails = await activityDetailsModel
        .findOne({
          _id: new mongoose.Types.ObjectId(req.params.id),
          isApproval: true, 
          visibleStatus: true,
        })
        .exec();
  
      // If activityDetails exists
      if (activityDetails != null || activityDetails != "") {
        console.log("reqbody is", req.body);
  
        // Find and update tempActivityDetails based on activityDetailsId
        const tempActivtyDetailsData = await tempActivityDetails
          .findOneAndUpdate(
            { activityDetailsId: new mongoose.Types.ObjectId(req.params.id) },
            { ...req.body, isEdited: false },
            {  upsert: true, new: true } // Create a new document if not found
          )
          .exec();
  
          // Find and update ActivityDetails based on activityDetailsId
        const ActivtyDetailsData = await activityDetailsModel
        .findOneAndUpdate(
          { _id: new mongoose.Types.ObjectId(req.params.id) },
          { isEdited: false },
          { upsert: true } // Create a new document if not found
        )
        .exec();
  
        // Return success response with updated/created data
        return res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "Activity details update request sent successfully",
          data: tempActivtyDetailsData,
        });
      } else {
        res.status(ResponseCode.errorCode.success).json({
          status: false,
          message:
            "You cannot update activity details until the activity is approved by admin",
        });
      }
    } catch (error) {
      console.log("error is==", error);
      const errors = DBerror(error);
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error. Please try again",
        error: error.message,
      });
    }
  };


module.exports={
    editActivityDetails
}