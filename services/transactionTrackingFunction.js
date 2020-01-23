"use strict";
var express = require("express");
var func = require('./functions');
var functions = func.func();
const userModel = require('../models/user');
var async = require("async");
var Web3 = require('web3');
const web3 = new Web3(process.env.RPCURL)

var allAddress = [];
var allTokenAddress = {};

module.exports = {

    trackingFunc: function () {
        return {
            //start transaction tracing in ethereum
            startTrackingTransaction: function () {
                getAllUserWalletAddress(function (resp) {
                    //get all wallet address from ethereum
                    if (resp.status == 0) {
                        console.log("Error in get wallet address response")
                    } else {
                        //If we have to add check token address then use below commented unctionality
                        // getAllTokenAddress(function (resp_token) {
                        //     if (resp_token.status == 0) {
                        //         console.log("Error in get token address response")
                        //     } else {
                        //start web socket subscription
                        functions.webSocketImplement((res1) => {
                            if (res1.status == 1) {
                                //for get block data by using block hash number
                                var res1Data = {
                                    hash: res1.hash,
                                    number: res1.number
                                }
                                functions.getBlockDataByHash(res1Data, (res2) => {
                                    if (res2.status == 1) {
                                        // for get all transaction from block using hash
                                        //If token is available then pass all token address else only all address
                                        functions.getTransactionByHash(res2.data, allAddress, allTokenAddress, (res3) => {
                                            if (res3.status == 1) {
                                            } else {
                                                console.log("Something Went Wrong in 'getTransactionByHash' function")
                                            }
                                        })
                                    } else if (res2.status == 2) {
                                        console.log("No transaction in block")
                                    } else {
                                        console.log("Something Went Wrong in 'getBlockDataByHash' function")
                                    }
                                })
                            } else {
                                console.log("Something Went Wrong in 'webSocketImplement' function")
                            }
                        })
                        //     }
                        // })
                    }
                })
            },
            getAllUserWalletAddress: function (cb) {
                var response = {}
                // getAllTokenAddress(function (resp) {

                // })
                getAllUserWalletAddress(function (resp) {
                    if (resp.status == 0) {
                        response.status = 0
                        response.message = "Error in adding new wallet address in subscription";
                        cb(response)
                    } else {
                        response.status = 1
                        response.message = "Success";
                        cb(response)
                    }
                })
            }
        };
    }
}
function getAllUserWalletAddress(cb) {
    var response = {}
    allAddress = []
    userModel.find({}).then(function (response) {
        async.eachOf(response, function (value, key, callback) {
            if (value.publicAddress != '') {
                allAddress.push(value.publicAddress.toLowerCase());
                callback()
            } else {
                callback()
            }
        }, function (err) {
            if (err) {
                response.message = "Something Went Wrong"
                response.status = 0
                cb(response)
                console.log("Error :", err)

            } else {
                response.message = "Success"
                response.status = 1
                cb(response)
            }
        })
    }).catch(err => {
        response.message = "Something Went Wrong"
        response.status = 0
        cb(response)
        console.log("Error :", err)
    })
}

//For the get all ERC20, ERC721 etc token address for the cron functionality

// function getAllTokenAddress(cb) {
//     var response = {}
//     allTokenAddress = []
//     tokenModel.getTokenData().then(function (response) {
//         async.eachOf(response, function (value, key, callback) {
//             if (value.contract_address != '') {
//                 allTokenAddress[value.contract_address] = value;
//                 callback()
//             } else {
//                 callback()
//             }
//         }, function (err) {
//             if (err) {
//                 response.message = "Something Went Wrong"
//                 response.status = 0
//                 cb(response)
//                 console.log("Error :", err)

//             } else {
//                 response.message = "Success"
//                 response.status = 1
//                 cb(response)
//             }
//         })
//     }).catch(err => {
//         console.log("Error :", err)
//         response.message = "Something Went Wrong"
//         response.status = 0
//         cb(response)
//     })
// }

