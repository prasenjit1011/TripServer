const mongoose = require("mongoose");
const userBooking = require("../../Models/userBooking");
const bookingDetails = require("../../Models/bookingDetails");
const Merchant = require("../../Models/merchant");
const fs = require("fs");
const { HtmlToPdf } = require("../../service/pdfGenerator");
const ResponseCode = require("../../service/responseCode");
const { Validator } = require("node-input-validator");
const { DBerror, InputError } = require("../../service/errorHandeler");
var moment = require("moment");

const bookingView = (req, res) => {
  userBooking.aggregate([
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
              as: "merchant",
            },
          },
          { $unwind: { path: "$merchant", preserveNullAndEmptyArrays: true } },

          {
            $addFields: {
              addedBY: {
                $cond: {
                  if: { $eq: ["$addedBy", "admin"] },
                  then: "Things to dooo",
                  else: "$merchant.fullname",
                },
              },
            },
          },

          {
            $project: {
              activityTitle: 1,
              image: 1,
              referenceCode: 1,
              addedBY: 1
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

const generateBillngPdf = async (req, res) => {
  Merchant.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.params.id),
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

        // commission:1,
        totalPayment: 1,
      },
    },
  ])
    .then((data) => {
      // console.log({data})
      const lastDate = getLastDateOfMonth(req.body.year, req.body.month);

      return false;
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
                                no. GPS-65606-00932072</p>
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
                            <span>Invoice no. GIS-65606-01017834</span>
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

      let file = { content: result };

      HtmlToPdf.generatePdf(file, options).then((pdfBuffer) => {
        // console.log("PDF Buffer:-", pdfBuffer);
        fs.writeFile("pdf/" + timestamp + ".pdf", pdfBuffer, function (err) {
          // console.log("hello")

          if (err) return console.log(err);
          // console.log("Hello World > helloworld.txt");
          return res.status(200).json({
            status: true,
            data: "http://34.249.210.102:8025/pdf/" + timestamp + ".pdf",
            // data: "http://127.0.0.1:8025/pdf/" + timestamp + ".pdf",
            message: "Pdf Created Successfully",
            // data:data[0].list
          });
        });
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

const viewBookingTicket = async (req, res) => {
  userBooking
    .aggregate([
      {
        $match: {
          orderId: new mongoose.Types.ObjectId(req.params.orderid),
          activityDetailsId: new mongoose.Types.ObjectId(req.params.activityid),
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
                from: "cities",
                localField: "cityId",
                foreignField: "_id",
                as: "city",
              },
            },
            {
              $unwind: {
                path: "$city",
                preserveNullAndEmptyArrays: true,
              },
            },

            {
              $lookup: {
                from: "categories",
                localField: "categoryId",
                foreignField: "_id",
                as: "category",
              },
            },
            {
              $unwind: {
                path: "$category",
                preserveNullAndEmptyArrays: true,
              },
            },

            {
              $project: {
                activityTitle: 1,
                // image: 1,
                meetingPoint: 1,
                tourDuration: 1,
                // participentType: 1,
                cityName: "$city.cityName",
                categotyName: "$category.categoryName",
              },
            },
          ],
          as: "activityDetails",
        },
      },
      {
        $unwind: {
          path: "$activityDetails",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
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
        $project: {
          orderId: 1,
          bookingDate: 1,
          bookingTime: 1,
          participentType: 1,
          totalTourPerson: 1,
          activityDetails: 1,
          alpfaNueID: 1,
          userFirstName: "$userDetails.firstName",
          userLastName: "$userDetails.lastName",
        },
      },

      // {
      //   $project: {
      //     _id: 0,
      //     alpfaNueID: 1,
      //     list: 1,
      //   },
      // },
    ])
    .then(async (data) => {
      // console.log("data========", data);
      // res.json({
      //   data: data,
      // });
      if (!data || data.length === 0) {
        return res.status(404).json({
          status: false,
          message: "Booking Data not found",
        });
      }
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

      const inputDateString = data?.[0]?.bookingDate;
      const formattedDate = formatDate(inputDateString);
      console.log(formattedDate);

      var total = [];
      var sum = 0;
      var timestamp = `${new Date().getDate()}${new Date().getHours()}${new Date().getSeconds()}${new Date().getMilliseconds()}`;

      data.forEach((ele) => {
        console.log("vggy", ele);

        result += `<!DOCTYPE html>
        <html lang="en">
        
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title></title>
        </head>
        
        <body>
            <section style="width: 100%; height: auto; padding: 10px 0;">
                <div style="max-width: 1100px; margin: 0 auto; background-color: #fff;">
                    <div style="width: 100%; padding: 10px;">
                        <table>
                            <tr colspan="2">
                                <td style="display: block;">
                                            <a href="https://imgbb.com/"><img src="https://i.ibb.co/KjqRKWR/things-to-doo-logo.png" alt="things-to-doo-logo" style="max-width: 80px;width: 100%; height: 100%;"></a>
                                </td>
                                <td style="width: 500px; padding-left: 10px;">
                                    <span>
                                        <p style="font-weight: 800; font-size: 15px; line-height: 0px;">${ele.alpfaNueID}</p>
                                        <P style="font-weight: 800; font-size: 15px; line-height: 10px;">${ele.activityDetails.cityName}:${ele.activityDetails.categotyName}</P>
                                        <p style="font-size: 15px;color: rgb(58, 59, 59);line-height: 20px; font-weight: 600;">
                                            Option (Stander Option)</p>
                                        <p style="font-size: 15px; color:  rgb(58, 59, 59);  line-height: 0px;">${ele.activityDetails.cityName}:${ele.activityDetails.categotyName}
                                            
                                        </p>
                                        <div style="padding-top: 10px;">
                                            <a href="https://ibb.co/BnqCTw5"><img src="https://i.ibb.co/SfR3VJ4/calendar-152139-640.png" alt="calendar-152139-640"style="max-width: 20px;width: 100%; height: 100%;"></a>
                                            <span
                                                style="font-size: 14px; color:  rgb(58, 59, 59); line-height: 20px; font-weight: 600;padding-left: 10px;">${formattedDate}  ${ele.bookingTime}
                                                </span>
                                        </div>
                                        <div style="padding-top: 10px;">
                                            <a href="https://imgbb.com/"><img src="https://i.ibb.co/DgGczxR/images.png" alt="images"style="max-width: 20px;width: 100%; height: 100%;" ></a>
                                            <span
                                                style="font-size: 14px; color: rgb(58, 59, 59); line-height: 20px; font-weight: 600;padding-left: 10px;">Duration:
                                                ${ele.activityDetails.tourDuration.value}  ${ele.activityDetails.tourDuration.unit} 
                                                </span>
                                        </div>
                                        <p style="font-weight: 600; font-size: 15px; color: rgb(168, 169, 170);">Booked by</p>
                                        <p style="font-weight: 600; font-size: 15px; color:rgb(58, 59, 59);">${ele.userFirstName} ${ele.userLastName}
                                        </p>
                                    </span>
                                </td>`;

        for (let element of ele.participentType) {
          result += `<td style="width: 400px; padding-left: 30px;">
                                        
        <img src="https://i.ibb.co/PcFX5YF/png-transparent-user-computer-icons-user-miscellaneous-cdr-rectangle-thumbnail.png" alt="png-transparent-user-computer-icons-user-miscellaneous-cdr-rectangle-thumbnail" style="max-width: 20px;width: 100%; height: auto;">
        <span style="font-weight: 600; font-size: 15px; color: #000;padding-left: 10px;">${element.person} ${element.pertype}(${element.age})
        </span>

          </td>`;
        }

        //     <td style="width: 400px; padding-left: 30px;">

        //     <img src="https://i.ibb.co/PcFX5YF/png-transparent-user-computer-icons-user-miscellaneous-cdr-rectangle-thumbnail.png" alt="png-transparent-user-computer-icons-user-miscellaneous-cdr-rectangle-thumbnail" style="max-width: 20px;width: 100%; height: auto;">
        //     <span style="font-weight: 600; font-size: 15px; color: #000;padding-left: 10px;">${ele.participentType[1].person} ${ele.participentType[1].pertype}(${ele.participentType[1].age})
        //         </span>

        // </td>

        result += ` </tr>
                        </table>
                    </div>
        
                    <div style="width: 100%; padding-top: 10px;">
                        <table>
                            <tr>
                                <td style="width: 500px;padding-bottom: 10px;">
                                    <span>
                                        <h4 style="font-size: 25px; font-weight: 700; margin-top: 5px;">What to remember ?</h4>
                                        <p style="font-size: 15px;">Lorem ipsum dolor, sit amet consectetur adipisicing elit.
                                            Eveniet doloribus voluptatum
                                            maiores ab maxime pariatur! Adipisci, officia. Voluptatem, harum architecto quis
                                            consequuntur totam impedit..</p>
                                        <p style="font-size: 15px;">Lorem ipsum dolor sit, amet consectetur adipisicing elit.
                                            Iusto
                                            voluptatum nobis assumenda laudantium? Ab, quia repellendus culpa dolorem libero
                                            laborum
                                            quisquam modi reprehenderit exercitationem aliquid sequi sunt sint asperiores eum.
                                        </p>
                                    </span>
                                </td>
                                <td style="width: 700px; padding-left: 10px;">
                                    <span>
                                        <p style="font-size: 20px; font-weight: 700; margin-top: 0px;line-hight:0.5px">Need Help ?</p>
                                        <p style="font-size: 15px;font-weight: 500;">Lorem ipsum dolor sit amet consectetur
                                            adipisicing elit. Suscipit ad aliquam consequuntur repellendus inventore architecto
                                            eos
                                            quaerat quo,</p>
                                        <p style="font-size: 15px;font-weight: 500;line-hight:0px">Local partner: Your company name</p>
                                        <p style="font-size: 14px;font-weight: 500;">Phone: <span
                                                style="font-size: 15px;font-weight: 500;color: blue;">+453179513</span></p>
                                        <p style="font-size: 14px;font-weight: 500;">email: <span
                                                style="font-size: 14px;font-weight: 500;color: blue;">gyuf169bj@465.com ,
                                                gufom124@.com</span></p>
                                        <div>
                                            <p style="font-size: 15px; line-hight:0px; font-weight: 700; margin-top: 0px;">Manage your booking
                                            </p>
                                            <p style="font-size: 15px;font-weight: 500;">Lorem ipsum dolor sit amet, consectetur
                                                adipisicing elit. Assumenda aspernatur soluta fugiat molestiae rem minus vitae
                                                reiciendis iste distinctio neque. Provident, dolore.</p>
                                            <p style="font-size: 15px;font-weight: 500;">Booking reference <span
                                                    style="font-size: 15px;font-weight: 500;color: blue;">GYG0000000</span></p>
                                            <P style="font-size: 15px;font-weight: 500;">PIN: <span
                                                    style="font-size: 14px;font-weight: 500;color: blue;">00000000</span></P>
                                            <p style="font-size: 14px;font-weight: 500;">For general booking questions, call
                                                Think
                                                to Do customer service 24/7 at <span
                                                    style="font-size: 15px;font-weight: 500;color: blue;">+617913681</span></p>
                                            <p style="font-size: 14px;font-weight: 500;">message us using WhatsApp(English
                                                only)on<span style="font-size: 13px;font-weight: 500;color: blue;">
                                                    +46921761</span>
                                            </p>
                                        </div>
                                    </span>
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>
            </section>
          </body>
        
          </html>`;

        result += `<!DOCTYPE html>
        <html lang="en">
        
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Document</title>
        </head>
        <style> html { -webkit-print-color-adjust: exact; } </style>
        <body>
      
            <section style="width: 100%; height: auto; text-align: start; padding: 100px 0;">
                <div
                    style="max-width: 700px; width: 100%; margin: 0 auto; border-radius: 6px;  overflow: hidden;">
        
                    <div style="background-color:orangered; height: auto; padding: 50px 30px;">
                        <h2 style="color: #fff;"> Things To Do</h2>
                        <p style="color: #fff;">${ele.activityDetails.cityName}:${ele.activityDetails.categotyName}</p>
                        <p style="color: #fff; padding: 10px 0;">Standard option</p>
                    </div>
            
        <div style="">
                    <table style="max-width: 100%; width: 100%;padding: 20px 30px;background-color: #e7dada69;">
                        <tr>
                            <td>
                                <p style="color: orangered;">Date</p>
                                <p style="color: blacks; font-weight: 700;">${formattedDate}</p>
                            </td>
                            <td>
                                <p style="color: orangered;">Time</p>
                                <p style="color: black; font-weight: 700;"> ${ele.bookingTime}</p>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="2">
                                <p style="color: orangered;">Order#</p>
                                <p style="color: black; font-weight: 700;">${ele.alpfaNueID}</p>
                            </td>
                        </tr>
                    </table>
        
                    <div style="width: 100%; padding: 20px 30px; background-color: #e7dada69;">
                        <p style="font-size: 24px; color: black;">${ele.userFirstName} ${ele.userLastName}</p>
                        <p style="color: black;">Ticket for ${ele.totalTourPerson} persons</p>
                    </div>
        </div>
                </div>
        
            </section>
        </body>
        
         </html>`;

        result += `<!DOCTYPE html>
         <html lang="en">
        
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title></title>
        </head>
        
        <body>
            <section style="width: 100%; height: auto;padding: 80px 0 20px 0;">
                <div style="max-width: 1000px; margin: 0 auto; background-color: #fff;">
                    <div style=" padding: 20px; background-color: orangered;">
                        <p style="text-align: center; color: #fff; font-size: 30px; font-weight: 600;padding-top:20px">Booking details</p>
                    </div>
                    <div>
                        <h2 style="text-align: center; font-size: 30px; font-weight: 600;padding-top: 20px;">Important
                            Information</h2>
                        <p style="text-align: center; font-size: 20px;padding: 0px 80px; ">Lorem, ipsum dolor sit amet
                            consectetur adipisicing elit. Iure, obcaecati eveniet! Sed eum in eaque excepturi dolor saepe
                            consectetur expedita voluptas aut esse similique, animi ullam dicta, fuga perferendis unde. Lorem
                            ipsum dolor sit amet consectetur adipisicing elit. Voluptatem quae deleniti quis libero similique
                            non autem ipsa dignissimos illo magnam nemo corporis voluptate maxime repellat ipsam saepe, atque
                            quibusdam. Debitis. Lorem ipsum, dolor sit amet consectetur adipisicing elit. Neque iste ex fugit
                            culpa quia blanditiis minima quod beatae quaerat doloremque, libero consequuntur amet nobis
                            molestias. Excepturi, soluta...</p>
        
                            <h2 style="text-align: center; font-size: 30px; font-weight: 600;padding-top: 10px;">Merchant Information</h2>
                            <p style="font-size: 15px;padding: 0px 80px;">Your Company name</p>
                            <p style="font-size: 15px;padding: 0px 80px;color: blue;">+4921764864</p>
                            <p style="font-size: 15px;padding: 0px 80px;color: blue;">cjgyuv@hfujb254-hgfjb25667.vkhi3267-467.com</p>
                            <p style="font-size: 15px;padding: 0px 80px; color: #4d4c4c;padding-bottom: 50px;">Lorem ipsum dolor sit, amet consectetur adipisicing elit. At repudiandae officia itaque asperiores vitae debitis placeat impedit quidem voluptatem! Dolorem suscipit accusantium iusto distinctio porro nulla soluta veritatis, rerum quibusdam.</p>
                    </div>
                </div>
            </section>
        </body>
        
        </html>`;
      });

      let file = result;

      let options = {
        format: "A4",
        landscape: true,
      };

      let path = "pdf/" + timestamp + ".pdf"
      HtmlToPdf(file, path, options).then((pdfBuffer) => {

          return res.status(200).json({
            status: true,
            data: "http://34.249.210.102:8025/pdf/" + timestamp + ".pdf",
            // data: "http://127.0.0.1:8025/pdf/" + timestamp + ".pdf",
            message: "Pdf Created Successfully",
            // data:data[0]
          });
        // });
      });
    })
    .catch((error) => {
      console.log(error);
      const errors = DBerror(error);
      res.status(ResponseCode.errorCode.success).json({
        status: false,
        message: "Server error, Please try again later",
        error: errors,
      });
    });
};

module.exports = {
  bookingView,
  generateBillngPdf,
  viewBookingTicket
};
