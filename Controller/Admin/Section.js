const mongoose = require("mongoose");
const Section = require("../../Models/section");
const ResponseCode = require("../../service/responseCode");
const { DBerror, InputError } = require("../../service/errorHandeler");

const addSection = async (req, res) => {
 
  
  const checkforOnlyThreeForEachActivityType = await Section.findOne({
    activityTypeId : new mongoose.Types.ObjectId(req.body.activityTypeId) ,
    subType : req.body.subType,
    isDeleted: false 
  })
   
  if (!checkforOnlyThreeForEachActivityType) {
    
    new Section({
      ...req.body,
   
    })
      .save()
      .then((data) => {
        return res.status(ResponseCode.errorCode.success).json({
          status: true,
          message: "Section added successfully",
        });
      })
      .catch((error) => {
        const errors = DBerror(error);
        return res.status(ResponseCode.errorCode.serverError).json({
          status: false,
          message: "Server error,Please try again",
          error: errors,
        });
      });
  } else {
    res.status(ResponseCode.errorCode.dataExist).json({
      status: false,
      message: "Already have a same subType for the given Activity type you choosed ",
    });
  }

};


const viewSection = async (req, res) => {
  await Section.aggregate([
    {
      $match: {
        // activityTypeId: new mongoose.Types.ObjectId(req.params.activityTypeId),
        isDeleted: false,
        status: true,
      },
    },
    {
      $lookup:{
        from:"activitytypes",
        localField:"activityTypeId",
        foreignField:"_id",
        pipeline:[
          {
            $project:{
              name:1
            }
          }
        ],
        as:"activityTypes"
      }
    },
    {
      $unwind: {
        path: "$activityTypes",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "activitydetails",
        localField: "activityDetailsId",
        foreignField: "_id",
        as: "activity",
        pipeline: [
          {
            $lookup: {
              from: "categories",
              localField: "categoryId",
              foreignField: "_id",
              pipeline:[
               {
                $project:{
                  categoryName:1
                }
               }
              ],
              as: "categoriesData",
            },
          },
          {
            $unwind: {
              path: "$categoriesData",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              
              cityId: 0,
              activitySiteId: 0,
              // activityTypesId: 0,
              countryId: 0,
              languageId: 0,
              tourModuleId: 0,
              specialOfferId: 0,
              referenceCode: 0,
              categoryId: 0,
              status: 0,
              isDeleted: 0,
              __v:0
            },
          },
        ],
      },
    },

    {
      $lookup: {
        from: "activitysites",
        localField: "activitySiteId",
        foreignField: "_id",
        as: "sites",
        pipeline: [
          {
            $project: {
              __v:0,
              status: 0,
              isDeleted: 0,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "cities",
        localField: "cityId",
        foreignField: "_id",
        as: "city",
        pipeline: [
          {
            $project: {
              __v:0,
              status: 0,
              isDeleted: 0,
            },
          },
        ],
      },
    },
    {
      $project: {
        __v: 0,
        // activityTypeId: 0,
        status: 0,
        isDeleted: 0,
      },
    },
    {
      $sort: {
        _id: -1,
        createdOn:-1
      },
    },
  ])
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        data: data,
      });
    })
    .catch((error) => {
      const errors = DBerror(error);
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error,Please try again",
        error: errors,
      });
    });
};

const editSection = async (req, res) => {
  Section.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(req.params.id),
    },
    {
      ...req.body,
    }
  )
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "section updated",
      });
    })
    .catch((error) => {
      const errors = DBerror(error);
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error,Please try again",
        error: errors,
      });
    });
};

const deleteSection = async (req, res) => {
  Section.findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(req.params.id) },
    { isDeleted: true }
  )
    .then((data) => {
      return res.status(ResponseCode.errorCode.success).json({
        status: true,
        message: "section Deleted",
      });
    })
    .catch((error) => {
      const errors = DBerror(error);
      return res.status(ResponseCode.errorCode.serverError).json({
        status: false,
        message: "Server error,Please try again",
        error: errors,
      });
    });
};

module.exports = {
  addSection,
  viewSection,
  editSection,
  deleteSection,
};
