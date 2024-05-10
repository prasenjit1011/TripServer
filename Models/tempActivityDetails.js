var mongoose = require("mongoose");
const { shuffleString } = require("random-string-alphanumeric-generator/utils");

const tempActivityDetailsSchema = new mongoose.Schema({
  activityDetailsId: {
    type: mongoose.Types.ObjectId,
  },
  addedByid: {
    type: mongoose.Types.ObjectId,
  },
  cityId: {
    type: mongoose.Types.ObjectId,
  },
  activitySiteId: {
    type: mongoose.Types.ObjectId,
    // type: String
    require: false
  },
  activityTypesId: {
    type: mongoose.Types.ObjectId,
  },
  categoryId: {
    type: mongoose.Types.ObjectId,
  },
  remarks: {
    type: String,
  },
  rejectedStatus: {
    type: Boolean,
    default: false,
  },
  countryId: {
    type: mongoose.Types.ObjectId,
  },
  languageId: {
    type: mongoose.Types.ObjectId,
  },
  tourModuleId: {
    type: mongoose.Types.ObjectId,
  },
  specialOfferId: {
    type: mongoose.Types.ObjectId,
    default: null,
  },
  slug: {
    type: String,
  },
  productCode: {
    type: String,
  },
  tourPreferredLanguage: {
    type: Array,
  },
  referenceCode: {
    type: String,
  },
  activityTitle: {
    type: String,
  },
  destination: {
    type: mongoose.Types.ObjectId,
  },
  description: {
    type: String,
  },
  image: {
    type: Array,
  },
  activityActualPrice: {
    type: Number,
  },
  activityDiscountPrice: {
    type: Number,
  },
  likelyToSellOut: {
    type: Boolean,
    default: false
  },

  tourDuration: {
    value: {
      type: Number,
      // required: true
    },
    unit: {
      type: String,
      enum: ["hours", "days", "minutes"],
      // required: true
    },
  },

  duration: {
    type: String,
  },

  tourActivity: {
    type: [
      {
        term: String,
        description: String,
        svg: String,
      },
    ],
    // require: true,
  },
  tourPerson: {
    type: Number,
  },

  meetingPoint: {
    type: [
      {
        desc: String,
        link: String,
      },
    ],
  },
  information: {
    type: [
      {
        title: String,
        desc: [],
      },
    ],
  },

  importentInfo: {
    type: [
      {
        title: String,
        description: [],
      },
    ],
  },

  activityCoordinates: {
    type: [
      {
        location: String,
        lat: Number,
        lng: Number,
        entryType: String  // entryTicketIncluded , entryTicketNotIncluded , outsideOnly
      },
    ],
    // require: true,
  },
  participentType: {
    type: [
      {
        pertype: String,
        age: String,
        price: Number,
        discountPrice: {
          type: Number,
          default: 0,
        },
      },
    ],
  },
  currency: {
    type: {
      name: String,
      abbreviation: String,
      symbol: String,
    },
  },
  updatedStatus: {
    type: Boolean,
    default: false,
  },
  activityMarchentCode: {
    type: String
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  addedBy: {
    type: String,
  },
  tOriginal: {
    type: Boolean,
    default: true,
  },
  topPriority: {
    type: Number,
  },
  saveAsDraft: {
    type: Boolean,
    default: false,
  },
  isApproval: {
    type: Boolean,
    default: false,
  },
  visibleStatus: {
    type: Boolean,
    default: false,
  },
  paymentTag: {
    type: String,
  },
  paymentTagColor: {
    type: String,
  },
  adminChangeApproveStatus: {
    type: Boolean,
    default: false,
  },
  isEdited: {
    type: Boolean,
    default: false,
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
    default: new Date(),
  },

});

module.exports = mongoose.model("tempActivityDetails", tempActivityDetailsSchema);
