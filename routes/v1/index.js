var express = require('express');
var router = express.Router();
var path = require('path');
const multer = require('multer');


const AdminController = require('../../Controller/Auth/Admin');
const SubAdminController = require('../../Controller/Auth/SubAdmin');
const MerchantController = require('../../Controller/Auth/Merchant');
const userAuthController = require('../../Controller/Auth/User')
const subMerchentController = require("../../Controller/marchent/subMarchent")
const blogsController = require('../../Controller/user/blogs')





var multistorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/user");
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + Date.now() + file.originalname);
  },
});
var uploadmulti = multer({ storage: multistorage });
var storage = multer.memoryStorage()
var upload = multer({ storage: storage });

/* GET home page. */
// router.get('/', function (req, res, next) {
//   res.render('index', { title: 'Express' });
// });


const limitsMulter = {
  files: 1, // allow only 1 file per request
  fileSize: 9000 * 1024 * 1024, // (replace MBs allowed with your desires)
};
const uploadNew = multer({
  // storage: storage,
  dest: path.resolve('./malter'),
  limits: limitsMulter,
});




const middleware = require('../../service/middleware').middleware;
const activityDetailsController = require("../../Controller/user/activityDetails")
const rrController = require("../../Controller/user/reviewRating")
const activityTypeController = require("../../Controller/user/activityType")
const bannerController = require("../../Controller/user/banner")
const countryController = require("../../Controller/user/country")
const languageController = require("../../Controller/user/language")
const activitySitesController = require("../../Controller/user/activitySites")
const cityController = require("../../Controller/user/cities")
const subMarchentController = require("../../Controller/marchent/subMarchent")
const bookingController = require("../../Controller/user/availiability")
const companyController = require("../../Controller/user/company")
const tourController = require("../../Controller/Admin/tour")
const availabilityController = require('../../Controller/user/availiability')
const cookiesController = require('../../Controller/Admin/cookiesAndMarketingPrefarence')
const userActivitySiteController = require('../../Controller/user/activitySites')
const UserTourModuleController = require('../../Controller/user/tourModule')
const AdmincityController = require('../../Controller/Admin/city');

const AdminActivityDetailsController = require('../../Controller/Admin/activityDetails');

const AvailabilityController = require("../../Controller/Admin/availability")
const aboutUsController = require('../../Controller/user/aboutUs')
const contactUsController = require('../../Controller/user/contact')
const siteMapsController = require('../../Controller/Admin/sitemaps')
const infoDigitalServiceController = require('../../Controller/Admin/infoDigitalServices')


const contactUserController = require("../../Controller/Admin/contactUser")
const contactqController = require("../../Controller/user/contact")
const marchentController = require('../../Controller/user/marchent')
const deviceRegistrationController  = require('../../Controller/user/deviceRegistration');
const giftCardController = require('../../Controller/user/giftCard')





router.get("/tour", tourController.tourSearch)

/*=================================company========================= */

router.get('/user/viewCompany/:id', companyController.viewCompany)



/** ================================= tourInfo ================================= */

router.get('/user/singleActivityDetails/:id/:slug/:page', activityDetailsController.singleActivityDetails)//added by avi
router.get('/user/viewActivityDetails/:activityTypeId', activityDetailsController.viewActivityDetails)//added by avi
router.post('/user/cityAgainstAcityvity/:cityId/:tourid/:activityType', activityDetailsController.cityAgainstActivity)//added by avi
router.post('/user/sitesAgainstActivity/:activitySiteId/:activityTypeId', activityDetailsController.sitesAgainstActivity)
router.post('/user/sitesAgainstActivity1/:activitySiteId/:activityTypeId', activityDetailsController.sitesAgainstActivity1)

router.post('/user/filter-sitesAgainstActivity/:activitySiteId/:activityTypeId', activityDetailsController.filterSitesAgainstActivity)
router.post('/user/filter-cityAgainstActivity/:cityId/:activityTypeId', activityDetailsController.filterCityAgainstActivity)
router.post('/user/home-page-search', activityDetailsController.HomePageSearch)
router.post('/user/home-page-search-with-date', activityDetailsController.HomePageSearchwithDate)
router.post('/user/view-monthwise-availability', AvailabilityController.viewMonthwiseAvailability);
router.post('/user/calender-monthwise-availability', userAuthController.calenderwiseAvailability);
router.post('/user/get-all-review', activityDetailsController.reviewRating)

router.post('/user/search-list', activityDetailsController.searchList)

router.get('/user/view-all-category', activityDetailsController.allCategory)
router.get('/user/view-all-destination', activityDetailsController.allDestination)
router.get('/admin/marchant-invoice', AdminActivityDetailsController.marchantInvoice )


//view cookies
router.get('/user/view-all-cookies', cookiesController.viewCookiesPrefarence)

/** ================================= activity Type ================================= */

router.get('/user/viewActivityType', activityTypeController.viewActivityType)//added by avi
router.get('/user/view-activity-typewisee/:id', activityTypeController.viewActivityTypeWise)
router.get('/user/view-activity-citywise/:id', activityTypeController.viewActivityCityWise)
router.get('/user/view-activity-sitewise/:id', activityTypeController.viewActivitySiteWise)
router.get('/user/view-activity-typewisee-new/:id', activityTypeController.viewActivityTypeWiseNew)
/** ================================= Banner ================================= */

router.get('/user/viewBanner/:activityTypeId', bannerController.viewBanner)//added by avi

/** ================================= country ================================= */

router.get('/user/viewCountry', countryController.viewCountry)
/** ================================= tour module for user ================================= */

router.get('/user/view-all-tourModule/:id', UserTourModuleController.viewAllTourModule)

/** ================================= contact us user ================================= */

router.post('/user/contactus-issue', contactUsController.contactUsissue)


/** ================================= languageController ================================= */

router.get('/user/viewAllLanguage', languageController.viewAllLanguage)//added by avi

/** ================================= ActivitySites Controller ================================= */

router.get('/user/viewSingleActivitySite/:id', activitySitesController.viewSingleActivitySite)
router.get('/user/all-activity-site', activitySitesController.topActivityCites)

/** ================================= city Controller ================================= */

router.get('/user/viewSingleCity/:id', cityController.viewSingleCity)
router.get('/user/view-all-city', cityController.viewAllCity)
router.get('/user/popular-activity/:id', cityController.mostPopularActivityAgaintCity)
router.post('/user/view-zipcode', AdmincityController.viewZipcode)
router.post('/user/add-zipcode', AdmincityController.addZipcode)


router.get('/user/get-destinations', cityController.allCities)
router.get('/user/city-against-country/:countryId', cityController.viewCityAgainstCountry)


/** ================================= availiability Controller ================================= */

router.post('/user/view-availability', bookingController.viewAvalability)

/** ---------------------- Privacy Policy ----------------------- */
router.get('/user/view-privacy-policy', aboutUsController.viewPrivacyPolicy)
router.get('/user/legal-notice', aboutUsController.viewLegalNotice)
router.get('/user/view-terms-condition', aboutUsController.viewTermsConditions)
router.get('/user/about-us', aboutUsController.aboutUs)

router.get('/user/search-contact-question/:question', contactUserController.searchContactQuestion)
/**----------------------- Site Map ----------------------- */
router.get('/user/view-sitemap', userActivitySiteController.viewSitemap)



/**-------------------- Information ----------------------- */
router.get('/user/view-info-digital-service', infoDigitalServiceController.viewInfoDigitalService)

/** ================================= start without token ================================= */

router.post('/admin/register', AdminController.register);


router.post('/admin/uploadimage', upload.single("image"), AdminController.adminImageUpload);
router.post('/admin/login', AdminController.login);
router.post('/subadmin/login', SubAdminController.login);
router.post('/merchant/registration', MerchantController.selfRegistration);
router.post('/merchant/login', MerchantController.login);

/** ================================= user without token ================================= */
router.post('/user/register', userAuthController.register)
router.post('/user/registerWithGoogle', userAuthController.registerWithGoogle);
router.post('/user/login', userAuthController.login)
router.post('/user/loginWithGoogle', userAuthController.loginWithGoogle)
router.get("/user/view-all-currency", userAuthController.viewAllCurency)


router.post('/user/otp-send-to-email', userAuthController.sendOtpToExistingEmail)
router.put('/user/change-password-without-token', userAuthController.passwordChangeWithoutToken)


//--------------------------------- availability ---------------------------//
router.post('/user/view-all-slottime', availabilityController. showAllTimeBydateTest)
router.post('/user/view-all-slottime-test', availabilityController.showAllTimeBydate)
router.post('/user/check-availability', availabilityController.checkAvailability)



/** ================================= user without token ================================= */
router.post('/subMarchent/login', subMarchentController.subMarchentLogin)

/** ================================= end  without token ================================= */

/*=================================contact============= */
router.get('/user/viewTopic', contactqController.viewTopic)

/*=================================blogs============= */
router.get('/user/get-single-marchent/:id', marchentController.singleMemberProfile)

/*=================================device Registration ============= */
router.post('/user/add-device-registration', deviceRegistrationController.deviceRegistrationAlert);
router.get('/user/delete-device-registration/:deviceId', deviceRegistrationController.deleteDeviceRegistration);

//--------------------------------- Gift Card add ---------------------------//

router.get('/user/view-gift', giftCardController.viewGift)

//======blog category api without token===//
router.get('/user/view-blog-category/:id', blogsController.viewBlogCategory)
router.get('/user/view-type', blogsController.viewtype)




const AdminRoute = require('./admin')
const SubadminRoute = require('./subadmin')
const Marchent = require('./marchent')
const User = require('./user')
const subMarchent = require('./submarchent');



router.use(middleware); // ========> auth setup 


/** ================================= Admin section with token ================================ */
router.post('/admin/update', AdminController.update);
router.put('/admin/change-password', AdminController.passwordChange);
router.post('/admin/updateImage', upload.single("image"), AdminController.adminImageUpload);
router.post('/admin/upload-base-image', upload.single("image"), AdminController.adminImageUploadBase64);

router.get('/admin/get-profile', AdminController.getProfile)
router.get('/user/view-activity-typewisee-with-token/:id', activityTypeController.viewActivityTypeWiseWithToken)
router.post('/user/home-page-search-token', activityDetailsController.HomePageSearchAuth)


router.use('/admin', AdminRoute);


// /** ================================= SubAdmin section with token ================================ */

router.post('/subadmin/update-profile', SubAdminController.updateProfile);
router.put('/subadmin/change-password', SubAdminController.passwordChange);
router.post('/subadmin/upload-image', upload.single("image"), SubAdminController.subAdminImageUpload);
router.get('/subadmin/get-profile', SubAdminController.getProfile);
router.use('/subadmin', SubadminRoute)



// /** ================================= Merchant section with token ================================ */

router.post('/merchant/update-profile', MerchantController.updateProfile);
router.put('/merchant/change-password', MerchantController.passwordChange);
router.post('/merchant/upload-image', upload.single("image"), MerchantController.merchantImageUpload);
router.get('/merchant/get-profile', MerchantController.getProfile);
router.post('/merchant/add-company-details', MerchantController.addCompanyDetails);  ///////////////////////////

router.use('/merchant', SubadminRoute)
router.use('/user', User)
router.use('/merchant', Marchent)
router.use('/submerchant', subMarchent)

module.exports = router;

//http://34.249.210.102:8025/api/v1/user/cityAgainstAcityvity/64a7e4b0535c434558d6234b/64e33572a6f3278a0102484e/64d3a05d05edf815fbfb46a5
//totalReview,reviewRating,description
//http://34.249.210.102:8025/api/v1/user/filter-cityAgainstActivity/64a7e4b0535c434558d6234b/64d3a05d05edf815fbfb46a5
//