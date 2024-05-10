
const mongoose = require("mongoose");
const ParticipantType = require("../../Models/participantType");
const ResponseCode = require("../../service/responseCode");
const { Validator } = require("node-input-validator");
const { DBerror, InputError } = require("../../service/errorHandeler");


const addParticipantType = async (req, res) => {

    const participantData = {
      ...req.body,
    };

    new ParticipantType(participantData)
      .save()
      .then((data) => {
        res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "Participant type  added successfully",
        });
      })
      .catch((error) => {
        const errors = DBerror(error);
        res.status(ResponseCode.errorCode.serverError).json({
          status: false,
          message: "Server error,Please try again",
          error: errors,
        });
      });
  }

const viewParticipantType =  (req, res) => {

    ParticipantType.aggregate([
        {
            $match: {
                isDeleted: false,
                status:true
            }
        },
        {
            $project :{
                isDeleted: 0,
                status: 0,
                createdOn: 0,
                updatedOn: 0,
                __v: 0
            }
        }
    ])
    .then((data) => {
        res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "View all participant type",
          data: data
        });
      })
      .catch((error) => {
        const errors = DBerror(error);
        res.status(ResponseCode.errorCode.serverError).json({
          status: false,
          message: "Server error,Please try again",
          error: errors,
        });
      });
}


const editParticipantType = async (req, res) => {
    await ParticipantType
      .findOneAndUpdate(
        {
          _id: new mongoose.Types.ObjectId(req.params.id),
        },
        {
          ...req.body,
        }
      )
      .then((data) => {
        res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "Participant type updated successfully",
        });
      })
      .catch((error) => {
        const errors = DBerror(error);
        res.status(ResponseCode.errorCode.serverError).json({
          status: false,
          message: "Server error,Please try again",
          error: errors,
        });
      });
};
  

const deleteParticipantType = async (req, res) => {

    await ParticipantType
      .deleteOne(
        {
          _id: new mongoose.Types.ObjectId(req.params.id),
        }
        
      )
      .then((data) => {
        res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "Participant type deleted successfully",
        });
      })
      .catch((error) => {
        const errors = DBerror(error);
        res.status(ResponseCode.errorCode.serverError).json({
          status: false,
          message: "Server error,Please try again",
          error: errors,
        });
      });
};
  

  module.exports = {
    addParticipantType,
    viewParticipantType,
    editParticipantType,
    deleteParticipantType
  }