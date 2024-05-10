var mongoose = require("mongoose");

const newActivityDetailsSchema = new mongoose.Schema({
  activityId: {
    type: mongoose.Types.ObjectId,
  },
  merchantId: {
    type: mongoose.Types.ObjectId,
  },
  cityId: {
    type: mongoose.Types.ObjectId,
  },
  activitySiteId: {
    type: mongoose.Types.ObjectId,
  },
  activityTypesId: {
    type: mongoose.Types.ObjectId,
    // require: false
  },
  categoryId: {
    type: mongoose.Types.ObjectId,
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
  referenceCode: {
    type: String,
  },
  activityTitle: {
    type: String,
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
  tourDuration: {
    value: {
        type: Number,
        // required: true
    },
    unit: {
        type: String,
        enum: ['hours', 'days'],
        // required: true
    }
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
  reasonType: {
    type: String,
  },
  priority: {
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
  isDeleted: {
    type: Boolean,
    default: false,
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

module.exports = mongoose.model("newActivityDetails", newActivityDetailsSchema);
