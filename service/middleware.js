var user = {};

var AdminController = require("../Controller/Auth/Admin");
var SubAdminController = require("../Controller/Auth/SubAdmin");
var MerchantController = require("../Controller/Auth/Merchant");
var UserController = require("../Controller/Auth/User");
var subMarchentController = require("../Controller/marchent/subMarchent")


//Middleware
const permission = [
  {
    url: "/admin/register",
  },
  {
    url: "/user/register",
  },
  {
    url: "/user/filter-cityAgainstActivity/:cityId/:activityTypeId",
  },



];

user.middleware = async (req, res, next) => {
  if (permission.filter((it) => it.url == req.url).length > 0) {
    next();
  } else {
    //console.log(req.headers)
    if (!req.headers.authorization) {
      return res
        .status(401)
        .json({
          error: "No credentials sent!",
          status: false,
          credentials: false,
        });
    } else {
      let authorization = req.headers.authorization;
      let userData = null;
     
      let userType =
        typeof req.headers.usertype != "undefined"
          ? req.headers.usertype
          : "User";
          //console.log("userType:-", userType)

          
          if(req.url.indexOf("undefined")>-1){
            if(req.url.indexOf("viewActivityDetails")<0 && req.url.indexOf("view-all-tourModule")<0){
              return res
              .status(400)
              .json({
                error: "Undefined params in URL",
                status: false,
                credentials: false,
              });
            }
          }


      // console.log('userType', userType, req.headers);
      if (userType == "Admin") {
        userData = await AdminController.getTokenData(authorization);
      } else if (userType == "Subadmin") {
        userData = await SubAdminController.getTokenData(authorization);
      } else if (userType == "Merchant") {
        userData = await MerchantController.getTokenData(authorization);
        // console.log("userData", userData)
      } else if (userType == "User") {
        userData = await UserController.getTokenData(authorization);
      } else if (userType == "subMarchent") {
        userData = await subMarchentController.getTokenData(authorization);
      }

      // console.log('userData', userData);

      if (userData && userData != null) {
        userData.password = null;
        //  console.log(userData)
        req.user = userData;
        req.userType = userType;
        // console.log(userType)
        (req.token = req.headers.authorization),
          // console.log( req.token)
          next();
      } else {
        res
          .status(400)
          .json({
            error: "credentials not match",
            status: false,
            credentials: false,
          });
      }
    }
  }
};

module.exports = user;
