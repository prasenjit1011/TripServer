const mongoose = require("mongoose");
const ResponseCode = require("../../service/responseCode");
const MerchantCommission = require("../../Models/marchentCommission");
const Merchant = require("../../Models/merchant");
const MerchantBilling = require("../../Models/merchantBilling");
const { HtmlToPdf } = require("../../service/pdfGenerator");
//const {  doPDFUpload } = require("../../service/s3")
const { Validator } = require("node-input-validator");
const { DBerror, InputError } = require("../../service/errorHandeler");
const S3 = require("../../service/s3");

const fs = require("fs");
const userBooking = require("../../Models/userBooking");

const getMarchentInvoice = async (req, res) => {
  var currentDate = new Date(req.body.invoiceDate);
  var currentYear = currentDate.getFullYear();
  var currentMonth = currentDate.getMonth() + 1;

  await MerchantCommission.aggregate([
    {
      $match: {
        isDeleted: false,
        marchentID: req.body.marchentID,
        $expr: {
          $and: [
            { $eq: [{ $year: "$bookingDateFormate" }, currentYear] },
            { $eq: [{ $month: "$bookingDateFormate" }, currentMonth] },
          ],
        },
      },
    },
  ])
    .then(async (data) => {
      // console.log("data", data)
      // return false;

      var totalActivityAmount = data.reduce(
        (acc, nxt) => acc + nxt.activityAmount,
        0
      );
      var marchentCommissionAmount = data.reduce(
        (acc, nxt) => acc + nxt.marchentCommissionAmount,
        0
      );
      var adminAmount = data.reduce((acc, nxt) => acc + nxt.adminAmount, 0);

      const day = new Date();
      const m = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      const str_op =
        currentDate.getDate() +
        " " +
        m[currentDate.getMonth()] +
        " " +
        currentDate.getFullYear();
      console.log(str_op);

      var lastDay = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );

      const lastDayActual =
        lastDay.getDate() +
        " " +
        m[lastDay.getMonth()] +
        " " +
        lastDay.getFullYear();

      // var lastDay = new Date(day.getFullYear(), day.getMonth() + 1, 0);
      // console.log("totalActivityAmount", totalActivityAmount)
      // console.log("marchentCommissionAmount", marchentCommissionAmount)
      // console.log("adminAmount", adminAmount)
      // console.log("lastDayActual", lastDayActual)
      // return false;

      var timestamp = `${new Date().getDate()}${new Date().getHours()}${new Date().getSeconds()}${new Date().getMilliseconds()}`;

      let options = {
        format: "A4",
        landscape: true,
      };

      var result = "";

      result +=
        `<section style="width: 100%; height: 95vh;">
            <div style="max-width: 1000px; width: 100%; margin: 0 auto; padding-bottom: 80px;">
                <table style="width: 100%; margin-top: 30px;">
                    <tbody>
                        <tr style="width: 100%;">
                            <td colspan="2" style="padding-bottom: 50px;">
                                <figure style="width: 115px; height: 65px; margin: 0;">
                                    <img src="https://i.ibb.co/Jj1Fg7v/things-to-doo-logo.png" alt="things-to-doo-logo" style="width: 100%; height: 100%;">
                                </figure>
                            </td>
                        </tr>
                        <tr style="width: 100%;">
                            <td style="padding-bottom: 60px;">
                                <div>
                                    <p style="margin: 0 0 3px 0; font-weight: 500; font-size: 15px;">Finn Tours LTD </p>
                                    <p style="margin: 0 0 3px 0; font-weight: 500; font-size: 15px;">121 Fitzroy Ave,
                                        Belfast</p>
                                    <p style="margin: 0 0 3px 0; font-weight: 500; font-size: 15px;"> BT71HU Belfast</p>
                                    <p style="margin: 0 0 3px 0; font-weight: 500; font-size: 15px;">Northern Ireland</p>
                                    <p style="margin: 0 0 3px 0; font-weight: 500; font-size: 15px;"> United Kingdom</p>
                                </div>
                            </td>
                            <td style="padding-bottom: 60px;">
                                <div>
                                    <p style="font-size: 15px; font-weight: 500;">Receipt date: <span
                                            style="margin-left: 20px; text-align: right; width: 72%; display: inline-block;">` +
        str_op +
        `</span></p>
                                    <p style="font-size: 15px; font-weight: 500;">Receipt no.: <span
                                            style="margin-left: 20px; text-align: right; width: 74%; display: inline-block;">GIS-65606-01017834</span>
                                    </p>
                                </div>
                            </td>
                        </tr>
                        <tr style="width: 100%; ">
                            <td colspan="2">
                                <p style="color: black; font-weight: bold; margin: 0px;">Invoice for services delivered
                                    until:` +
        lastDayActual +
        `</p>
                                <p style="text-align:end;color: black; font-weight: bold; margin: 0;">Amount (GBP) </p>
                            </td>
                        </tr>
    
                        <tr>
                            <td>
                                <p style="margin: 10px 0;">Service Commission (in accordance with attached detail)</p>
                            </td>
                            <td>
                                <p style="text-align:end; margin: 10px 0;">` +
        adminAmount +
        `</p>
                            </td>
                        </tr>
    
                        <tr style="width: 100%; padding: 20px 0; ">
                            <td colspan="2">
                                <p style="color: black; font-weight: bold; margin: 40px 0 0 0;">Balance</p>
                                <p style="text-align:end; color: black; font-weight: bold; margin: 0;">Amount (GBP) </p>
                            </td>
                        </tr>
    
    
                        <tr>
                            <td>
                                <p style="font-size: 16px; margin: 6px 0 0 0;">Total Booking</p>
                            </td>
                            <td>
                                <p style="text-align: end; font-size: 16px; margin: 6px 0 0 0;">` +
        totalActivityAmount +
        `</p>
                            </td>
                        </tr>
    
                        <tr>
                            <td>
                                <p style="font-size: 16px; margin: 6px 0 0 0;">./. our Commission</p>
                            </td>
                            <td>
                                <p style="text-align: end; font-size: 16px; margin: 6px 0 0 0;">` +
        adminAmount +
        `</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="color: blue; width: 100%;" colspan="2">
                                <hr>
                            </td>
                        </tr>
    
                        <tr>
                            <td>
                                <p style="color: black; font-weight: bold; margin: 0 0 15px 0;">Net balance in your favor</p>
                            </td>
                            <td>
                                <p style="color: black; font-weight: bold; text-align: end; margin: 0 0 15px 0;">` +
        marchentCommissionAmount +
        `</p>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="2">
                                <p style="width: 880px; font-size: 16px; font-weight: 500;">The payment is issued on every 5th working day of the following month. In case you
                                    opted in for the more frequent payment program, we also issue your payments on the
                                    20th of every month.</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding-bottom: 100px;">
                                <p style="font-size: 16px; font-weight: 500; margin: 0;">Reverse Charge</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <table style="width: 100%;">
                    <tr>
                        <td style="padding-bottom: 15px;">
                            <p style="font-size: 15px; font-weight: bold; margin: 0;">ThingsToDoo Deutschland GmbH</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="display: inline-block; padding-right: 90px; border-right: 2px solid #504e4e; height: 175px;">
                            <p style="font-size: 16px; font-weight: 500; margin: 0 0 8px 0;">Sonnenburger Strasse 73</p>
                            <p style="font-size: 16px; font-weight: 500; margin: 0 0 8px 0;">10437 Berlin</p>
                            <p style="font-size: 16px; font-weight: 500; margin: 0 0 8px 0;">Germany</p>
                        </td>
                        <td style="display: inline-block; padding-right: 90px; padding-left: 90px; border-right: 2px solid #504e4e; height: 175px;">
                            <p style="font-size: 16px; font-weight: 500; margin: 0 0 8px 0;">Phone: +49 30 568 394 45</p>
                            <p style="font-size: 16px; font-weight: 500; margin: 0 0 8px 0;">supplier@getyourguide.com</p>
                            <p style="font-size: 16px; font-weight: 500; margin: 0 0 8px 0;">www.getyourguide.com</p>
                        </td>
                        <td style="padding-left: 90px; height: 175px; display: inline-block;">
                            <p style="font-size: 16px; font-weight: 500; margin: 0 0 8px 0;">Amtsgericht Charlottenburg</p>
                            <p style="font-size: 16px; font-weight: 500; margin: 0 0 8px 0;">HRB 132059</p>
                            <p style="font-size: 16px; font-weight: 500; margin: 0 0 8px 0;">VAT ID No. DE276456081</p>
                            <p style="font-size: 16px; font-weight: 500; margin: 0 0 8px 0;">Managing Directors: Johannes Reck, Tao</p>
                            <p style="font-size: 16px; font-weight: 500; margin: 0 0 8px 0;">Tao, Nils Chrestin</p>
                        </td>
                    </tr>
                </table>
                <table style="width: 100%; margin-top: 30px;">
                    <thead style="background-color: #bbbbbb96;">
                        <tr>
                            <th style="padding: 7px 0 20px 0; font-size: 15px;">Order number</th>
                            <th style="padding: 7px 0 20px 0; font-size: 15px;">Conduction</th>
                            <th style="padding: 7px 0 20px 0; font-size: 15px;">Retail rate</th>
                            <th style="padding: 7px 0 20px 0; font-size: 15px;">Retail rate
                                minus
                                commission</th>
                        </tr>
                    </thead>
                    <tbody>`;
      for (let index = 0; index < data.length; index++) {
        const element = data[index];
        // console.log("element", element)
        result +=
          `<tr>
                        <td style="text-align: center; font-size: 15px; padding-top: 15px;">` +
          element.orderID +
          ` </td>
                        <td style="text-align: center; font-size: 15px; padding-top: 15px;">` +
          element.bookingDate +
          `</td>
                        <td style="text-align: center; font-size: 15px; padding-top: 15px;">` +
          element.activityAmount +
          `</td>
                        <td style="text-align: center; font-size: 15px; padding-top: 15px;">` +
          element.marchentCommissionAmount +
          `</td>
                    </tr>`;
      }

      result += `</tbody>
                </table>
            </div>
        </section>`;

      let file = result;
      let path = "pdf/" + timestamp + ".pdf"
      //=======OLD ONE======
      // HtmlToPdf.generatePdf(file, path, options).then((pdfBuffer) => {
      //   // fs.writeFile("pdf/" + timestamp + ".pdf", pdfBuffer, function (err) {
      //   //   if (err) return console.log(err);

      //   return res.status(200).json({
      //     status: true,
      //     data: "http://34.249.210.102:8025/pdf/" + timestamp + ".pdf",
      //     // data: "http://127.0.0.1:8025/pdf/" + timestamp + ".pdf",
      //     message: "Pdf Created Successfully",
      //   });
      //   // });
      // });

      const pdfBuffer = await HtmlToPdf(file, options);     
      const uploadResult = await S3.doPDFUpload(pdfBuffer, timestamp, 'pdf');

      console.log("uploadResult",uploadResult);
      if (uploadResult.status) {
        return res.status(200).json({
          status: true,
          data: uploadResult.url,
          message: "Pdf Created and Uploaded Successfully",
        });
      } else {
        return res.status(500).json({
          status: false,
          error: uploadResult.error,
          message: "Error uploading PDF to AWS S3",
        });
      }

    })
    .catch((error) => {
      console.log("error", error);
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
            $match: {
              orderID: new mongoose.Types.ObjectId(req.params.orderid),
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
                                  no. ThingsTODO-${invoiceNumber}</p>
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
                              <span style="margin-right: 70px;">${formattedDate}</span>
                              <span>Invoice no. ThingsTODO-${invoiceNumber}</span>
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
      HtmlToPdf.generatePdf(file, path, options).then((pdfBuffer) => {
        // console.log("PDF Buffer:-", pdfBuffer);
        // fs.writeFile("pdf/" + timestamp + ".pdf", pdfBuffer, function (err) {
        //   // console.log("hello")

        //   if (err) return console.log(err);
        // console.log("Hello World > helloworld.txt");
        return res.status(200).json({
          status: true,
          data: "http://34.249.210.102:8025/pdf/" + timestamp + ".pdf",
          // data: "http://127.0.0.1:8025/pdf/" + timestamp + ".pdf",
          message: "Pdf Created Successfully",
          // data:data[0].list
        });
        // });
      });
      // res.status(ResponseCode.errorCode.success).json({
      //   status: true,
      //   message: "Get all the data",
      //   data: data,
      // });
    })
    .catch((error) => {
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
        merchantId: new mongoose.Types.ObjectId(req.params.id),
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


const marchantFinanceBookingDetails = async (req, res) => {
  // console.log(req.user._id);
  const v = new Validator(req.body, {
    id: 'required',
    year: "required",
    month: "required"
  });
  let matched = await v.check().then((val) => val);
  if (!matched) {
    return res
      .status(400)
      .send({ status: false, error: v.errors, message: InputError(v.errors) });
  }
  const marchantId = new mongoose.Types.ObjectId(req.body.id)
  const date = new Date();

  // console.log(req.user._id);
  const formattedDate = moment(date).format("YYYY-MM-DD");

  console.log("formattedDate", formattedDate);

  console.log("marchant id is",marchantId);
  userBooking.aggregate([
    {
      $match: {
        isDeleted: false,
        bookingType: "activity",
        bookingDate: { $gte: formattedDate },
        $expr: {
          $regexMatch: {
            input: "$bookingDate",
            regex: `^${req.body.year}-${req.body.month}-\\d{2}$`,
          },
        },
        
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
              addedByid: marchantId,
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
              countryId:1,
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
        bookingDate: "$bookingDate",
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
        bookingDate:1,
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
        adminGetPrice:1
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
        length: result.length,
        data: result,
        // data: data,
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

module.exports = {
  getMarchentInvoice,
  generateBillngPdf,
  viewBillingHistory,
  marchantFinanceBookingDetails
};
