const mongoose = require("mongoose");
const tourModule = require("../../Models/tourDetails");

const tourSearch = async (req, res) => {
  // const findName = req.params.name;
  await tourModule
    .aggregate([
      {
        $lookup:{
          from:"tours",
          localField:"tour",
          foreignField:"_id",
          as:"tourDetailss"
        }
      },
      {
        $unwind:{path:"$tourDetailss",preserveNullAndEmptyArrays:true}
      },
      {
        $match: {
          title: {
            $regex: ".*" + "london" + ".*",
            $options: "i",
          },
        },
      },
    ])
    .then((data) => {
      // console.log("data..", data);
      return res.status(200).json({
        status: true,
        message: "tour search Sucessfully",
        data: data,
      });
    })
    .catch((err) => {
      res.status(500).json({
        status: false,
        message: "Invalid id. Server error.",
      });
    });
};

module.exports={
    tourSearch
}