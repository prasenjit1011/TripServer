const mongoose = require('mongoose')
const AdminTab = require('../../Models/adminTab')
const ResponseCode = require("../../service/responseCode");
const subAdminModel  = require("../../Models/subAdmin")

const viewAdmintab = async (req,res)=>{

  try {
    const getAdminTab = await AdminTab.aggregate([
      {
        $match:{
          isDeleted:false
        }
      },
      {
        $project:{
          __v:0,
          createdOn:0,
          status:0,
          isDeleted:0
        }
      }
    ])
    const getSubAdminDetailForAccessRight = await subAdminModel.aggregate([
      {$match:{
        isDeleted:false ,
        status : true 
      }} ,
      {
        $project:{
          __v:0,
          createdOn:0,
          status:0,
          isDeleted:0
      }
    }
    ])

    res.status(ResponseCode.errorCode.success).json({
      status:true,
      message:"view Sucessfully !",
      data:getAdminTab
    })

  }catch(error) {
    
    res.status(ResponseCode.errorCode.serverError).json({
      status:false,
      message:"view Sucessfully !",
      data:error.message
    })
  }

}

const viewSubAdminTab =  async (req,res) => {
  
  try{
    //console.log(req.params.subadminId)
    const subadminAccess = await subAdminModel.aggregate([
      {
        $match: {
          _id : new mongoose.Types.ObjectId(req.params.subadminId) ,
          isDeleted : false ,
        }
      } ,

    ])
 
    

    //console.log(subadminAccess)

    if (subadminAccess.length === 0) {
     return res.status(400).json({status:false , msg  : "Sub admin does not exists in DB !!" ,data : []})
    } 


   
    let assignAccess =  []
    let tabPermission =  []

    if ( subadminAccess[0].hasOwnProperty("assignAccess") ) {
      assignAccess = subadminAccess[0].assignAccess
    }
    if( subadminAccess[0].hasOwnProperty("tabPermission") ) {
      tabPermission = subadminAccess[0].tabPermission
    }


    res.status(200).json({status:true , msg  :"Data got sucessfully " , data :{
      accessRight: assignAccess, 
      tabPermission:  tabPermission , 
      } })


  }catch(error){
      res.status(500).json({status:false , msg  : "Server Error " ,data : error.message})
  }


}


const viewTabWithSubAdminAccess = async(req,res) => {

  try { 
    
    //console.log(req.user.email)

    const checkSubAdmin = await  subAdminModel.find({email:req.user.email ,
                                                          isDeleted :false },
                                                          {
                                                            assignAccess : 1 ,
                                                            tabPermission : 1
                                                          })

    if (checkSubAdmin) {
       res.status(200).json({status:true , msg :"sub admin access data gotsuccessfully !!" ,data:checkSubAdmin})
    }else {
      res.status(400).json({
        status:false,
        message:" There is no access data present in DB for subadmin !",
        
      })

    }


  }catch(error) {
    
    res.status(ResponseCode.errorCode.serverError).json({
      status:false,
      message:"Server Errror !!",
      data:error.message
    })
  }
}

module.exports={

    viewAdmintab ,
    viewSubAdminTab ,
    viewTabWithSubAdminAccess
}