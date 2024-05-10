const mongoose = require("mongoose");
const AdminTabSchema = new mongoose.Schema({
  adminName: {
    type: String,
  },
  marchentName: {
    type: String,
  },
  categoryName: {
    type: String,
  },
  activityTypeName: {
    type: String,
  },

  sectionName: {
    type: String,
  },

  countryName: {
    type: String,
  },
  languageName: {
    type: String,
  },
  cityName: {
    type: String,
  },
  activitySiteName: {
    type: String,
  },
  tourModuleName: {
    type: String,
  },
  participantTypeNAme: {
    type: String,
  },
  activitiesName: {
    type: String,
  },
  activityAvailabilityName: {
    type: String,
  },
  activityBookingName: {
    type: String,
  },
  bannerName: {
    type: String,
  },
  pressName: {
    type: String,
  },
  blogName: {
    type: String,
  },
  aboutName: {
    type: String,
  },
//   aboutUsName: {
//     type: String,
//   },
  legalNotice: {
    type: String,
  },
  privacyPolicy: {
    type: String,
  },
  cookiesMarketing: {
    type: String,
  },
  contactName: {
    type: String,
  },
  offerName: {
    type: String,
  },
  termsAndCondition: {
    type: String,
  },
  digitalServiceInformationName: {
    type: String,
  },
  sitemapName: {
    type: String,
  },
  faqName: {
    type: String,
  },
  giftName: {
    type: String,
  },
  merchantChatName: {
    type: String,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  status: {
    type: Boolean,
    default: true,
  },
  createdOn: {
    type: Date,
    default: new Date(),
  },
  updatedOn: {
    type: Date,
  },
});

module.exports = mongoose.model("admintab", AdminTabSchema);
