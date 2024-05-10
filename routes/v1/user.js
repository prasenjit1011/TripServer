const express = require('express');
const router = express.Router();
const multer = require('multer');
var storage = multer.memoryStorage()
var upload = multer({ storage: storage });


// const activityDetailsController=require("../../Controller/user/activityDetails")
const rrController = require("../../Controller/user/reviewRating")
const wishlistController = require("../../Controller/user/wishlist")
const bookingController = require("../../Controller/user/userBooking")
const userController = require("../../Controller/Auth/User")
const contactqController = require("../../Controller/user/contact")
const cartController = require('../../Controller/user/cart')
const giftCardController = require('../../Controller/user/giftCard')
const availabilityController = require('../../Controller/user/availiability')
const activityDetailsController = require('../../Controller/user/activityDetails')
const TourModuleController = require('../../Controller/user/tourModule')
const aboutUsController = require('../../Controller/user/aboutUs')
const blogsController = require('../../Controller/user/blogs')
const marchentController = require('../../Controller/user/marchent')
const CreateMarchentsController = require('../../Controller/user/CreateMarchent')
const GiftQuestionController = require('../../Controller/user/GiftQuestion')
const AdminTabController = require('../../Controller/user/AdminTab')
const MarchentDashboardTabController = require('../../Controller/user/MarchentDashboardTab')
const PressController = require('../../Controller/user/press')





// const activityTypeController=require("../../Controller/user/activityType")

router.get("/getProfile", userController.userGetProfile)

router.put("/updateProfile", userController.update)
router.put("/update-password", userController.passwordChange)
// router.get("/view-all-currency", userController.viewAllCurency)
router.get("/review-notification", userController.ReviewNotification)
router.get("/view-notification", userController.viewNotification)


// /** ================================= AdminTab ================================= */
router.post("/add-admin-tab", AdminTabController.addAdminTab)



// /** ================================= Presss ================================= */
router.get("/user-view-press", PressController.viewPress)



// /** ================================= Marchent Dashboard tab ================================= */
router.post("/add-marchent-dashboard-tab", MarchentDashboardTabController.addMarchentDashboardTab)

// /** ================================= tourInfo ================================= */

// router.post("/home-page",rrController.addReviewRating)

router.post("/addReviewRating", rrController.addReviewRating)
router.post("/checkreview", rrController.checkReviewRating)

router.put("/editReviewRating/:id", rrController.editReviewRating)
router.put("/deleteReviewRating/:id", rrController.deleteReviewRating)
router.get('/monthwise-rating', rrController.viewMonthWiseRating)


/** ================================= wishlist ================================= */
router.post("/add-To-Wishlist", wishlistController.addToWishlist)
router.get("/view-folder-Wishlist/:fid", wishlistController.SingleFolderWishlist)
router.get("/view-your-Wishlist", wishlistController.viewYourWishlist)
router.post("/add-folder", wishlistController.addFolder)
router.get("/view-folder", wishlistController.viewAllFolder)
router.delete("/delete-folder/:id", wishlistController.deleteFolder)
router.delete("/delete-from-wishlist/:id", wishlistController.deleteWishListActivity)
router.get("/past-wishlist", wishlistController.viewAllPastWishlist)



//**--------------------------------- Cart -------------------------------------- */
router.post('/add-cart', cartController.addCart)
router.get('/get-cart', cartController.getCart)
router.get('/get-received-giftcart', cartController.receivedGiftCart)
router.put('/update-cart/:id', cartController.updateCart)
router.delete('/delete-cart/:id', cartController.deleteCart)
router.put('/add-card-to-cart', cartController.addCardToCart)


//--------------------------------- Gift Card add ---------------------------//
router.post('/add-gift-card', giftCardController.giftAdd)
router.post('/send-gift-card', giftCardController.sendGiftCardToEmail)
router.post('/send-activity-gift-card', giftCardController.sendActivityGiftCardToEmail)
router.delete('/delete-gift-card/:id', giftCardController.deleteGiftCard)
router.get('/view-gift-card', giftCardController.viewCardHistory)
// router.get('/view-gift', giftCardController.viewGift)

// router.get('/view-all-gift-card', giftCardController.viewGiftCardList)



// //--------------------------------- availability ---------------------------//
// router.post('/view-all-slottime', availabilityController.showAllTimeBydate)
// router.post('/check-availability', availabilityController.checkAvailability)



/*====================================booking=================================== */
router.post("/createBooking", bookingController.addBooking)
router.post("/before-Booking-Check", bookingController.beforeBookingCheck)
router.put("/deleteBooking/:id", bookingController.deleteBooking)
router.get("/view-all-booking", bookingController.viewAllBookingHistory)
router.get("/view-purchased-giftcard/:orderId", bookingController.viewPurchasedGiftCard)
router.get("/view-upcoming-booking", bookingController.viewAllUpcomingBooking)
router.get("/view-previous-booking", bookingController.viewAllpreviousBooking)
router.get("/view-booking-ticket/:orderid/:activityid", bookingController.viewBookingTicket)
router.get("/booking-notcomplete-notification", bookingController.userBookingNotCompleteNotification)



/**=================================== About US ======================================== */
// router.get('/about-us', aboutUsController.aboutUs)
// router.get('/legal-notice', aboutUsController.viewLegalNotice)
// router.get('/view-terms-condition', aboutUsController.viewTermsConditions)
// router.get('/view-privacy-policy', aboutUsController.viewPrivacyPolicy)






/*=================================contact============= */
router.get('/viewContactQuestion', contactqController.viewContactQuestion)
// router.get('/viewTopic', contactqController.viewTopic)
router.post('/uploadFiles', upload.single('image'), contactqController.uploadFiles)
router.post('/add-issue', contactqController.addissue)


router.get('/single-activity-details/:id/:slug/:page', activityDetailsController.singleActivityDetailsUser)
router.get('/user/singleActivityDetails/:id/:slug/:page', activityDetailsController.singleActivityDetails)
// router.post('/home-page-search', activityDetailsController.HomePageSearch)
// router.post('/search-list', activityDetailsController.searchList)

router.get('/recommended-activity', activityDetailsController.recommendedActivity)
router.post('/get-all-review', activityDetailsController.reviewRating)
router.post('/view-activity-wise-city-data', activityDetailsController.viewActivityWiseCityData)




/*=================================tour module============= */
// router.get('/view-all-tourModule', TourModuleController.viewAllTourModule)
router.get('/view-all-tour-activity/:cityId/:tourId', TourModuleController.viewAllActivityTour)

/*=================================blogs============= */
// router.get('/view-blog-category/:id', blogsController.viewBlogCategory)
// router.get('/view-type', blogsController.viewtype)

router.get('/view-single-blog/:id', blogsController.viewSingleBlog)
// router.get('/get-single-marchent/:id', marchentController.singleMemberProfile)

/*=================================Create Marchents============= */
router.post("/create-marchants", CreateMarchentsController.addcreateMarchents)
router.get("/view-create-marchants", CreateMarchentsController.ViewCreateMarchents)

/*=================================GiftQuestion============= */
router.get("/user-view-gift-question", GiftQuestionController.viewGiftQuestion)


module.exports = router