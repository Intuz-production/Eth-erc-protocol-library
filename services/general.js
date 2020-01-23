var fs = require('fs');
var constants = require('../config/constants');
const jwt = require('jsonwebtoken');

exports.func = function () {
    return {
        verifyToken: (req, res, next) => {
            var token = req.headers['authorization'];
            if (!token) {
                return res.send({
                    status: 0,
                    message: 'No token provided'
                });
            } else {
                jwt.verify(token, process.env.JWT_SECRET_KEY, function (err, decoded) {
                    if (err) {
                        return res.send({
                            status: 0,
                            message: 'Failed to authenticate token.'
                        });
                    } else {
                        req.user_id = decoded._id;
                        req.user_name = decoded.user_name
                        next();
                    }
                });
            }
        },
        /* function to check whether required req param is exist in post or not*/
        validateReqParam: function (post, reqparam) {
            var remain = [];
            var req = [];
            var not_valid = []
            for (var i = 0; i < reqparam.length; i++) {
                if (typeof post[reqparam[i]] != 'undefined') {
                    // console.log("post=====>",post[reqparam[i]])
                    if (post[reqparam[i]] == '' || post[reqparam[i]] == null || post[reqparam[i]] == 'null') {
                        req.push(reqparam[i]);
                    } else {
                        if (reqparam[i] == 'phone') {
                            if (!(/^\d+$/.test(post[reqparam[i]]))) {
                                not_valid.push(reqparam[i])
                            }
                        }
                    }
                } else {
                    remain.push(reqparam[i]);
                }
            }
            var respose = { 'missing': remain, 'blank': req, 'not_valid': not_valid };
            return respose;
        },
    }
}