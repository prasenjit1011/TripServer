var createError = require('http-errors');
var express = require('express');
var cors = require('cors');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mongoose = require('mongoose');
const stripe = require("stripe")("sk_test_BSSqlYfjDB6zQm2EsDqxKuUg");
require('dotenv').config()

var indexRouter = require('./routes/index');

var app = express();

app.use(cors({
  origin: "*"
}));

app.use(express.json());

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(logger('dev'));

app.use("/pdf", express.static(path.join(__dirname, "pdf")));

// Database connect 
mongoose.connect(process.env.MONGOURL,
  {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
  .then(() => {
    console.log('ThingTODO Database connected\n\n\n\n');
  })
  .catch((error) => {
    console.log('Error connecting to database\n\n');
  });

// Database connect end 

app.use("/",indexRouter);
// app.use('/users', usersRouter);

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
// app.post('/your-server-endpoint-to-create-session', async (req, res) => {
//   try {
//     const sessionData = req.body.data; 
//     console.log("sessionData",sessionData)
//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ['card'],
//       mode: 'payment', 
//       line_items: [
//         {
//           price_data: {
//             currency: 'usd', // Change to your preferred currency
//             product_data: {
//               name: 'walking tour one ', // Change to your product name
//             },
//             unit_amount: sessionData.actualPrice*100, // Change to the amount in cents
//           },
//           quantity: 1, // Change based on your requirements
//         },
//       ],
//       success_url: 'http://34.201.127.230:3000/booking-history',
//       cancel_url: 'http://34.201.127.230:3000/booking-history',  

//     }); 
    
//     res.json({ id: session.id });
//   } catch (error) {
//     console.error('Error creating Stripe Checkout Session:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });


// catch 404 and forward to error handler
// app.use(function (req, res, next) {
//   next(createError(404));
// });

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// var usersRouter = require('./routes/users');  
 // oo

module.exports = app;
