const express = require('express');
const router = express.Router();
const multer = require('multer');
var storage = multer.memoryStorage()
var upload = multer({ storage: storage });

const subMerchantController = require('../../Controller/marchent/subMarchent');



router.get('/viewSubMarchent', subMerchantController.viewSubMarchent);



module.exports = router