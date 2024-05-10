const mongoose = require("mongoose");
const Participent = require("../../Models/participent");
const activityDetails = require("../../Models/activityDetails");
const specialOffer = require("../../Models/specialOffer");
const ResponseCode = require("../../service/responseCode");

const addParticipent = async (req, res) => {
  const check = await Participent.findOne({
    activityDetailsId: new mongoose.Types.ObjectId(req.body.activityDetailsId),
    isDeleted: false,
  });

  if (check) {
    return res.status(ResponseCode.errorCode.dataExist).json({
      status: false,
      message: "Activity already has a participant",
    });
  } else {
    const activity = await activityDetails
      .findOne({ _id: req.body.activityDetailsId })
      .exec();
    if (activity.specialOfferId) {
      const offer = await specialOffer.findOne({
        _id: activity.specialOfferId,
      });
      if (offer) {
        // console.log("offer", offer);
        const discountPercentage = offer.discountPercentage;

        req.body.participentType.forEach((participantType) => {
          const discountedPrice =participantType.price -(participantType.price * discountPercentage) / 100;
          participantType.discountPrice = discountedPrice;
        });
        const updatedParticipantData = {
          ...req.body,
        };
        await Participent(updatedParticipantData)
          .save()
          .then((data) => {
            return res.status(ResponseCode.errorCode.success).json({
              status: true,
              message: "Participant added successfully",
            });
          })
          .catch((err) => {
            return res.status(ResponseCode.errorCode.serverError).json({
              status: false,
              message: "Server error please try again",
            });
          });
      }
    } else {
      const newParticipant = new Participent({
        ...req.body,
      });
      await Participent(newParticipant)
        .save()
        .then((data) => {
          return res.status(ResponseCode.errorCode.success).json({
            status: true,
            message: "Participant added successfully",
          });
        })
        .catch((err) => {
          return res.status(ResponseCode.errorCode.serverError).json({
            status: false,
            message: "Server error please try again",
          });
        });
    }
  }
};

const viewParticipent = async (req, res) => {
  Participent.aggregate([
    {
      $match: {
        isDeleted: false,
        status: true,
      },
    },
    {
      $lookup: {
        from: "activitydetails",
        localField: "activityDetailsId",
        foreignField: "_id",
        pipeline: [
          {
            $project: {
              __v: 0,
              updatedOn: 0,
              createdOn: 0,
              status: 0,
              isDeleted: 0,
              addedBy: 0,
            },
          },
        ],
        as: "activityDetails",
      },
    },
    {
      $unwind: { path: "$activityDetails", preserveNullAndEmptyArrays: true },
    },

    {
      $project: {
        __v: 0,
        status: 0,
        isDeleted: 0,
        updatedOn: 0,
        createdOn: 0,
      },
    },
  ])
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Participent Viewed Successfully",
        data: data,
      });
    })
    .catch((error) => {
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        error: error,
      });
    });
};

const editParticipent = async (req, res) => {
  Participent.findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(req.params.id) },
    { ...req.body }
  )
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Participent updated",
      });
    })
    .catch((error) => {
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        error: error,
      });
    });
};

const deleteParticipent = async (req, res) => {
  await Participent.findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(req.params.id) },
    { isDeleted: true }
  )
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Participent deleted",
      });
    })
    .catch((error) => {
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        error: error,
      });
    });
};
module.exports = {
  addParticipent,
  viewParticipent,
  editParticipent,
  deleteParticipent,
};
