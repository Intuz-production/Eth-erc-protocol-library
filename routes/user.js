const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const async = require('async');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const auth = require('../services/general').func();
// config values
const userModel = require('../models/user');

const saltRounds = 10;
const error_message = 'Something went wrong, Try again later.';


var regexEmail = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
router.post('/register', (req, res, next) => { // && post.password && post.password.trim() != "" 
    var post = req.body;
    console.log("post----->",post)
    var required_params = ["email", "password"];
    var elem = auth.validateReqParam(post, required_params);
    var valid = elem.missing.length == 0 && elem.blank.length == 0;
    if (valid) {
        if (post.email && post.email.trim() != "" && regexEmail.test((post.email).toLowerCase()) && post.password) {
            userModel.getUsersByEmail(post.email.trim().toLowerCase(), (err, user_result) => {
                if (err) {
                    console.log("Err while getting user from email : ", err);
                    res.json({ status: 0, message: error_message });
                }
                else {
                    if (user_result.length > 0) {
                        res.json({ status: 0, message: "Email address already registered"});
                    }else{
                        bcrypt.genSalt(saltRounds, function (err, salt) {
                            bcrypt.hash(post.password, salt, function (err, hash) {
                                let user_data = new userModel({
                                    "email": post.email.trim().toLowerCase(),
                                    "password": hash,
                                });
                                user_data.save((err, result) => {
                                    if (err) {
                                        console.log('Error while adding user : ', err);
                                        res.json({ status: 0, message: error_message });
                                    }
                                    else {
                                        var data = {
                                            '_id': result._id,
                                            'email': result.email.trim().toLowerCase(),
                                        }
                                        res.json({ status: 1, message: "User added successfully.", data: { token: jwt.sign({ _id: result._id }, process.env.JWT_SECRET_KEY), data: data } });
                                    }
                                });
                            });
                        });
                    }
                }
            });
        } else {
            res.json({ status: 0, message: "Invalid paramater", request_parameters: post });
        }
    } else {
        res.json({ status: 0, "message": "Some parameter are missing" })
    }
});

/* 
User Login
request_parameters: email, password
*/
router.post('/login', (req, res) => {
    var post = req.body;
    if (post.email && post.email.trim() != "" && regexEmail.test((post.email).toLowerCase())) { //  && post.password && post.password.trim() != ""
        userModel.getUsersByEmail(post.email.trim().toLowerCase(), (err, user_result) => {
            if (err) {
                console.log("Err while getting user from email : ", err);
                res.json({ status: 0, message: error_message });
            }
            else {
                if (user_result.length > 0) {
                    let user_password = user_result[0].password;
                    bcrypt.compare(post.password, user_password, function (err, isMatch) {
                        if (!isMatch) {
                            res.json({ status: 0, message: "Invalid password." });
                        } else {
                            const data = {
                                "_id": user_result[0]._id,
                                "email": user_result[0].email.trim().toLowerCase(),
                            };
                            res.json({ status: 1, message: "Login successful.", data: { token: jwt.sign({ _id: data._id, }, process.env.JWT_SECRET_KEY), data: data } });
                        }
                    })
                } else {
                    res.json({ status: 0, message: "Invalid email." });
                }
            }
        });
    } else {
        res.json({ status: 0, message: "Invalid parameter", request_parameters: post });
    }
});


module.exports = router;