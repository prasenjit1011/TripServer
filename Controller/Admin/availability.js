const mongoose = require("mongoose");
const availabilityModel = require("../../Models/availability");
const ResponseCode = require("../../service/responseCode");
const { DBerror, InputError } = require("../../service/errorHandeler");
var moment = require("moment");
const e = require("cors");




const addAvailability = async (req, res) => {

  const promises = req.body.tourDate.map(async (element) => {
    try {
      const availabilityDataPromises = req.body.timing.map(async (ele) => {
        try {

          const check = await availabilityModel.findOne({
            activityDetailsId: new mongoose.Types.ObjectId(req.body.activityDetailsId),
            tourDate: element,
            time : ele.time
          }).exec();

          if (check) {
            throw {
              status: ResponseCode.errorCode.dataExist,
              message: "Data already exists for this tour date",
            };
          }
          var shift = "";
          const timeString = ele.time;
          const time24Hour = moment(timeString, 'h:mm A').format('HH:mm');
          const morningThreshold = moment('12:00 PM', 'h:mm A').format('HH:mm');
          const afternoonThreshold = moment('5:00 PM', 'h:mm A').format('HH:mm');
          if (moment(time24Hour, 'HH:mm').isBefore(moment(morningThreshold, 'HH:mm'))) {
            shift = "morning";
          } else if (moment(time24Hour, 'HH:mm').isSameOrBefore(moment(afternoonThreshold, 'HH:mm'))) {
            shift = "afternoon";
          } else {
            shift = "evening";
          }
          const availabilityData = {
            activityDetailsId: req.body.activityDetailsId,
            remeningUser: req.body.remeningUser,
            changePrice: req.body.changePrice,
            shift: shift,
            tourDate: element,
            addedById: req.user._id,
            time: ele.time,
            cutoffTime: ele.cutoffTime,
          };

          return new availabilityModel(availabilityData).save();
        } catch (innerError) {
          // Handle errors from inner async operations here
          console.error("Error in inner async operation:", innerError);
          throw innerError;
        }
      });

      return Promise.all(availabilityDataPromises);

    } catch (error) {
      // Handle errors from the outer async operation here
      console.error("Error in outer async operation:", error);
      throw error;
    }
  });

  Promise.all(promises)
    .then(() => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Availability added successfully",
      });
    })
    .catch((error) => {
      return res.status(error.status || 500).json({
        status: false,
        message: error.message || "An error occurred",
      });
    });
};

// const addAvailability = async (req, res) => {
//       var check = await availabilityModel
//         .findOne({
//           activityDetailsId: new mongoose.Types.ObjectId(
//             req.body.activityDetailsId
//           ),
//           addedById: req.user._id,
//           tourDate: req.body.tourDate,
//         })
//         .exec();

//       if (check) {
//         return res.status(ResponseCode.errorCode.dataExist).json({
//           status: false,
//           message: "data exist",
//         });

//       } else {



//         req.body.timimg.forEach(ele => {
//           var shift=""
//           // console.log(ele)

//           const timeString = ele;
//           const time24Hour = moment(timeString, 'h:mm A').format('HH:mm');

//           const morningThreshold = moment('12:00 PM', 'h:mm A').format('HH:mm');
//           const afternoonThreshold = moment('5:00 PM', 'h:mm A').format('HH:mm');

//           if (moment(time24Hour, 'HH:mm').isBefore(moment(morningThreshold, 'HH:mm'))) {
//             console.log("Morning");
//             shift="morning"
//           } else if (moment(time24Hour, 'HH:mm').isBefore(moment(afternoonThreshold, 'HH:mm'))) {
//             console.log("Afternoon");
//             shift="afternoon"

//           } else {
//             console.log("Evening");
//             shift="evening"

//           }


//           const availabilityData = {
//             ...req.body,
//             shift:shift,
//             addedById: req.user._id,
//             time: ele.time,
//             cutoffTime:ele.cutoffTime

//           };
//           new availabilityModel(availabilityData)
//             .save()

//         });


//         return res.status(ResponseCode.errorCode.success).json({
//           status: true,
//           message: "Availability added successfully",
//         });


//       }
//     };


const editAvailability = async (req, res) => {
  var shift = "";
  const timeString = req.body.time;
  const time24Hour = moment(timeString, 'h:mm A').format('HH:mm');
  const morningThreshold = moment('12:00 PM', 'h:mm A').format('HH:mm');
  const afternoonThreshold = moment('5:00 PM', 'h:mm A').format('HH:mm');

  if (moment(time24Hour, 'HH:mm').isBefore(moment(morningThreshold, 'HH:mm'))) {
    //console.log("Morning");
    shift = "morning";
  } else if (moment(time24Hour, 'HH:mm').isSameOrBefore(moment(afternoonThreshold, 'HH:mm'))) {
    //console.log("Afternoon");
    shift = "afternoon";
  } else {
    //console.log("Evening");
    shift = "evening";
  }
  const updatedData = {
    ...req.body,
    updatedOn: new Date(),
    shift: shift
  };
  availabilityModel
    .findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(req.params.id) },
      updatedData,
      { new: true }
    )

    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Update availability",
        // data: data
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

const viewAvalability = async (req, res) => {



  availabilityModel
    .aggregate([
      {
        $match: {
          isDeleted: false,
          activityDetailsId: new mongoose.Types.ObjectId(req.body.id),
          // tourDate: {
          //   $gte: moment.utc(req.body.tourDate).startOf("date").toDate(),
          //   $lte: moment.utc(req.body.tourDate).endOf("date").toDate(),
          // },
          tourDate: {
            $eq: req.body.tourDate,
            // $lte: moment.utc(req.body.tourDate).endOf("date").toDate(),
          },
        },
      },
      { $sort: { createdOn: -1 } },
      {
        $project: {
          citiDetails: 0,
          langDetails: 0,
          addedByid: 0,
          country: 0,
          activitytypeDetails: 0,
          sectionsDetails: 0,
          activitysiteDetails: 0,
          citiDetails: 0,
          offerDetails: 0,
          addedBy: 0,
          addedById: 0,
          isDeleted: 0,
          __v: 0,
          activityDetailsId: 0,
          updatedOn: 0,
        },
      },

      // {
      //   $sort: {
      //     time: 1,
      //   },
      // },
    ])
    .then((data) => {

      var sortdate = data.sort((a, b) => {
        var timea = moment(a.time, "hh:mm A").format("HH:mm");
        var timeb = moment(b.time, "hh:mm A").format("HH:mm");


        // if (timea > timeb) {
        //   return a - b;
        // } else {
        //   return b - a;
        // }
      });


      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "view All availability",
        data: data,
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

const viewMonthwiseAvailability = async (req, res) => {
  var { month, year } = req.body;

  availabilityModel
    .aggregate([
      {
        $addFields: {
          book: "$tourDate",
          year: { $year: { $toDate: "$tourDate" } },
          month: { $month: { $toDate: "$tourDate" } },
        },
      },
      {
        $match: {
          isDeleted: false,
          activityDetailsId: new mongoose.Types.ObjectId(req.body.id),
          year: year,
          month: month,
        },
      },
      {
        $sort: {
          tourDate: 1,
        },
      },
      {
        $group: {
          _id: "$tourDate",
          remainingUsers: { $sum: "$remeningUser" },
        },
      },
      // {
      //   $project: {
      //     __v: 0,
      //     isDeleted: 0,
      //     book: 0,
      //     year: 0,
      //     month: 0,
      //     createdOn: 0,
      //     updatedOn: 0,
      //   },
      // },
    ])
    .then((data) => {
      if (data.length > 0) {
        return res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "view All availability",
          data: data,
        });
      } else {
        return res.status(ResponseCode.errorCode.dataNotFound).json({
          status: false,
          message: "data not found",
          data: data,
        });
      }
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

const deleteAvailability = (req, res) => { // 
  return availabilityModel
    .deleteOne({ _id: { $in: [new mongoose.Types.ObjectId(req.params.id)] } })
    .then((data) => {
      res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Deleted successfully",
      });
    })
    .catch((error) => {
      res.status(ResponseCode.errorCode.errorCode).json({
        status: false,
        message: "Server error, please try again later",
      });
    });
};

const deleteSingleAvailability = async (req, res) => {
  try {
    const delData = await availabilityModel.findByIdAndDelete({ _id: req.params.id })
    res.status(200).json({
      status: true,
      msg: "Delte Single availibility successfully!!",
      data: delData
    })
  } catch (error) {
    res.status(500).json({ status: false, msg: "Could not delete !!", data: error.message })
  }

}

const deleteAvailabilityDatewise = async (req, res) => {

  var avaldate = await availabilityModel
    .find(
      {
        activityDetailsId: {
          $in: [new mongoose.Types.ObjectId(req.params.id)],
        },
        tourDate: {
          $in: req.body.dateRange,
        }

      },
      { tourDate: 1 }
    )
    .exec();


  // return false;

  avaldate.forEach((ele) => {
    availabilityModel
      .deleteOne({ _id: new mongoose.Types.ObjectId(ele._id) })
      .exec();
  });

  res.status(ResponseCode.errorCode.success).json({
    status: true,
    message: "Deleted successfully",
  });

  // .then((data) => {
  //   res.status(ResponseCode.errorCode.success).json({
  //     status: true,
  //     message: "Deleted successfully",
  //     data: data
  //   })
  // })
  // .catch((error) => {
  //   res.status(ResponseCode.errorCode.errorCode).json({
  //     status: false,
  //     message: "Server error, please try again later",

  //   })
  // })
};






module.exports = {
  addAvailability,
  editAvailability,
  viewAvalability,
  viewMonthwiseAvailability,
  deleteAvailability,
  deleteAvailabilityDatewise,
  deleteSingleAvailability
};
