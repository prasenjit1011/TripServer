var express = require('express');
const axios = require('axios');

const { scheduleNotification } = require('../Controller/user/deviceRegistration');
const { scheduleTripNotification } = require('../Controller/user/userBooking');

var router = express.Router();
const v1 = require('./v1');
const { scheduleInvoiceGenereateForMarchant } = require('../Controller/Admin/activityDetails');
// GET home page. 
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

// Call the scheduleNotification function to set up the cron job
scheduleNotification();


scheduleTripNotification();

//call for invoice genereate for marchant using cron
scheduleInvoiceGenereateForMarchant();

router.use('/api/v1', v1);

router.post("/place-search", (req, res) => {
  axios.post(req.body.url).then(resp => {

    res.status(200).json({
      status: true,
      data: resp.data
    })
    // res.send()

  });
})


module.exports = router;
