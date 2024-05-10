const mongoose = require("mongoose");
const Booking = require("../../Models/userBooking");
const bookingDetails = require("../../Models/bookingDetails");
const MerchantCommission = require("../../Models/marchentCommission");
const Merchant = require("../../Models/merchant");
const ActivityDetails = require('../../Models/activityDetails')
const MerchantBilling = require("../../Models/merchantBilling");
const ResponseCode = require("../../service/responseCode");
const { Validator } = require("node-input-validator");
const { DBerror, InputError } = require("../../service/errorHandeler");
var moment = require("moment");
const fs = require("fs");
const HtmlToPdf = require("../../service/pdfGenerator");
// const userBooking = require("../../Models/userBooking");
const availabilityData = require("../../Models/availability");
const activityDetails = require("../../Models/activityDetails");

function getLastDateOfMonth(year, month) {
  const lastDay = new Date(year, month, 0);
  return lastDay.getDate();
}

const viewBookingDetails = (req, res) => {
  console.log(req.user._id);
  Booking.aggregate([
    req.body.activityId != "" && typeof req.body.activityId != "undefined"
      ? {
        $match: {
          activityDetailsId: new mongoose.Types.ObjectId(req.body.activityId),
        },
      }
      : { $project: { __v: 0 } },

    req.body.startDate !== "" &&
      typeof req.body.startDate !== "undefined" &&
      req.body.endDate !== "" &&
      typeof req.body.endDate !== "undefined"
      ? {
        $match: {
          $expr: {
            $and: [
              {
                $gte: ["$bookingDate", req.body.startDate],
              },
              {
                $lte: ["$bookingDate", req.body.endDate],
              },
            ],
          },
        },
      }
      : { $project: { __v: 0 } },

    {
      $lookup: {
        from: "activitydetails",
        localField: "activityDetailsId",
        foreignField: "_id",
        pipeline: [
          {
            $match: {
              addedByid: req.user._id,
            },
          },
          {
            $lookup: {
              from: "merchants",
              localField: "addedByid",
              foreignField: "_id",
              pipeline: [
                {
                  $project: {
                    _id: 0,

                    fullname: { $concat: ["$firstName", " ", "$lastName"] },
                  },
                },
              ],
              as: "addedBy",
            },
          },
          { $unwind: { path: "$addedBy", preserveNullAndEmptyArrays: true } },

          // {
          //   $addFields: {
          //     addedBY: {
          //       $cond: {
          //         if: { $eq: ["$addedBy", "admin"] },
          //         then: "Things to dooo",
          //         else: "$merchant.fullname",
          //       },
          //     },
          //   },
          // },
          {
            $addFields: {
              addedBY: "$addedBy.fullname"

            }
          },

          {
            $project: {
              activityTitle: 1,
              image: 1,
              referenceCode: 1,
              // addedBy:1,
              addedBY: 1,

            },
          },
        ],
        as: "activity",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        pipeline: [
          {
            $project: {
              firstName: 1,
              lastName: 1,
              email: 1,
              mobileNo: 1,
            },
          },
        ],
        as: "userDetails",
      },
    },
    {
      $unwind: {
        path: "$userDetails",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $sort: {
        createdOn: -1,
      },
    },

    {
      $project: {
        isDeleted: 0,
        // createdOn: 0,
        __v: 0,
        userId: 0,
        activityDetailsId: 0,
      },
    },
  ])
    .then((data) => {
      res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Get all the data",
        data: data.filter((a) => a.activity.length > 0),
      });
    })
    .catch((error) => {
      res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error, Please try again later",
        error: error,
      });
    });
};

const financeBookingDetails = (req, res) => {
  console.log(req.user._id);
  const date = new Date();
  const formattedDate = moment(date).format("YYYY-MM-DD");
  // const currentMonth = date.getMonth() + 1; 

  Booking.aggregate([
    {
      $match: {
        isDeleted: false,
        bookingType: "activity",
        bookingDate: { $lt: formattedDate },
        // $expr: {
        //   $eq: [
        //     { $month: { $toDate: "$bookingDate" } },
        //     currentMonth,
        //   ],
        // },

      },
    },

    {
      $lookup: {
        from: "activitydetails",
        localField: "activityDetailsId",
        foreignField: "_id",
        pipeline: [
          {
            $match: {
              addedByid: req.user._id,
            },
          },
          {
            $addFields: {
              countryId: "$countryId",
            },
          },
          {
            $lookup: {
              from: "cxommissionpercentages",
              localField: "addedByid",
              foreignField: "merchantID",
              as: "addedBy",
              pipeline: [
                {
                  $match: {
                    isDeleted: false,
                  },
                },
                {
                  $project: {
                    _id: 0,
                    // commissionPercentage: 1,
                  },
                },
              ],
            },
          },
          { $unwind: { path: "$addedBy", preserveNullAndEmptyArrays: true } },

          {
            $addFields: {
              marchentCommisonPercentage: {
                $switch: {
                  branches: [
                    {
                      case: { $eq: ["$addedBy.commissionType", "individualLevel"] },
                      then: "$addedBy.commissionPercentage",
                    },
                    {
                      case: { $eq: ["$addedBy.commissionType", "global"] },
                      then: "$addedBy.commissionPercentage",
                    },
                    {
                      case: {
                        $eq: [
                          "$addedBy.commissionType", "countryWise",
                        ],
                      },
                      then: {
                        $cond: {
                          if: {
                            $eq: [
                              "$addedBy.commissionType",
                              "countryWise",
                            ],
                          },
                          then: {
                            $let: {
                              vars: {
                                matchingCountry: {
                                  $arrayElemAt: [
                                    {
                                      $filter: {
                                        input: "$addedBy.countryWisePercentage",
                                        as: "country",
                                        cond: {
                                          $eq: [
                                            "$$country.countryID",
                                            "$countryId",
                                          ],
                                        },
                                      },
                                    },
                                    0,
                                  ],
                                },
                              },
                              in: {
                                $cond: {
                                  if: { $ne: ["$$matchingCountry", null] },
                                  then: "$$matchingCountry.commissionPercentage",
                                  else: null,
                                },
                              },
                            },
                          },
                          else: "$addedBy.commissionPercentage", // Use the global or individualLevel commissionPercentage
                        },

                      },
                    },
                  ],
                  default: null,
                },
              },
            },
          },


          {
            $project: {
              countryId: 1,
              marchentCommisonPercentage: 1,
              activityTitle: 1,
              // image: 1,
              referenceCode: 1,
              productCode: 1,
              createdOn: 1,

              // addedBy:1,
            },
          },
        ],
        as: "activity",
      },
    },
    {
      $unwind: {
        path: "$activity",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        pipeline: [
          {
            $project: {
              firstName: 1,
              lastName: 1,
              email: 1,
              mobileNo: 1,
              fullName: { $concat: ["$firstName", " ", "$lastName"] },
            },
          },
        ],
        as: "userDetails",
      },
    },
    {
      $unwind: {
        path: "$userDetails",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        activityName: "$activity.activityTitle",
        activityReferenceID: "$activity.referenceCode",
        avtivtyProductCode: "$activity.productCode",
        activityDate: "$activity.createdOn",
        userName: "$userDetails.fullName",
        bookingRefId: "$alpfaNueID",
        bookingDate: "$bookingDate",
        bookingTime: "$bookingTime",
        bookingAmmount: "$amount",
        marchentCommisonPercentage: "$activity.marchentCommisonPercentage",
        marchentGetPrice: {
          $round: [
            {
              $subtract: [
                "$amount",
                {
                  $multiply: [
                    "$amount",
                    { $divide: ["$activity.marchentCommisonPercentage", 100] },
                  ],
                },
              ],
            },
            2, // Round to 2 decimal places
          ],
        },
      },
    },
    {
      $addFields: {
        adminGetPrice: {
          $round: [
            {
              $subtract: [
                "$bookingAmmount",
                "$marchentGetPrice"
              ],
            },
            2,
          ],
        },
      },
    },

    {
      $sort: {
        createdOn: -1,
      },
    },

    {
      $project: {
        activity: 1,
        activityName: 1,
        activityReferenceID: 1,
        avtivtyProductCode: 1,
        activityDate: 1,
        userName: 1,
        bookingRefId: 1,
        bookingDate: 1,
        bookingTime: 1,
        bookingAmmount: 1,
        marchentCommisonPercentage: 1,
        marchentGetPrice: 1,
        adminGetPrice: 1
      },
    },
  ])
    .then((data) => {
      const result = data.filter(
        (a) => a.activity !== null && a.activity !== undefined
      );
      const bookingTotalAmmount = result.reduce(
        (total, item) => total + (item.bookingAmmount || 0),
        0
      );
      const marchentTotalGetPrice = result.reduce(
        (total, item) => total + (item.marchentGetPrice || 0),
        0
      );
      const adminTotalGetPrice = result.reduce(
        (total, item) => total + (item.adminGetPrice || 0),
        0
      );

      res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Marchent finance booking details fetched successfully!",
        // data: data.filter((a) => a.activity !== null && a.activity !== undefined),
        length: result.length,
        data: result,
        bookingTotalAmmount: parseFloat(bookingTotalAmmount.toFixed(2)),
        marchentTotalGetPrice: parseFloat(marchentTotalGetPrice.toFixed(2)),
        adminTotalGetPrice: parseFloat(adminTotalGetPrice.toFixed(2)),

      });
    })

    .catch((error) => {
      console.log("error is", error);
      res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error, Please try again later",
        error: error,
      });
    });
};


const generateBillngPdf = async (req, res) => {
  function generateInvoiceNumber(length) {
    const characters = "0123456789";
    let invoiceNumber = "";

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      invoiceNumber += characters.charAt(randomIndex);
    }

    return invoiceNumber;
  }

  const invoiceNumber = generateInvoiceNumber(13); // Change the length as needed
  console.log("Generated Invoice Number:", invoiceNumber);
  Merchant.aggregate([
    {
      $match: {
        _id: req.user._id,
      },
    },

    {
      $lookup: {
        from: "merchentcommissions",
        localField: "_id",
        foreignField: "marchentID",
        pipeline: [
          {
            $addFields: {
              book: "$bookingDate",
              year: { $year: { $toDate: "$bookingDate" } },
              month: { $month: { $toDate: "$bookingDate" } },
            },
          },
          {
            $match: {
              orderID: new mongoose.Types.ObjectId(req.params.orderid),
              year: req.body.year,
              month: req.body.month,
            },
          },
        ],
        as: "commission",
      },
    },

    {
      $addFields: {
        totalPayment: { $sum: "$commission.marchentCommissionAmount" },
      },
    },
    {
      $project: {
        bankCode: 1,
        branchCode: 1,
        marBankAccNo: 1,
        legalCompanyName: 1,
        companyName: 1,
        country: 1,
        city: 1,
        companyStreetAddress: 1,
        year: 1,
        month: 1,
        book: 1,
        // commission:1,
        totalPayment: 1,
      },
    },
  ])
    .then(async (data) => {
      // res.status(200).json({
      //   data:data
      // })
      // console.log({ data });
      const lastDate = getLastDateOfMonth(req.body.year, req.body.month);
      // console.log("data", data)
      // console.log(`Last date of ${req.body.year}-${req.body.month + 1}: ${lastDate}`);

      var result = "";
      function formatDate(dateString) {
        const months = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];

        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = months[date.getMonth()];
        const day = date.getDate();

        return `${month} ${day}, ${year}`;
      }

      const inputDateString = new Date();
      const formattedDate = formatDate(inputDateString);
      console.log(formattedDate);
      var timestamp = `${new Date().getDate()}${new Date().getHours()}${new Date().getSeconds()}${new Date().getMilliseconds()}`;

      let options = {
        format: "A4",
        landscape: true,
      };

      result += `<section style="width: 100%; height: 95vh;">
        <div style="max-width: 1000px; width: 100%; margin: 0 auto; padding-bottom: 80px;">
            <table style="width: 100%; margin-top: 30px;">
                <tbody>
                    <tr style="width: 100%;">
                        <td style="padding-bottom: 50px;">
                            <figure style="width: 115px; height: 65px; margin: 0;">
                                <img src="https://i.ibb.co/Jj1Fg7v/things-to-doo-logo.png" alt="things-to-doo-logo"
                                    style="width: 100%; height: 100%;">
                            </figure>
                        </td>
                        <td>
                            <p style="font-size: 15px; font-weight: 500; margin: 0 0 3px 0; text-align: right;">Payment
                                no. ThingsToDo-${invoiceNumber}</p>
                            <p style="font-size: 15px; font-weight: 500; margin: 0; text-align: right;">${formattedDate}
                            </p>
                        </td>
                    </tr>
                    <tr style="width: 100%;">
                        <td style="padding-bottom: 60px;" colspan="2">
                            <div>
                                <p style="margin: 0 0 3px 0; font-weight: 500; font-size: 15px;">${data[0].companyName}</p>
                                <p style="margin: 0 0 3px 0; font-weight: 500; font-size: 15px;">${data[0].companyStreetAddress},
                                    ${data[0].city}</p>`;
      // <p style="margin: 0 0 3px 0; font-weight: 500; font-size: 15px;"> BT71HU Belfast</p>
      // <p style="margin: 0 0 3px 0; font-weight: 500; font-size: 15px;">Northern Ireland</p>
      result += `<p style="margin: 0 0 3px 0; font-weight: 500; font-size: 15px;">${data[0].country}</p>
                            </div>
                        </td>
                    </tr>
                    <tr style="width: 100%; ">
                        <td colspan="2">
                            <p style="color: black; font-weight: bold; margin: 0px; font-size: 21px;">Payment
                                confirmation GPS-65606-00932072</p>
                            <p style="text-align:end;color: black; font-weight: bold; margin: 0;">Amount (GBP) </p>
                        </td>
                    </tr>

                    <tr>
                        <td>
                            <span style="margin-right: 70px;">${lastDate}-${req.body.month}-${req.body.year}</span>
                            <span>Invoice no. ThingsToDo-${invoiceNumber}</span>
                        </td>
                        <td>
                            <p style="text-align:end; margin: 10px 0;">${data[0].totalPayment}</p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding-top: 20px;">
                            <span style="font-size: 16px; font-weight: bold;">Total payment</span>
                        </td>
                        <td style="text-align: right; padding-top: 20px;">
                            <span style="font-size: 16px; font-weight: bold;">${data[0].totalPayment}</span>
                        </td>
                    </tr>
                    <tr>
                        <td colspan="2" style="border-bottom: 1px solid #68636398;"></td>
                    </tr>
                    <tr>
                        <td style="padding-top: 45px;">
                            <p style="margin: 0 0 20px 0; font-size: 16px; font-weight: 500;">The total balance will be
                                transferred to the following bank account:</p>
                            <div style="margin-top: 25px; padding-left: 30px;">
                                <div style="margin-bottom: 10px;">
                                    <span style="display: inline-block; width: 220px; font-weight: 500;">Branch Sorting
                                        Code</span>
                                    <span style="font-weight: bold;">${data[0].branchCode}</span>
                                </div>
                                <div style="margin-bottom: 10px;">
                                    <span style="display: inline-block; width: 220px; font-weight: 500;">Account
                                        Number</span>
                                    <span style="font-weight: bold;">${data[0].marBankAccNo}</span>
                                </div>`;
      // <div style="margin-bottom: 10px;">
      //     <span style="display: inline-block; width: 220px; font-weight: 500;">Building
      //         Society Account</span>
      //     <span style="font-weight: bold;">Barclays Bank plc</span>
      // </div>
      result += `<div style="margin-bottom: 10px;">
                                    <span style="display: inline-block; width: 220px; font-weight: 500;">Legal Business
                                        Name</span>
                                    <span style="font-weight: bold;">${data[0].legalCompanyName}</span>
                                </div>
                                <div style="margin-bottom: 10px;">
                                    <span
                                        style="display: inline-block; width: 220px; font-weight: 500;">Country/Region</span>
                                    <span style="font-weight: bold;">${data[0].country}</span>
                                </div>
                                <div style="margin-bottom: 10px;">
                                    <span style="display: inline-block; width: 220px; font-weight: 500;">Address Line
                                        1</span>
                                    <span style="font-weight: bold;">${data[0].companyStreetAddress}</span>
                                </div>
                                <div>
                                    <span style="display: inline-block; width: 220px; font-weight: 500;">City</span>
                                    <span style="font-weight: bold;">${data[0].city}</span>
                                </div>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
            <table style="width: 100%; margin-top: 150px;">
                <tr>
                    <td style="padding-bottom: 15px;">
                        <p style="font-size: 15px; font-weight: bold; margin: 0;">ThingsToDoo Deutschland GmbH</p>
                    </td>
                </tr>
                <tr>
                    <td
                        style="display: inline-block; max-width: 28%; width: 100%; border-right: 2px solid #504e4e; height: 175px;">
                        <p style="font-size: 16px; font-weight: 500; margin: 0 0 8px 0;">Sonnenburger Strasse 73</p>
                        <p style="font-size: 16px; font-weight: 500; margin: 0 0 8px 0;">10437 Berlin</p>
                        <p style="font-size: 16px; font-weight: 500; margin: 0 0 8px 0;">Germany</p>
                    </td>
                    <td
                        style="display: inline-block; max-width: 28%; width: 100%; border-right: 2px solid #504e4e; height: 175px;">
                        <div style="margin-left: 10px; display: inline-block;">
                            <p style="font-size: 16px; font-weight: 500; margin: 0 0 8px 0;">Phone: +49 30 568 394 45
                            </p>
                            <p style="font-size: 16px; font-weight: 500; margin: 0 0 8px 0;">supplier@getyourguide.com
                            </p>
                            <p style="font-size: 16px; font-weight: 500; margin: 0 0 8px 0;">www.getyourguide.com</p>
                        </div>
                    </td>
                    <td style="max-width: 28%; width: 100%; height: 175px; display: inline-block;">
                        <div style="margin-left: 30px; display: inline-block;">
                            <p style="font-size: 16px; font-weight: 500; margin: 0 0 8px 0;">Amtsgericht Charlottenburg
                            </p>
                            <p style="font-size: 16px; font-weight: 500; margin: 0 0 8px 0;">HRB 132059</p>
                            <p style="font-size: 16px; font-weight: 500; margin: 0 0 8px 0;">VAT ID No. DE276456081</p>
                            <p style="font-size: 16px; font-weight: 500; margin: 0 0 8px 0;">Managing Directors:
                                Johannes
                                Reck, Tao</p>
                            <p style="font-size: 16px; font-weight: 500; margin: 0 0 8px 0;">Tao, Nils Chrestin</p>
                        </div>
                    </td>
                </tr>
            </table>
        </div>
       </section>`;

      let file = result;
      let path = "pdf/" + timestamp + ".pdf"
      HtmlToPdf.generatePdf(file, path, options).then(async (pdfBuffer) => {
        // console.log("PDF Buffer:-", pdfBuffer);
        // fs.writeFile(
        //   "pdf/" + timestamp + ".pdf",
        //   pdfBuffer,
        //   async function (err) {
        // console.log("hello")

        var merchantcheck = await MerchantBilling.findOne({
          merchantId: req.user._id,
          year: req.body.year,
          month: req.body.month,
        }).exec();

        if (merchantcheck == null || merchantcheck == "") {
          new MerchantBilling({
            merchantId: req.user._id,
            year: req.body.year,
            month: req.body.month,
            billingLink: `/pdf/${timestamp}.pdf`,
            createdOn: new Date(),
          }).save();
        }

        if (err) return console.log(err);
        // console.log("Hello World > helloworld.txt");
        return res.status(200).json({
          status: true,
          data: "http://34.249.210.102:8025/pdf/" + timestamp + ".pdf",
          // data: "http://127.0.0.1:8025/pdf/" + timestamp + ".pdf",
          message: "Pdf Created Successfully",
          // data:data[0].list
        });
        //   }
        // );
      });
      // res.status(ResponseCode.errorCode.success).json({
      //   status: true,
      //   message: "Get all the data",
      //   data: data,
      // });
    })
    .catch((error) => {
      console.log(error);
      res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error, Please try again later",
        error: error,
      });
    });
};

const viewBillingHistory = async (req, res) => { 
  MerchantBilling.aggregate([
    {
      $match: {
        merchantId: req.user._id,
      },
    },
    {
      $project: {
        __v: 0,
        isDeleted: 0,
        createdOn: 0,
      },
    },
  ])
    .then((data) => {
      res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Get all the data",
        data: data,
      });
    })
    .catch((error) => {
      res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error, Please try again later",
        error: error,
      });
    });
};

const deleteBooking = async (req, res) => {
  const userId = req.user._id;
  console.log("user id is", userId);
  await Booking
    .findOneAndUpdate(
      { _id: req.params.id },
      {
        $set: {
          bookingStatus: "cancelled",
          cancelledBy: userId,
          reason: req.body.reason,
          description: req.body.description
        },
      }
    )
    .then(async (data) => {
      // console.log({ data });
      var availabilities = await availabilityData
        .findOne({
          activityDetailsId: data.activityDetailsId,
          tourDate: data.bookingDate,
          time: data.bookingTime,
        })
        .exec();

      console.log(availabilities)

      if (availabilities != null) {
        var totalRemaining = availabilities.remeningUser + data.totalTourPerson;
        // console.log({totalRemaining})

        await availabilityData.findOneAndUpdate(
          {
            activityDetailsId: data.activityDetailsId,
            tourDate: data.bookingDate,
            time: data.bookingTime,
          },
          {
            $set: {
              remeningUser: totalRemaining,
            },
          },
          { new: true }
        );


      }
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "Booking cancelled successfully",
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


const bookingCountInDashboard = async (req, res) => {
  const totalActivityDetails = await ActivityDetails.aggregate([
    {
      $match: {
        isDeleted: false,
        addedByid: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "userbookings",
        localField: "_id",
        foreignField: "activityDetailsId",
        as: "userBooking",
      },
    },
    {
      $addFields: {
        totalBooking: { $size: "$userBooking" },
      },
    },
    {
      $lookup: {
        from: "reviewratings",
        localField: "_id",
        foreignField: "activityDetailsId",
        as: "rating",
      },
    },
    {
      $addFields: {
        sum: { $sum: "$rating.avgRating" },
        ratingCount: { $size: "$rating" }
      }
    },

    {
      $addFields: {
        averageratingNew: {
          $cond: {
            if: {
              $gt: ["$ratingCount", 0]
            },
            then: {
              $floor: { $divide: ["$sum", "$ratingCount"] }
            }, else: 0
          }
        }
      }
    },

    {
      $lookup: {
        from: "availabilities",
        localField: "_id",
        foreignField: "activityDetailsId",
        as: "availability"
      }
    },
    {
      $addFields: {
        totalAvailability: { $size: "$availability" }
      }
    }
  ])
    .then((data) => {
      let sum = 0; let averageRating = 0; let taotalAvailble = 0;
      data.forEach((ele) => {
        sum = sum + ele.totalBooking;
        averageRating = averageRating + ele.averageratingNew;
        taotalAvailble = taotalAvailble + ele.totalAvailability;
      });
      console.log("averageRating", averageRating);
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "View successfully !",
        // data:data,
        totalBooking: sum,
        averageRatingSum: averageRating,
        totalAvailabilitySum: taotalAvailble
      });
    })
    .catch((error) => {
      console.log("error", error);
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error,please try again !",
      });
    });
};






module.exports = {
  viewBookingDetails,
  generateBillngPdf,
  viewBillingHistory,
  deleteBooking,
  bookingCountInDashboard,
  financeBookingDetails
};
