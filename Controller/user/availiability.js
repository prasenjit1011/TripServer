const mongoose = require("mongoose");
const availabilityModel = require("../../Models/availability");
const ResponseCode = require("../../service/responseCode");
const { DBerror, InputError } = require("../../service/errorHandeler");
const CartTimeCheck = require("../../Models/cartTimeCheck");
const Cart = require("../../Models/cart");

var moment = require("moment");

function convertDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function compareIfSmall(dateString,timeString) { //\/\/\/

  const newStriing = dateString + " " +timeString
  // Get the current date


  // Parse and set hours and minutes from the time string
  const  combinedDateTime  = moment(newStriing, 'YYYY-MM-DD h:mm A')
  // const combinedDateTime = moment({ year: date.year, month: date.month, day: date.day, hour: hours, minute: minutes }); 
  
  // Convert to ISO string
  const isoString = combinedDateTime.toISOString();
  
  const date1 = new Date(isoString); // should be greater
  const date2 = new Date(); // should be smaller
  // console.log(date1 , date2)
  return date1 >= date2


}

const viewAvalability = async (req, res) => {
  availabilityModel
    .aggregate([
      {
        $match: {
          isDeleted: false,
          activityDetailsId: new mongoose.Types.ObjectId(req.body.id),

          // tourDate: {
          //     $gte: moment.utc(req.body.tourDate).startOf("date").toDate(),
          //     $lte: moment.utc(req.body.tourDate).endOf("date").toDate(),
          //   },
          // addedById:req.user._id
        },
      },
      {
        $lookup: {
          from: "activitydetails",
          localField: "activityDetailsId",
          foreignField: "_id",
          pipeline: [
            {
              $lookup: {
                from: "specialoffers",
                localField: "specialOfferId",
                foreignField: "_id",
                as: "offerDetails",
              },
            },
            {
              $unwind: {
                path: "$offerDetails",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "categories",
                localField: "categoryId",
                foreignField: "_id",
                as: "catDetails",
              },
            },
            {
              $unwind: {
                path: "$catDetails",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "languages",
                localField: "languageId",
                foreignField: "_id",
                as: "langDetails",
              },
            },
            {
              $unwind: {
                path: "$langDetails",
                preserveNullAndEmptyArrays: true,
              },
            },

            {
              $lookup: {
                from: "activitytypes",
                localField: "activityTypesId",
                foreignField: "_id",
                as: "activitytypeDetails",
              },
            },
            {
              $unwind: {
                path: "$activitytypeDetails",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "sections",
                localField: "sectionId",
                foreignField: "_id",
                as: "sectionsDetails",
              },
            },
            {
              $unwind: {
                path: "$sectionsDetails",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "activitysites",
                localField: "activitySiteId",
                foreignField: "_id",
                as: "activitysiteDetails",
              },
            },
            {
              $unwind: {
                path: "$activitysiteDetails",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $lookup: {
                from: "cities",
                localField: "cityId",
                foreignField: "_id",
                as: "citiDetails",
              },
            },
            {
              $unwind: {
                path: "$citiDetails",
                preserveNullAndEmptyArrays: true,
              },
            },

            {
              $lookup: {
                from: "countries",
                localField: "countryId",
                foreignField: "_id",
                as: "country",
              },
            },
            {
              $unwind: { path: "$country", preserveNullAndEmptyArrays: true },
            },

            {
              $addFields: {
                specialOfferName: "$offerDetails.specialOfferName",
                discountPercentage: "$offerDetails.discountPercentage",
                cityName: "$citiDetails.cityName",
                countryName: "$country.name",
                activitySiteName: "$activitysiteDetails.siteName",
                sectionTitle: "$sectionsDetails.sectionTitle",
                activitytypeName: "$activitytypeDetails.name",
                language: "$langDetails.name",
                catDetails: "$catDetails.categoryName",
              },
            },
            {
              $project: {
                specialOfferName: 1,
                discountPercentage: 1,
                cityName: 1,
                countryName: 1,
                activitySiteName: 1,
                sectionTitle: 1,
                activitytypeName: 1,
                language: 1,
                catDetails: 1,
                slug: 1,
                referenceCode: 1,
                activityTitle: 1,
                activityDiscountPrice: 1,
                description: 1,
                image: 1,
                activityActualPrice: 1,
                tourActivity: 1,
                tourPerson: 1,
                meetingPoint: 1,
                information: 1,
                importentInfo: 1,
                activityCoordinates: 1,
                tOriginal: 1,
                priority: 1,
                status: 1,
              },
            },
          ],
          as: "activity_details",
        },
      },
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
          createdOn: 0,
          updatedOn: 0,
        },
      },
    ])
    .then((data) => {
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


// Function to get the next day's date
function getNextDay(dateString) {
  const currentDate = new Date(dateString);
  const nextDay = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
  return nextDay.toISOString().split('T')[0];
}



const showAllTimeBydate = async (req, res) => {
  try {
    
    // const  sentDate = new Date(req.body.tourdate) 
    // const  nowDate = new Date()
    // let dateFromFetch = null 
    // if (sentDate > nowDate) {
    //   dateFromFetch  = sentDate
    // }else if (sentDate.toISOString().slice(0,10) === nowDate.toISOString().slice(0,10)) {
    //   dateFromFetch = nowDate 
    //   const data = await availabilityModel.aggregate([
    //     {
    //       $match: {
    //         activityDetailsId: new mongoose.Types.ObjectId(req.body.activityId),
    //         // tourDate: req.body.tourdate,
    //         $expr: { 
    //           $and: {
  
    //           } ,
    //           $gte: [
    //             {
    //               $dateFromString: {
    //                 dateString: "$tourDate",
    //                 format: "%Y-%m-%d"
    //               }
    //             },
    //             dateFromFetch
    //           ]
    //         } ,
    //         status: true,
    //         isDeleted: false,
    //       },
    //     },
    //     {
    //       $project: {
    //         time: 1,
    //         remainingUser: 1, 
    //         changePrice: 1,
    //         cutoffTime: 1,
    //         tourDate: 1,
    //         remeningUser: 1
    //       },
    //     },
    //   ]);
    // }else {
    //   dateFromFetch = nowDate  
    // }

    const data = await availabilityModel.aggregate([
      {
        $match:{
          activityDetailsId: new mongoose.Types.ObjectId(req.body.activityId),
          tourDate: req.body.tourdate,
          // $expr: { 
          //   $and: {

          //   } ,
          //   $gte: [
          //     {
          //       $dateFromString: {
          //         dateString: "$tourDate",
          //         format: "%Y-%m-%d"
          //       }
          //     },
          //     dateFromFetch
          //   ]
          // } ,
          status: true,
          isDeleted: false,
        },
      },
      {
        $project: {
          time: 1,
          remainingUser: 1, 
          changePrice: 1,
          cutoffTime: 1,
          tourDate: 1,
          remeningUser: 1
        },
      },
    ]);

    var sortActual = [];

    for (let index = 0; index < data.length; index++) {
      const data2 = data[index];
      const bookingDate = data2.tourDate;
      const bookingTime = data2.cutoffTime;
      const dateTimeString = `${bookingDate} ${bookingTime}`;
      const dateTime = new Date(dateTimeString);
      const isoString = dateTime.toISOString();
      const todayDate = new Date();
      const timestamp1 = todayDate;

      //console.log("timestamp1",timestamp1)

      const timestamp2 = new Date(isoString);
      // console.log("timestamp2",timestamp2)

      const timeDifferenceMs = Math.abs(timestamp1 - timestamp2);
      const hoursDifference = timeDifferenceMs / (1000 * 60 * 60);

      if (hoursDifference > 24) {
        sortActual.push(data2);
      }
    }

    sortActual.sort((a, b) => {
      const timeA = moment(a.time, "hh:mm A").format("HHmmss");
      const timeB = moment(b.time, "hh:mm A").format("HHmmss");
      return timeA.localeCompare(timeB);
    });
    return res.status(ResponseCode.errorCode.success).json({
      status: true,
      message: "View All available time slots", 
      data: sortActual,  ///\/\//\/
    });
  } catch (error) {
    console.error(error);
    const errors = DBerror(error);
    return res.status(ResponseCode.errorCode.serverError).json({
      status: false,
      message: "Server error, Please try again",
      error: error.message,
    });
  }
};

const showAllTimeBydateTest000000 = async (req, res) => {
  
  try {
    console.log(req.body.activityId, req.body.tourdate);


    // // Check if req.body.tourdate is within 24 hours
    // const currentDate = moment();
    // const tourDate = moment(req.body.tourdate, "YYYY-MM-DD");
    // console.log("tourdate is", tourDate)
    // const diffInHours = tourDate.diff(currentDate, 'hours');
    // console.log("diffInHours is", diffInHours)
    // if (diffInHours < 24) {
    //   return res.status(ResponseCode.errorCode.success).json({
    //     status: false,
    //     message: "Booking is not possible within the next 24 hours. Choose another date.",
    //     data: [],
    //   });
    // }

    const data = await availabilityModel.aggregate([  ///\/\/\/\/\
      {
        $match: {
          activityDetailsId: new mongoose.Types.ObjectId(req.body.activityId),
          tourDate: req.body.tourdate,
          // status: true,
          isDeleted: false,
        },
      },
      {
        $project: {
          time: 1,
          remainingUser: 1, 
          changePrice: 1,
          cutoffTime: 1,
          tourDate: 1,
          remeningUser: 1,
          status:1
        },
      },
    ]);
   

    console.log("data ->",data)
    const newArr = []

    data.forEach((item) => {
      console.log("itemnmnnnnnnnnnnn",item);
      if (compareIfSmall(item.tourDate,item.cutoffTime))  {
        newArr.push(item)
      }
    })


    return res.status(ResponseCode.errorCode.success).json({
      status: true,
      message: "View All available time slots", 
      data: newArr,  ///\/\//\/
    });
  } catch (error) {
    console.error(error);
    const errors = DBerror(error);
    return res.status(ResponseCode.errorCode.serverError).json({
      status: false,
      message: "Server error, Please try again",
      error: error.message,
    });
  }
};


const checkAvailability = async (req, res) => {
  CartTimeCheck.find({
    activityId: new mongoose.Types.ObjectId(req.body.activityId),
    bookDateFor: req.body.tourdate,
    bookTimeFor: req.body.time,
  })
    .then(async (result) => {
      console.log({ result });
      if (result.length > 0) {
        result.forEach(async (ele) => {
          console.log({ ele });
          const formattedDate = convertDate(new Date());
          if (formattedDate === ele.currentDate) {
            const currentTime = new Date();
            if (currentTime.toLocaleTimeString() > ele.timeAfter10Minutes) {
              await Cart.findOneAndUpdate(
                { _id: ele.cartId },
                {
                  $set: {
                    currentStatus: "unavailable",
                  },
                },
                { new: true }
              ).exec();
              var check = await availabilityModel
                .findOne({
                  activityDetailsId: ele.activityId,
                  tourDate: ele.bookDateFor,
                  time: ele.bookTimeFor,
                })
                .exec();

              var total = check.remeningUser + ele.totalPerson;

              availabilityModel
                .findOneAndUpdate(
                  {
                    _id: check._id,
                  },
                  {
                    $set: {
                      remeningUser: total,
                    },
                  }
                )
                .exec();

              CartTimeCheck.deleteOne({ _id: ele._id }).exec();
            }

            // else {

            //   await Cart.findOneAndUpdate(
            //     { _id: ele._id },
            //     {
            //       $set: {
            //         currentStatus: "available",
            //       },
            //     },
            //     { new: true }
            //   ).exec();
            // }
          } else {
            console.log("unava");
            Cart.findOneAndUpdate(
              { _id: ele.cartId },
              {
                $set: {
                  currentStatus: "unavailable",
                },
              },
              { new: true }
            ).exec();

            var check = await availabilityModel
              .findOne({
                activityDetailsId: ele.activityId,
                tourDate: ele.bookDateFor,
                time: ele.bookTimeFor,
              })
              .exec();

            var total = check.remeningUser + ele.totalPerson;

            availabilityModel
              .findOneAndUpdate(
                {
                  _id: check._id,
                },
                {
                  $set: {
                    remeningUser: total,
                  },
                }
              )
              .exec();

            CartTimeCheck.deleteOne({ _id: ele._id }).exec();
          }
        });
      }
      availabilityModel
        .findOne({
          activityDetailsId: new mongoose.Types.ObjectId(req.body.activityId),
          tourDate: req.body.tourdate,
          time: req.body.time,
          remeningUser: { $gte: req.body.noOfPerson },
          status: true,
          isDeleted: false,
        })
        .then((data) => {
          if (data) {
            return res.status(ResponseCode.errorCode.success).json({
              status: true,
              message: "Slot is available ",
            });
          }
          return res.status(ResponseCode.errorCode.success).json({
            status: false,
            message: `slot is not available`,
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
    })
    .catch((error) => { });
};


const showAllTimeBydateTest = async (req, res) => {
  try {
    console.log(req.body.activityId, req.body.tourdate);

    const data = await availabilityModel.aggregate([
      {
        $match: {
          activityDetailsId: new mongoose.Types.ObjectId(req.body.activityId),
          tourDate: req.body.tourdate,
          isDeleted: false,
        },
      },
      {
        $project: {
          time: 1,
          remainingUser: 1,
          changePrice: 1,
          cutoffTime: 1,
          tourDate: 1,
          remeningUser: 1,
          status: 1,
        },
      },
    ]);

    console.log("data ->", data);
    const newArr = [];

    data.forEach((item) => {
      console.log("itemnmnnnnnnnnnnn", item);
      // if (compareIfSmall(item.tourDate, item.cutoffTime)) {

        if (item.remeningUser < 0) {
          item.remeningUser = 0;
        }
        newArr.push(item);
      // }
      console.log("newArr",newArr);
  
    });

    return res.status(ResponseCode.errorCode.success).json({
      status: true,
      message: "View All available time slots",
      // data:data,
      data: newArr,
    });
  } catch (error) {
    console.error(error);
    const errors = DBerror(error);
    return res.status(ResponseCode.errorCode.serverError).json({
      status: false,
      message: "Server error, Please try again",
      error: error.message,
    });
  }
};




module.exports = {
  viewAvalability,
  showAllTimeBydate,
  checkAvailability,
  showAllTimeBydateTest
};
