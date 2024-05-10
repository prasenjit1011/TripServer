const express = require('express');
const router = express.Router();
const multer = require('multer');
var storage = multer.memoryStorage()
var upload = multer({ storage: storage });

const MerchantController = require('../../Controller/SubAdmin/Merchant');


router.post('/subadmin-add-merchant', MerchantController.subadminRegisterMerchant);
router.get('/get-all-merchant-profile', MerchantController.getAllMemberProfile);
router.put('/update-merchant-profile/:id', MerchantController.updateMemberProfile);
router.put('/delete-merchant-profile/:id', MerchantController.deleteMemberProfile);
router.get('/single-merchant-profile/:id', MerchantController.singleMemberProfile);
router.post('/upload-image', upload.single("image"), MerchantController.merchantimage);


module.exports = router