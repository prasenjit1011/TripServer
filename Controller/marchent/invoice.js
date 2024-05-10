const mongoose = require("mongoose");
const ResponseCode = require("../../service/responseCode");
const MerchantCommission = require('../../Models/marchentCommission');
// const HtmlToPdf = require("../../service/pdfGenerator");
const fs = require("fs");
const { HtmlToPdf } = require("../../service/pdfGenerator");
const {  doPDFUpload } = require("../../service/s3")

const getInvoiceMarchent = async (req, res) => {
    console.log("req.user._id,", req.user._id)
    var currentDate = new Date(req.body.invoiceDate);
    var currentYear = currentDate.getFullYear();
    var currentMonth = currentDate.getMonth() + 1;
    await MerchantCommission.aggregate([
        {
            $match: {
                isDeleted: false,
                marchentID: req.user._id,
                $expr: {
                    $and: [
                        { $eq: [{ $year: '$bookingDateFormate' }, currentYear] },
                        { $eq: [{ $month: '$bookingDateFormate' }, currentMonth] },
                    ],
                },
            }
        }
    ])
        .then(async (data) => {
            console.log("data", data)
            // return false;
            var totalActivityAmount = data.reduce((acc, nxt) => acc + nxt.activityAmount, 0);
            var marchentCommissionAmount = data.reduce((acc, nxt) => acc + nxt.marchentCommissionAmount, 0);
            var adminAmount = data.reduce((acc, nxt) => acc + nxt.adminAmount, 0);

            const day = new Date();
            const m = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"];
            const str_op = currentDate.getDate() + ' ' + m[currentDate.getMonth()] + ' ' + currentDate.getFullYear();
            console.log(str_op);
            var lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
            const lastDayActual = lastDay.getDate() + ' ' + m[lastDay.getMonth()] + ' ' + lastDay.getFullYear();
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

            result += `<section style="width: 100%; height: 95vh;">
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
                                            style="margin-left: 20px; text-align: right; width: 72%; display: inline-block;">`+ str_op + `</span></p>
                                    <p style="font-size: 15px; font-weight: 500;">Receipt no.: <span
                                            style="margin-left: 20px; text-align: right; width: 74%; display: inline-block;">GIS-65606-01017834</span>
                                    </p>
                                </div>
                            </td>
                        </tr>
                        <tr style="width: 100%; ">
                            <td colspan="2">
                                <p style="color: black; font-weight: bold; margin: 0px;">Invoice for services delivered
                                    until:`+ lastDayActual + `</p>
                                <p style="text-align:end;color: black; font-weight: bold; margin: 0;">Amount (GBP) </p>
                            </td>
                        </tr>
    
                        <tr>
                            <td>
                                <p style="margin: 10px 0;">Service Commission (in accordance with attached detail)</p>
                            </td>
                            <td>
                                <p style="text-align:end; margin: 10px 0;">`+ adminAmount + `</p>
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
                                <p style="text-align: end; font-size: 16px; margin: 6px 0 0 0;">`+ totalActivityAmount + `</p>
                            </td>
                        </tr>
    
                        <tr>
                            <td>
                                <p style="font-size: 16px; margin: 6px 0 0 0;">./. our Commission</p>
                            </td>
                            <td>
                                <p style="text-align: end; font-size: 16px; margin: 6px 0 0 0;">`+ adminAmount + `</p>
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
                                <p style="color: black; font-weight: bold; text-align: end; margin: 0 0 15px 0;">`+ marchentCommissionAmount + `</p>
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
                result += `<tr>
                        <td style="text-align: center; font-size: 15px; padding-top: 15px;">`+ element.orderID + ` </td>
                        <td style="text-align: center; font-size: 15px; padding-top: 15px;">`+ element.bookingDate + `</td>
                        <td style="text-align: center; font-size: 15px; padding-top: 15px;">`+ element.activityAmount + `</td>
                        <td style="text-align: center; font-size: 15px; padding-top: 15px;">`+ element.marchentCommissionAmount + `</td>
                    </tr>`;

            }


            result += `</tbody>
                </table>
            </div>
        </section>`;


            let file = result;
            let path = "pdf/" + timestamp + ".pdf"
            // HtmlToPdf.generatePdf(file, path, options).then((pdfBuffer) => {
            //     // fs.writeFile("pdf/" + timestamp + ".pdf", pdfBuffer, function (err) {
            //     //     if (err) return console.log(err);
            //     return res.status(200).json({
            //         status: true,
            //         data: "http://34.249.210.102:8025/pdf/" + timestamp + ".pdf",
            //         // data: "http://127.0.0.1:8025/pdf/" + timestamp + ".pdf",
            //         message: "Pdf Created Successfully",

            //     });
            //     // });
            // });
      const pdfBuffer = await HtmlToPdf(file, options);
      console.log("pdf buffer file=== pdfBuffer", pdfBuffer);
      const uploadResult = await doPDFUpload(pdfBuffer, timestamp);

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
            console.log("error krishna ", error)
            res.status(ResponseCode.errorCode.serverError).json({
                status: false,
                message: "Server error, Please try again later",
                error: error
            })
        })

}

module.exports = {
    getInvoiceMarchent
}