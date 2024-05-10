const express = require('express');
const router = express.Router();
const multer = require('multer');
var storage = multer.memoryStorage()
var upload = multer({ storage: storage });

const offerController = require('../../Controller/marchent/specialOffer');
const activityDetailsController = require("../../Controller/marchent/activityDetails")
const FAQController = require("../../Controller/marchent/FAQ")
const subMarchentController = require("../../Controller/marchent/subMarchent")
const AvailabilityController = require("../../Controller/marchent/availability")
const companyController = require("../../Controller/marchent/company")
const BookingController = require("../../Controller/marchent/bookingDetails")
const InvoiceController = require('../../Controller/marchent/invoice')
const activityDetailsControllerAdmin = require("../../Controller/Admin/activityDetails")
const tourModuleController = require("../../Controller/Admin/tourModule")
const ParticipantType = require("../../Controller/Admin/participantType")
const paymentTagController = require("./../../Controller/marchent/paymentTag")
const MarchentsDashboardTabController = require("./../../Controller/marchent/MarchentDashboardTab")
const reviewRatingController = require("./../../Controller/marchent/reviewRating")
const CommissionPercentageController = require('../../Controller/marchent/CommissionPercentage')
const NotificationController = require('../../Controller/marchent/notification')



// tourModuleController

/*========================================Marchent Dashboard tab==================== */
router.get("/view-marchent-dashboard-tab", MarchentsDashboardTabController.viewMarchentDashboardTab)


/*========================================Marchent Notification==================== */
router.get("/view-notification", NotificationController.marchentsViewNotification)

/*========================================CommisssionPercentage==================== */
// router.get("/listof-payouts", CommissionPercentageController.listOfPayouts)


/*========================================SubMarchent==================== */
router.post('/marchantImage', upload.single("image"), subMarchentController.marchentImage)
router.post("/subMarchentRegister", subMarchentController.marchentAddSubMar)
router.put('/subMarchentStatus/:id', subMarchentController.subMarchentStatus)
router.put('/updateProfile/:id', subMarchentController.updateProfile)
router.put('/deleteSubMarchent/:id', subMarchentController.deleteSubMarchent)
router.get('/viewSubMarchent', subMarchentController.viewSubMarchent);
router.post('/get-invoice', InvoiceController.getInvoiceMarchent)


/*========================================SubMarchent==================== */

const contactqController = require("../../Controller/marchent/contactQ")


router.post('/createSpecialOffer', offerController.createSpecialOffer);//added by avi
router.get('/singleSpecialOffer/:id', offerController.singleSpecialOffer);//added by avi
router.get('/viewSpecialOffer/:offer_type?', offerController.viewSpecialOffer);//added by avi
router.put('/editSpecialOffer/:id', offerController.editSpecialOffer);//added by avi
router.put('/deleteSpecialOffer/:id', offerController.deleteSpecialOffer);//added by avi

// router.put('/offerAginstActivity/:specialOfferId', offerController.offerAginstActivity)//added by avi

/** ================================= tourInfo ================================= */
router.post('/tourImage', upload.single("image"), activityDetailsController.activityDetailsImage)//added by avi
router.post('/addActivityDetails', activityDetailsController.addActivityDetails)//added by avi
router.put('/editActivityDetails/:id', activityDetailsController.editActivityDetails)//added by avi
// router.put('/editAvailability/:id', activityDetailsController.editAvailability)

router.put('/deleteActivityDetails/:id', activityDetailsController.deleteActivityDetails)//added by avi
router.put('/setActivityStatus/:id', activityDetailsController.setActivityStatus)//added by avi
router.get('/singleActivityDetails/:id', activityDetailsController.singleActivityDetails)//added by avi
router.get('/viewDraftActivityDetails', activityDetailsController.viewDraftActivityDetails)
router.get('/viewActivityDetails/:product_type?', activityDetailsController.viewActivityDetails)//added by avi
router.get('/singleDraftActivity/:id', activityDetailsController.singleDraftActivity)//added by avi
router.get('/sitename-against-city/:cityid', activityDetailsControllerAdmin.siteNameAgainstCity)
router.get('/view-destination/:siteId', activityDetailsControllerAdmin.viewDestintion)


/** ================================= FAQ ================================= */
router.get('/view-FAQ', FAQController.viewFAQ)


/** ================================= contact question ================================= */
router.get('/viewContactQuestion', contactqController.viewContactQuestion)
router.get('/viewTopic', contactqController.viewTopic)
router.post('/uploadFiles', upload.single('image'), contactqController.uploadFiles)
router.post('/add-issue', contactqController.addissue)


/** ================================= Avavilability ================================= */
router.post('/add-availability', AvailabilityController.addAvailability);
router.put('/edit-availability/:id', AvailabilityController.editAvailability);
router.post('/view-availability', AvailabilityController.viewAvalability);
router.post('/view-monthwise-availability', AvailabilityController.viewMonthwiseAvailability);
router.put('/date-wise-delete/:id', AvailabilityController.deleteAvailabilityDatewise);




/*=====================================Company============================= */
router.post('/uploadCompany', upload.single('image'), companyController.companyImageUpload)
router.post('/editCompany', companyController.editCompany);
router.get('/viewCompany', companyController.viewCompany);

/*=====================================Booking============================= */
router.post('/view-booking-details', BookingController.viewBookingDetails);
// router.get('/finance-booking-details', BookingController.financeBookingDetails);
router.get('/listof-payouts', BookingController.financeBookingDetails);
router.get("/generate-billing-pdf/:orderid", BookingController.generateBillngPdf)
router.get("/billing-history", BookingController.viewBillingHistory)
router.put("/deleteBooking/:id",BookingController.deleteBooking)
router.get("/count-booking-in-dashboard",BookingController.bookingCountInDashboard)

router.get('/view-all-tourModule/:id', tourModuleController.viewAllTourModule);

/*=====================================participent============================= */

router.get('/view-participant-type', ParticipantType.viewParticipantType)

/*=================payment tag======================== */
router.get('/get-payment-tag', paymentTagController.getPaymentTag)

/**========================= review rating ============================== */

router.get('/view-review-rating', reviewRatingController.viewReviewRating)

module.exports = router