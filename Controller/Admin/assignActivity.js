const mongoose = require("mongoose");
const assignActivity = require("../../Models/activityAssign");
const ResponseCode = require("../../service/responseCode");
const { DBerror, InputError } = require("../../service/errorHandeler");

const addAssignAcitivity = async (req, res) => {
  try {
    const { assignTo, activityId } = req.body;

    const existingAssignment = await assignActivity.findOne({
      assignTo: new mongoose.Types.ObjectId(assignTo),
    }).exec();

    var newarr=[]
    req.body.activityId.forEach(ele=>{
      newarr.push(new mongoose.Types.ObjectId(ele))
      
    })

    if (existingAssignment) {
      const updatedActivityIds = [...new Set([...existingAssignment.activityId, ...newarr])];

      await assignActivity.findOneAndUpdate(
        { _id: existingAssignment._id },
        { activityId: updatedActivityIds },
        { new: true }
      );

      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Activity assigned successfully",
      });
    } else {
      var newarr=[]
      req.body.activityId.forEach(ele=>{
        newarr.push(new mongoose.Types.ObjectId(ele))
        
      })
      const assignActivityData = {
        ...req.body,
        activityId:newarr
      };

      const newAssignment = new assignActivity(assignActivityData);
      await newAssignment.save();

      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "AssignActivity added successfully",
      });
    }
  } catch (error) {
    const errors = DBerror(error);
    return res.status(ResponseCode.errorCode.serverError).json({
      status: false,
      message: "Server error, please try again",
      error: errors,
    });
  }
};


const viewAssignAcitivity = async (req, res) => {
  await assignActivity
    .aggregate([
      {
        $match: {
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: "merchants",
          localField: "assignTo",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                firstName: 1,
                lastName: 1,
              },
            },
          ],
          as: "assignDetails",
        },
      },
      {
        $unwind: { path: "$assignDetails", preserveNullAndEmptyArrays: true },
      },

      {
        $lookup:{
          from:"activitydetails",
          localField:"activityId",
          foreignField:"_id",
          pipeline:[
            {
              $project:{

                activityTitle:1
              }
            }
          ],
          as:"activity"
        }
      },
 
      // {
      //   $project: {
      //   assignTo:1,
      //     activityId: { $arrayToObject: {
      //       $map: {
      //         input: "$activityId",
      //         as: "id",
      //         in: {k:"$$id",v: "" }
      //       }
      //     }}
      //   }
      // },
      {
        $project: {
          __v: 0,
          isDeleted: 0,
          createdOn: 0,
          activityId:0
        },
      },
      {
        $sort: {
          _id: -1,
          createdOn: -1,
        },
      },
    ])
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "viewed sucessfully",
        data: data,
      });
    })
    .catch((error) => {
      console.log(error);
      const errors = DBerror(error);
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error,Please try again",
        error: errors,
      });
    });
};

const editAssignAcitivity = async (req, res) => {
  await assignActivity
    .findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(req.params.id) },
      { ...req.body,
  
      }
    )
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "assignAcitivity updated sucessfully",
      });
    })
    .catch((error) => {
      const errors = DBerror(error);
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error,Please try again",
        error: errors,
      });
    });
};

const deleteAssignAcitivity = async (req, res) => {
  await assignActivity
    .findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(req.params.id) },
      { isDeleted: true }
    )
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "assignAcitivity deleted",
      });
    })
    .catch((error) => {
      const errors = DBerror(error);
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error,Please try again",
        error: errors,
      });
    });
};

module.exports = {
  addAssignAcitivity,
  viewAssignAcitivity,
  editAssignAcitivity,
  deleteAssignAcitivity,
};
