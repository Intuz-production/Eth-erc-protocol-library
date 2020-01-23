var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.json({status : 1, message :"API is working fine"});
});

module.exports = router;
