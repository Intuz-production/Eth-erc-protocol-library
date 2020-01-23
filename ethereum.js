'use strict';
var express = require('express');
var router = express.Router();
var dotenv = require('dotenv');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
dotenv.config({
  "path": __dirname + "/config/." + process.env.NODE_ENV.trim() + ".env"
});
var cors = require('cors')
var constants = require('./config/constants')
const mongoose = require('mongoose');
var http = require('http');
var swaggerUi = require('swagger-ui-express')
var swaggerDocument = require('./swagger.json');
var func = require("./services/transactionTrackingFunction");
var startTrackingFunc = func.trackingFunc();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');


const port = process.env.PORT || 5040;
var app = express();
app.use(cors())
//Configure mongoose's promise to global promise
mongoose.promise = global.Promise;

//mongoose connection
mongoose.connect(`mongodb://${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`, {
  useNewUrlParser: true
}).catch(function (err) {
  console.log("DATABSE CONNECTION ERROR : ", err);
})
mongoose.connection.on("connected", function () {
  constants.consoleSeparate("MONGODB CONNECTED SUCCESSFULLY", "greenBright");
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', require('./routes/index'));
app.use('/api-calls', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api/users', require('./routes/user'))
app.use('/api/wallet', require('./routes/wallet'));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

var server = http.createServer(app);

// Start Server
server.listen(port, function () {
  constants.consoleBox(`NODE SERVER IS RUNNING ON PORT ${process.env.PORT}`, "cyanBright");
  startTrackingFunc.startTrackingTransaction()
});

module.exports = app;
