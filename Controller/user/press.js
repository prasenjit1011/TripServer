const mongoose = require("mongoose");
const pressModel = require("../../Models/press");
const ResponseCode = require("../../service/responseCode");
const viewPress = async (req, res) => {
    await pressModel
        .aggregate([
            {
                $match: {
                    isDeleted: false,
                    // status: true,
                },
            },
            {
                $sort: {createdOn: -1}
            },
            {
                $project: {
                    // createdOn: 0,
                    updatedOn: 0,
                    __v: 0,
                },
            },
        ])
        .then((data) => {
            return res.status(ResponseCode.errorCode.success).json({
                status: true,
                message: "View press successfully!",
                data: data,
            });
        })
        .catch((error) => {

            return res.status(ResponseCode.errorCode.serverError).json({
              status: false,
              message: "Server error,Please try again",

            });
          });
};



module.exports = {

    viewPress,

};
