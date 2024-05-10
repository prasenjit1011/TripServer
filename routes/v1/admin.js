const express = require('express');
const router = express.Router();
const multer = require('multer');
var storage = multer.memoryStorage()
var upload = multer({ storage: storage });


const SubAdminController = require('../../Controller/Admin/SubAdmin');
const MerchantController = require('../../Controller/Admin/Merchant');
const LanguageController = require('../../Controller/Admin/Language');
const BannerController = require('../../Controller/Admin/Banner');
const ActivityTypeController = require('../../Controller/Admin/ActivityType');
const CountryController = require('../../Controller/Admin/Country');
const SectionController = require('../../Controller/Admin/Section');
const ActivitySiteController = require('../../Controller/Admin/ActivitySite');
const cityController = require('../../Controller/Admin/city');
const aboutUsController = require('../../Controller/Admin/aboutUs')
const legalNoticeController = require('../../Controller/Admin/leagaNotice')
const TermsAndConditionController = require('../../Controller/Admin/termsConditions')
const privacyPolicyController = require("../../Controller/Admin/privacyPolicy")
const cookiesMarketingController = require("../../Controller/Admin/cookiesAndMarketingPrefarence")
const pressController = require("../../Controller/Admin/press")
const contactController = require("../../Controller/Admin/contact")
const careerController = require("../../Controller/Admin/career")
const blogController = require("../../Controller/Admin/blog")
const activityDetailsController = require("../../Controller/Admin/activityDetails")
const participentController = require("../../Controller/Admin/participent")
const giftController = require("../../Controller/Admin/gift")
const offerController = require("../../Controller/Admin/specialOffer")
const CategoryController = require("../../Controller/Admin/Category")
const tourModuleController = require("../../Controller/Admin/tourModule")
const infoDigitalServicesController = require("../../Controller/Admin/infoDigitalServices")
const siteMapsController = require("../../Controller/Admin/sitemaps")
const assignActivityController = require("../../Controller/Admin/assignActivity")
const FAQController = require("../../Controller/Admin/FAQ")
const AvailabilityController = require("../../Controller/Admin/availability")
const contactUserController = require("../../Controller/Admin/contactUser")
const contactMerchantController = require("../../Controller/Admin/contactMerchant")
const bookingDetailsController = require("../../Controller/Admin/bookingDetails")
const InvoiceController = require("../../Controller/Admin/invoice")
const ParticipantType = require("../../Controller/Admin/participantType")
const PaymentTagController = require("../../Controller/Admin/paymentTag")
const EmailManageController = require("../../Controller/Admin/email")
const GiftQuestionController = require('../../Controller/Admin/GiftQuestion')
const AdminTabController = require('../../Controller/Admin/AdminTab')
const CommissionPercentageController = require('../../Controller/Admin/CommissionPercentage')
const subMarchentController = require("../../Controller/marchent/subMarchent")

const reviewRatingController = require('../../Controller/Admin/reviewRating')

/** ================================= Admin tab section ================================= */
router.get('/view-admin-tab', AdminTabController.viewAdmintab);


/** ================================= CommissionPercentage section ================================= */
router.post('/add-commission-percentage', CommissionPercentageController.addCommissionPercentage);
router.put('/update-commission-percentage/:id', CommissionPercentageController.updateCommissionPercentage);
router.get('/view-commission-percentage-list', CommissionPercentageController.viewCommissionPercentageList);
router.get('/view-commission-percentage', CommissionPercentageController.viewCommissionPercentage);
router.get('/filter-marchent-list', CommissionPercentageController.marchentListWithoutCommission);
router.delete('/delete-commission-percentage/:id', CommissionPercentageController.deleteCommissionPercentage);
router.get('/view-merchants-list', CommissionPercentageController.viewMerchantslist);



// router.get('/view-admin-tab-subAd',AdminTabController.viewTabWithSubAdminAccess)
// router.get('/view-admin-tab-subadmin/:subadminId?', AdminTabController.viewSubAdminTab);

/** ================================= sub admin section ================================= */
router.post('/admin-add-subadmin', SubAdminController.adminRegisterSubAdmin);
router.get('/get-all-member-profile', SubAdminController.getAllMemberProfile);
router.put('/update-member-profile/:id', SubAdminController.updateMemberProfile);
router.get('/single-member-profile/:id', SubAdminController.singleMemberProfile);
router.post('/uploadSubImage', upload.single("image"), SubAdminController.subadminimage);
router.put('/deleteSubadminProfile/:id', SubAdminController.deleteSubadmin);
router.put('/setSubAdminActivityStatus/:id', SubAdminController.setSubAdminActivityStatus);
router.get('/subadmin-random-email', SubAdminController.randomEmail);


/** =================================merchant section ================================= */
router.post('/admin-add-merchant', MerchantController.adminRegisterMerchant);
router.get('/get-all-merchant-profile', MerchantController.getAllMemberProfile);
router.put('/update-merchant-profile/:id', MerchantController.updateMemberProfile);
router.get('/single-merchant-profile/:id', MerchantController.singleMemberProfile);
router.post('/uploadMerimage', upload.single("image"), MerchantController.merchantimage);
router.put('/deleteMarchent/:id', MerchantController.deleteMarchent);
router.put('/setMerchentActivityStatus/:id', MerchantController.setMerchentActivityStatus);
router.get('/viewApprovalCompanyReq', MerchantController.viewApprovalCompanyReq);
router.put('/updateApprovalCompanyReq/:id', MerchantController.updateApprovalCompanyReq);
router.get('/viewDraftMarchents', MerchantController.viewDraftMarchentProfile)
router.get('/upcoming-merchant-request', MerchantController.allUpcomingMerchantRequest)
router.put('/approval-merchant-status/:id', MerchantController.approvalOfMerchantstatus)
router.get('/view-marchents-payments', MerchantController.viewMarchentsPayments)
router.post('/add-payments', MerchantController.addPayments)


router.get('/merchant-random-email', MerchantController.randomEmail);





/** ================================= Language section ================================= */
router.post('/uploadlangImage', upload.single('image'), LanguageController.uploadlangImage);
router.post('/admin-add-language', LanguageController.addLanguage);
router.get('/view-all-language', LanguageController.viewAllLanguage);
router.put('/editLanguage/:id', LanguageController.editLanguage);
router.put('/deleteLanguage/:id', LanguageController.deleteLanguage);


/** ================================= Home page Banner section ================================= */
router.post('/add-banner', BannerController.addHomePageBanner);
router.post('/upload-bannerImage', upload.single('image'), BannerController.uploadbannerImage);
router.post('/upload-bannervideo', upload.single('video'), BannerController.bannerVdo);
router.get('/view-banner', BannerController.viewBanner);
router.put('/edit-banner/:id', BannerController.editBanner);
router.put('/delete-banner/:id', BannerController.deleteBanner)


/** ================================= section ================================= **/

router.post('/add-section', SectionController.addSection);
router.put('/edit-section/:id', SectionController.editSection);
router.get('/view-section', SectionController.viewSection);
router.put('/delete-section/:id', SectionController.deleteSection);


/** ================================= category section ================================= */

router.post('/add-category', CategoryController.addCategory);
router.put('/edit-category/:id', CategoryController.editCategory);
router.put('/delete-category/:id', CategoryController.deleteCategory);
router.get('/view-category', CategoryController.viewCategory);


/** ================================= activity site section ================================= */
router.post('/uploadActivitySiteImage', upload.single('image'), ActivitySiteController.activitySiteImg);
router.post('/addActivitySite', ActivitySiteController.addActivitySite);
router.put('/editActivitySite/:id', ActivitySiteController.editActivitySite);
router.put('/deleteActivitySite/:id', ActivitySiteController.deleteActivitySite);
router.get('/viewActivitySite', ActivitySiteController.viewActivitySite);
router.get('/viewSingleActivitySite/:id', ActivitySiteController.viewSingleActivitySite)



/** ================================= Activity type section ================================= */
router.post('/admin-add-activity-type', ActivityTypeController.addActivityType);
router.get('/admin-view-activity-type', ActivityTypeController.viewActivityType);
router.post('/activity-image-upload', upload.single('image'), ActivityTypeController.activityImg);
router.put('/edit-activity-type/:id', ActivityTypeController.editActivityType);
router.put('/delete-activity-type/:id', ActivityTypeController.deleteActivityType);

/** ================================= country section ================================= */
router.post('/countryImg', upload.single('image'), CountryController.countryImage);
router.post('/add-country', CountryController.addCountry);
router.get('/view-country', CountryController.viewCountry);
router.put('/editCountry/:id', CountryController.editCountry)
router.put('/deleteCountry/:id', CountryController.deleteCountry)

/** ================================= activity site section ================================= */
router.post('/cityImage', upload.single('image'), cityController.cityImage);
router.post('/addCity', cityController.addCity)
router.get('/viewCity', cityController.viewCity) //added by avi
router.put('/editCity/:id', cityController.editCity) //added by avi
router.put('/deleteCity/:id', cityController.deleteCity) //added by avi
router.get('/viewCountryAgainstCity/:countryId', cityController.viewCountryAgainstCity)
router.post('/view-zipcode', cityController.viewZipcode)
router.post('/add-zipcode', cityController.addZipcode)



/** ================================= AboutUs ================================= */
router.post('/aboutUsImage', upload.single("image"), aboutUsController.aboutUsimage);//added by avi
router.post('/addAboutUs', aboutUsController.addAboutUs);//added by avi
router.get('/viewAboutUs', aboutUsController.viewAboutUs) //added by avi
router.get('/singleAboutUs/:id', aboutUsController.singleAboutUs) //added by avi
router.put('/editAbouUs/:id', aboutUsController.editAboutUs) //added by avi
router.put('/deleteAboutUs/:id', aboutUsController.deleteAboutUs) //added by avi
router.get('/total-person-count', aboutUsController.personCountInDashboard)


/** ================================= LegalNotice  ================================= */
router.post('/addLegalNotice', legalNoticeController.addLegalNotice);//added by avi
router.get('/viewLegalNotice', legalNoticeController.viewLegalNotice) //added by avi
router.put('/editLegalNotice/:id', legalNoticeController.editlegalNotice) //added by avi


/** ================================= TermsAndCondition ================================= */
router.post('/addTermsCondition', TermsAndConditionController.addTermsConditions);//added by avi
router.get('/viewTermsCondition', TermsAndConditionController.viewTermsConditions) //added by avi
router.put('/editTermsCondition/:id', TermsAndConditionController.editTermsConditions) //added by avi
router.put('/deleteTermsCondition/:id', TermsAndConditionController.deleteTermsConditions) //added by avi

/** ================================= Privecy Policy ================================= */
router.post('/addPrivacyPolicy', privacyPolicyController.addPrivacy);//added by avi
router.get('/viewPrivacyPolicy', privacyPolicyController.viewPrivacyPolicy) //added by avi
router.put('/editPrivacyPolicy/:id', privacyPolicyController.editPrivacyPolicy) //added by avi
router.delete('/deletePrivacyPolicy/:id', privacyPolicyController.deletePrivacyPolicy) //added by avi

/** ================================= cookiesMarketingController ================================= */
router.post('/addCookiesMarketing', cookiesMarketingController.addCookiesPrefarence);//added by avi
router.get('/viewCookiesMarketing', cookiesMarketingController.viewCookiesPrefarence) //added by avi
router.put('/editCookiesMarketing/:id', cookiesMarketingController.editCookiesPrefarence) //added by avi
router.put('/deleteCookiesMarketing/:id', cookiesMarketingController.deleteCookiesPrefarence) //added by avi

/** ================================= Press ================================= */
router.post('/pressImage', upload.single("image"), pressController.pressImage);//added by avi
router.post('/addPress', pressController.addPress);//added by avi
router.get('/viewPress', pressController.viewPress) //added by avi
router.put('/editPress/:id', pressController.editPress) //added by avi
router.put('/deletePress/:id', pressController.deletePress) //added by avi

/** ================================= contact ================================= */
router.post('/addContact', contactController.addContact);//added by avi
router.get('/viewContact', contactController.viewConatact) //added by avi
router.put('/editContact/:id', contactController.editContact) //added by avi
router.put('/deleteContact/:id', contactController.deleteContact) //added by avi
router.get('/view-contact-issues', contactController.viewAllContactIssue)

/** ================================= career ================================= */
router.post('/careerImage', upload.single("image"), careerController.careerImage);//added by avi
router.post('/addCareer', careerController.addCareer);//added by avi
router.get('/viewCareer', careerController.viewCarrer) //added by avi
router.put('/editCareer/:id', careerController.editCareer) //added by avi
router.put('/deleteCareer/:id', careerController.deleteCareer) //added by avi

/** ================================= blog ================================= */
router.post('/blogImage', upload.single("image"), blogController.blogImage);
router.post('/addBlogCategory', blogController.addBlogCategory);
router.get('/viewBlogCategory', blogController.viewBlogCategory)
router.delete('/delete-blog-category/:id', blogController.deleteBlogCategory)

router.post('/addBlog', blogController.addBlog);
router.get('/viewBlog', blogController.viewBlog)
router.put('/editBlog/:id', blogController.editBlog)
router.delete('/deleteBlog/:id', blogController.deleteBlog)
router.post('/addtype', blogController.addType);
router.get('/viewtype', blogController.viewtype)
router.put('/edittype/:id', blogController.editType)
router.delete('/deleteType/:id', blogController.deleteType)

/** ================================= tourInfo ================================= */
router.post('/tourImage', upload.single("image"), activityDetailsController.activityDetailsImage)
router.post('/addActivityDetails', activityDetailsController.addActivityDetails)
router.put('/editActivityDetails/:id', activityDetailsController.editActivityDetails)
router.put('/deleteActivityDetails/:id', activityDetailsController.deleteActivityDetails)
router.put('/setActivityStatus/:id', activityDetailsController.setActivityStatus)

// router.get('/viewActivityDetails', activityDetailsController.viewActivityDetails)
router.get('/viewActivityDetails/:product_type?', activityDetailsController.viewActivityDetails);


router.get('/viewDraftActivityDetails', activityDetailsController.viewDraftActivityDetails)
router.get('/singleActivityDetails/:id', activityDetailsController.singleActivityDetails)
router.get('/singleDraftActivity/:id', activityDetailsController.singleDraftActivity)
router.get('/viewMerchantApprovalActivity', activityDetailsController.viewMerchantApprovalActivity)
router.put('/updateApprovalActivityReq/:id', activityDetailsController.updateApprovalActivityReq)

router.post('/add-destination', activityDetailsController.addDestination)   // post
router.put('/edit-destination/:id', activityDetailsController.editDestination) // put 
router.delete('/delete-destination/:id', activityDetailsController.delDestination) // delete
router.get('/view-destination-all', activityDetailsController.viewDestintionAll) // get all....
router.get('/view-destination/:siteId', activityDetailsController.viewDestintion) // get single...

router.get('/sitename-against-city/:cityid', activityDetailsController.siteNameAgainstCity)
router.post('/get-cale-data', activityDetailsController.calenderwiseAvailability)
router.get('/merchantActivityList/:merchantid', activityDetailsController.merchantActivityList)


/** ================================= participent ================================= */
router.post('/addParticipent', participentController.addParticipent);//added by avi
router.put('/editParticipent/:id', participentController.editParticipent);//added by avi
router.put('/deleteParticipent/:id', participentController.deleteParticipent);//added by avi
router.get('/viewParticipent', participentController.viewParticipent);//added by avi

/** ================================= gift ================================= */
router.post('/addGift', giftController.addGift);//added by avi
router.put('/editGift/:id', giftController.editGift);//added by avi
router.put('/deleteGift/:id', giftController.deleteGift);//added by avi
router.get('/viewGift', giftController.viewGift);//added by avi

/** ================================= special Offer ================================= */
router.post('/createSpecialOffer', offerController.createSpecialOffer);//added by avi
router.get('/singleSpecialOffer/:id', offerController.singleSpecialOffer);//added by avi
// router.get('/viewSpecialOffer', offerController.viewSpecialOffer);//added by avi
router.get('/viewSpecialOffer/:offer_type?', offerController.viewSpecialOffer);
router.put('/editSpecialOffer/:id', offerController.editSpecialOffer);//added by avi
router.put('/deleteSpecialOffer/:id', offerController.deleteSpecialOffer);//added by avi
router.get('/viewMerchantApprovalSpecialOffer', offerController.viewMerchantApprovalSpecialOffer);
router.put('/specialOffer-approval-status/:id', offerController.approvalOfSpecialOfferstatus);
/** ================================= TOUR MODULE ================================= */
router.post('/tourModuleImage', upload.single('image'), tourModuleController.tourModuleImage);
router.post('/addTourModule', tourModuleController.addTourModule);
router.get('/viewTourModule', tourModuleController.viewTourModule);
router.get('/view-all-tourModule/:id', tourModuleController.viewAllTourModule);
router.put('/editTourModule/:id', tourModuleController.editTourModule)
router.put('/deleteTourModule/:id', tourModuleController.deleteTourModule)

/** ================================= infoDigital ================================= */
router.post('/addInfoDigitalService', infoDigitalServicesController.addInfoDigitalService);//added by avi
router.put('/editInfoDigitalService/:id', infoDigitalServicesController.editInfoDigitalService);//added by avi
router.get('/viewInfoDigitalService', infoDigitalServicesController.viewInfoDigitalService);//added by avi

/** ================================= siteMap ================================= */
router.post('/addSitemap', siteMapsController.addSitemap);//added by avi
router.put('/editSitemap/:id', siteMapsController.editSitemap);//added by avi
router.put('/deleteSitemap/:id', siteMapsController.deleteSitemap);//added by avi
router.get('/viewSitemap', siteMapsController.viewSitemap);//added by avi

/** ================================= Assign Activity ================================= */
router.post('/addAssignAcitivity', assignActivityController.addAssignAcitivity);//added by avi
router.put('/editAssignAcitivity/:id', assignActivityController.editAssignAcitivity);//added by avi
router.put('/deleteAssignAcitivity/:id', assignActivityController.deleteAssignAcitivity);//added by avi
router.get('/viewAssignAcitivity', assignActivityController.viewAssignAcitivity);//added by avi


/** ================================= FAQ section ================================= */

router.post('/add-help-FAQ', FAQController.addHelpFAQ);
router.post('/add-type-FAQ', FAQController.addFAQType);
router.get('/view-FAQ', FAQController.viewFAQ);
router.get('/view-FAQ-Types', FAQController.viewFAQTypes);


router.put('/edit-FAQ/:id', FAQController.editFAQ);



router.put('/edit-FAQ/:id', FAQController.editFAQ);


/** ================================= contact user section ================================= */
router.post('/contactImage', upload.single("image"), contactUserController.contactImage)//added by avi

router.post('/createUserContactTopic', contactUserController.addContactUserTopic);
router.put('/editUserContactTopic/:id', contactUserController.editContactUserTopic);
router.get('/viewUserContactTopic', contactUserController.viewConatactTopic);
router.put('/deleteContactUserTopic/:id', contactUserController.deleteContactUserTopic);

router.post('/createUserContactQuestion', contactUserController.addContactUserQuestion);
router.put('/editContactUserQuestion/:id', contactUserController.editContactUserQuestion);
router.get('/viewContactUserQuestion', contactUserController.viewContactUserQuestion);
router.put('/deleteContactUserQuestion/:id', contactUserController.deleteContactUserQuestion);
// router.get('/search-contact-question/:question', contactUserController.searchContactQuestion)

router.post('/createContactUserAnswer', contactUserController.addContactUserAnswer);
router.put('/editContactUserAnswer/:id', contactUserController.editContactUserAnswer);
router.get('/viewContactUserAnswer', contactUserController.viewContactUserAnswer);
router.put('/deleteContactUserAnswer/:id', contactUserController.deleteContactUserAnswer);


/** ================================= contact Merchant section ================================= */
router.post('/contactImage', upload.single("image"), contactUserController.contactImage)

router.post('/createContactMerchantTopic', contactMerchantController.addContactMerchantTopic);
router.put('/editContactMerchantTopic/:id', contactMerchantController.editContactMerchantTopic);
router.get('/viewContactMerchantTopic', contactMerchantController.viewContactMerchantTopic);
router.put('/deleteContactMerchantTopic/:id', contactMerchantController.deleteContactMerchantTopic);

router.post('/createMerchentContactQuestion', contactMerchantController.addContactMerchentQuestion);
router.put('/editMerchentContactQuestion/:id', contactMerchantController.editContactMerchentQuestion);
router.get('/viewMerchentContactQuestion', contactMerchantController.viewContactMerchentQuestion);
router.put('/deleteMerchentContactQuestion/:id', contactMerchantController.deleteContactMerchentQuestion);

router.post('/createContactMerchentSubQuestion', contactMerchantController.addContactMerchentSubQuestion);
router.put('/editContactMerchentSubQuestion/:id', contactMerchantController.editContactMerchentSubQuestion);
router.get('/viewContactMerchentSubQuestion', contactMerchantController.viewContactMerchentSubQuestion);
router.put('/deleteContactMerchentSubQuestion/:id', contactMerchantController.deleteContactMerchentSubQuestion);


/** ================================= Avavilability ================================= */
router.post('/add-availability', AvailabilityController.addAvailability);
router.put('/edit-availability/:id', AvailabilityController.editAvailability);
router.post('/view-availability', AvailabilityController.viewAvalability);
router.post('/view-monthwise-availability', AvailabilityController.viewMonthwiseAvailability);
router.delete('/delete-availability/:id', AvailabilityController.deleteAvailability);
router.delete('/delete-availability-single/:id', AvailabilityController.deleteSingleAvailability);// availabilityModel
router.put('/date-wise-delete/:id', AvailabilityController.deleteAvailabilityDatewise)



/** ================================ Booking Details ============================= */
router.post('/view-booking-details', bookingDetailsController.bookingView)
router.get('/generate-payment/:orderid/:merchantid', bookingDetailsController.generateBillngPdf)
router.get("/view-booking-ticket/:orderid/:activityid", bookingDetailsController.viewBookingTicket)



/** ================================ Invoice ============================= */
router.post('/get-merchant-invoice', InvoiceController.getMarchentInvoice)
router.get('/generate-billng-pdf/:id', InvoiceController.generateBillngPdf)
router.post('/marchant-finance-details', InvoiceController.marchantFinanceBookingDetails)
router.get('/billing-history/:id', InvoiceController.viewBillingHistory)


/**======================= Participant Type =============================== */
router.post('/add-participant-type', ParticipantType.addParticipantType)
router.get('/view-participant-type', ParticipantType.viewParticipantType)
router.put('/update-participant-type/:id', ParticipantType.editParticipantType)
router.delete('/delete-participant-type/:id', ParticipantType.deleteParticipantType)


/**========================= Payment Tag ============================== */
router.post('/add-payment-tag', PaymentTagController.addPayementTag)
router.get('/get-payment-tag', PaymentTagController.getPaymentTag)
router.put('/update-payment-tag/:id', PaymentTagController.editPaymentTag)
router.put('/delete-payment-tag/:id', PaymentTagController.deletePaymentTag)

router.post('/manage-email', EmailManageController.manageEmail)
router.delete('/delete-email', EmailManageController.deleteEmail)
router.get('/get-email', EmailManageController.getEmail)

/**========================= GiftQuestion ============================== */
router.post('/add-gift-question', GiftQuestionController.addGiftQuestion)
router.get('/view-gift-question', GiftQuestionController.viewGiftQuestion)
router.put('/update-gift-question/:id', GiftQuestionController.updateGiftQuestion)
router.delete('/delete-gift-question/:id', GiftQuestionController.deleteGiftQuestion)




/**========================= review rating ============================== */

router.get('/view-review-rating', reviewRatingController.viewReviewRating)


/********************* */
router.post('/checkEmail', SubAdminController.checkEmail);
router.get('/viewSubMarchentList/:merchantid', subMarchentController.viewSubMarchentList);


module.exports = router


