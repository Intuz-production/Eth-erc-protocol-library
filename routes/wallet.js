const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ethers = require('ethers');
const accountFunc = require('../services/AccountFunc').func();
const userModel = require('../models/user');
const tokenModel = require('../models/token_info');
const userTransactionModel = require('../models/user_transaction');
// const userRedeemPhysicalCardCodeModel = require('../models/redeem_physical_card');
const auth = require('../services/general').func();
const Web3 = require('web3')
const ENUM = require('../config/enum')
var func = require("../services/transactionTrackingFunction")
var startTrackingFunc = func.trackingFunc();
const web3 = new Web3(process.env.RPCURL)
const _ = require('lodash');
const { encrypt, decrypt } = require("../services/common")
var gasPrice = 0

//To create new wallet
router.post('/createNewWallet', auth.verifyToken, (req, res) => {
    var post = req.body;
    var user_id = req.user_id;
    userModel.getUsersById(user_id, (err, user_result) => {
        if (err) {
            res.json({ status: 0, message: error_message });
        } else {
            if (user_result.length > 0) {
                if (user_result[0].publicAddress) {
                    res.json({ status: 0, message: "Wallet already created" });
                } else {
                    let mnemonicWallet = ethers.Wallet.createRandom()
                    let data = { publicAddress: mnemonicWallet.signingKey.address }
                    userModel.updateUserPublicAddress(user_id, data, (err, profile_result) => {
                        if (err) {
                            console.log("Error while updating account address : ", err);
                            res.json({ status: 0, message: error_message });
                        } else {
                            startTrackingFunc.getAllUserWalletAddress((resp) => {
                                console.log("New wallet added to subscribe list", resp)
                            });
                            var data = {
                                address: mnemonicWallet.signingKey.address,
                                mnemonic_word: mnemonicWallet.signingKey.mnemonic,
                                private_key: mnemonicWallet.signingKey.privateKey,
                            }
                            res.json({ status: 1, message: "Success", data: data })
                        }
                    });
                }
            } else {
                res.json({ status: 0, message: "Account not found." })
            }
        }
    });
})

//Confirm for existing public address available in db
router.post('/importFromSeedPhraseConfirm', auth.verifyToken, (req, res) => {
    var post = req.body;
    var user_id = req.user_id
    var required_params = ["mnemonic_word"];
    var elem = auth.validateReqParam(post, required_params);
    var valid = elem.missing.length == 0 && elem.blank.length == 0;
    if (valid) {
        try {
            let mnemonicWallet = ethers.Wallet.fromMnemonic(post.mnemonic_word)
            var publicAddress = mnemonicWallet.signingKey.address
            userModel.getUsersByPublicAddress(publicAddress, (err, user_result) => {
                if (err) {
                    res.json({ status: 0, message: err });
                } else {
                    if (user_result.length > 0) {
                        res.json({ status: 1, message: "Public address already availble to another user", assigned: true })
                    } else {
                        startTrackingFunc.getAllUserWalletAddress((resp) => {
                            console.log("New wallet added to subscribe list", resp)
                        });
                        res.json({ status: 1, message: "Public address not availble in another user account", assigned: false })
                    }
                }
            });
        } catch (err) {
            res.json({ status: 0, message: err.message })
        }
    } else {
        res.json({ status: 0, "message": "Some parameter are missing" })
    }
})

//To import wallet using seed Phrase
router.post('/importFromSeedPhrase', auth.verifyToken, (req, res) => {
    var post = req.body;
    var user_id = req.user_id
    var required_params = ["mnemonic_word"];
    var elem = auth.validateReqParam(post, required_params);
    var valid = elem.missing.length == 0 && elem.blank.length == 0;
    if (valid) {
        try {
            let mnemonicWallet = ethers.Wallet.fromMnemonic(post.mnemonic_word)
            var publicAddress = mnemonicWallet.signingKey.address
            userModel.getUsersByPublicAddress(publicAddress, (err, user_result) => {
                if (err) {
                    res.json({ status: 0, message: err });
                } else {
                    if (user_result.length > 0) {
                        var existingUser_id = user_result[0]._id
                        var existingUser_Name = user_result[0].displayName
                        if (existingUser_id != user_id) {
                            let data = { publicAddress: "" }
                            userModel.updateUserPublicAddress(existingUser_id, data, (err, old_profile_result) => {
                                if (err) {
                                    console.log("Error while updating account address : ", err);
                                    res.json({ status: 0, message: "Something went wrong." });
                                } else {
                                    let updatedData = { publicAddress: publicAddress }
                                    userModel.updateUserPublicAddress(user_id, updatedData, (err, profile_result) => {
                                        if (err) {
                                            console.log("Error while updating account address : ", err);
                                            res.json({ status: 0, message: "Something went wrong." });
                                        } else {
                                            var data = {
                                                address: mnemonicWallet.signingKey.address,
                                                mnemonic_word: mnemonicWallet.signingKey.mnemonic,
                                                private_key: mnemonicWallet.signingKey.privateKey,
                                            }
                                            startTrackingFunc.getAllUserWalletAddress((resp) => {
                                                console.log("New wallet added to subscribe list", resp)
                                            });
                                            var message = "Another user " + existingUser_Name + " have a same address so we remove wallet from their account and add in your account";
                                            res.json({ status: 1, message: message, data: data })
                                        }
                                    });
                                }
                            });
                        } else {
                            let data = { publicAddress: mnemonicWallet.signingKey.address }
                            userModel.updateUserPublicAddress(user_id, data, (err, profile_result) => {
                                if (err) {
                                    console.log("Error while updating account address : ", err);
                                    res.json({ status: 0, message: error_message });
                                } else {
                                    var data = {
                                        address: mnemonicWallet.signingKey.address,
                                        mnemonic_word: mnemonicWallet.signingKey.mnemonic,
                                        private_key: mnemonicWallet.signingKey.privateKey,
                                    }
                                    startTrackingFunc.getAllUserWalletAddress((resp) => {
                                        console.log("New wallet added to subscribe list", resp)
                                    });
                                    res.json({ status: 1, message: "Success", data: data })
                                }
                            });
                        }
                    } else {
                        let data = { publicAddress: mnemonicWallet.signingKey.address }
                        userModel.updateUserPublicAddress(user_id, data, (err, profile_result) => {
                            if (err) {
                                console.log("Error while updating account address : ", err);
                                res.json({ status: 0, message: error_message });
                            } else {
                                var data = {
                                    address: mnemonicWallet.signingKey.address,
                                    mnemonic_word: mnemonicWallet.signingKey.mnemonic,
                                    private_key: mnemonicWallet.signingKey.privateKey,
                                }
                                startTrackingFunc.getAllUserWalletAddress((resp) => {
                                    console.log("New wallet added to subscribe list", resp)
                                });
                                res.json({ status: 1, message: "Success", data: data })
                            }
                        });
                    }
                }
            });
        } catch (err) {
            res.json({ status: 0, message: err.message })
        }
    } else {
        res.json({ status: 0, "message": "Some parameter are missing" })
    }
})

//Confirm for existing public address available in db
router.post('/importFromPrivateKeyConfirm', auth.verifyToken, (req, res) => {
    var post = req.body;
    var user_id = req.user_id
    var required_params = ["private_key"];
    var elem = auth.validateReqParam(post, required_params);
    var valid = elem.missing.length == 0 && elem.blank.length == 0;
    if (valid) {
        try {
            let wallet = new ethers.Wallet(post.private_key);
            //Use encrypt and decrypt function for private key
            // let wallet = new ethers.Wallet(decrypt(post.private_key));
            var publicAddress = wallet.signingKey.address
            userModel.getUsersByPublicAddress(publicAddress, (err, user_result) => {
                if (err) {
                    res.json({ status: 0, message: err });
                } else {
                    if (user_result.length > 0) {
                        startTrackingFunc.getAllUserWalletAddress((resp) => {
                            console.log("New wallet added to subscribe list", resp)
                        });
                        res.json({ status: 1, message: "Public address already availble to another user", assigned: true })
                    } else {
                        res.json({ status: 1, message: "Public address not availble in another user account", assigned: false })
                    }
                }
            });
        } catch (err) {
            res.json({ status: 0, message: err.message })
        }
    } else {
        res.json({ status: 0, "message": "Some parameter are missing" })
    }
})

//To import wallet using Private Key
router.post('/importFromPrivateKey', auth.verifyToken, (req, res) => {
    var post = req.body;
    var user_id = req.user_id

    var required_params = ["private_key"];
    var elem = auth.validateReqParam(post, required_params);
    var valid = elem.missing.length == 0 && elem.blank.length == 0;
    if (valid) {
        try {
            let wallet = new ethers.Wallet(post.private_key);
            //Use encrypt and decrypt function for private key
            // let wallet = new ethers.Wallet(decrypt(post.private_key));
            var publicAddress = wallet.signingKey.address
            userModel.getUsersByPublicAddress(publicAddress, (err, user_result) => {
                if (err) {
                    res.json({ status: 0, message: err });
                } else {
                    if (user_result.length > 0) {
                        var existingUser_id = user_result[0]._id
                        var existingUser_Name = user_result[0].displayName
                        if (existingUser_id != user_id) {
                            let data = { publicAddress: "" }
                            userModel.updateUserPublicAddress(existingUser_id, data, (err, old_profile_result) => {
                                if (err) {
                                    console.log("Error while updating account address : ", err);
                                    res.json({ status: 0, message: "Something went wrong" });
                                } else {
                                    let updatedData = { publicAddress: publicAddress }
                                    userModel.updateUserPublicAddress(user_id, updatedData, (err, profile_result) => {
                                        if (err) {
                                            console.log("Error while updating account address : ", err);
                                            res.json({ status: 0, message: "Something went wrong" });
                                        } else {
                                            var data = {
                                                address: wallet.signingKey.address,
                                                mnemonic_word: wallet.signingKey.mnemonic,
                                                private_key: wallet.signingKey.privateKey,
                                            }
                                            startTrackingFunc.getAllUserWalletAddress((resp) => {
                                                console.log("New wallet added to subscribe list", resp)
                                            });
                                            var message = "Another user " + existingUser_Name + " have a same address so we remove wallet from their account and add in your account";
                                            res.json({ status: 1, message: message, data: data })
                                        }
                                    });
                                }
                            });
                        } else {
                            let data = { publicAddress: wallet.signingKey.address }
                            userModel.updateUserPublicAddress(user_id, data, (err, profile_result) => {
                                if (err) {
                                    console.log("Error while updating account address : ", err);
                                    res.json({ status: 0, message: error_message });
                                } else {
                                    var data = {
                                        address: wallet.signingKey.address,
                                        mnemonic_word: wallet.signingKey.mnemonic,
                                        private_key: wallet.signingKey.privateKey,
                                    }
                                    startTrackingFunc.getAllUserWalletAddress((resp) => {
                                        console.log("New wallet added to subscribe list", resp)
                                    });
                                    res.json({ status: 1, message: "Success", data: data })
                                }
                            });
                        }
                    } else {
                        let data = { publicAddress: wallet.signingKey.address }
                        userModel.updateUserPublicAddress(user_id, data, (err, profile_result) => {
                            if (err) {
                                console.log("Error while updating account address : ", err);
                                res.json({ status: 0, message: error_message });
                            } else {
                                var data = {
                                    address: wallet.signingKey.address,
                                    mnemonic_word: wallet.signingKey.mnemonic,
                                    private_key: wallet.signingKey.privateKey,
                                }
                                startTrackingFunc.getAllUserWalletAddress((resp) => {
                                    console.log("New wallet added to subscribe list", resp)
                                });
                                res.json({ status: 1, message: "Success", data: data })
                            }
                        });
                    }
                }
            });
        } catch (err) {
            res.json({ status: 0, message: err.message })
        }
    } else {
        res.json({ status: 0, "message": "Some parameter are missing" })
    }
})

//To transfer balance from one account to another
router.post('/transferBalanceFromWallet', auth.verifyToken, (req, res) => {
    var post = req.body;
    var user_id = req.user_id

    var required_params = ["wallet_add", "dest_add", "amount", "private_key"];
    var elem = auth.validateReqParam(post, required_params);
    var valid = elem.missing.length == 0 && elem.blank.length == 0;
    if (valid) {
        var valAdd = web3.utils.isAddress(post.dest_address)
        if (valAdd == true) {
            var withdrawAmount = parseFloat(post.amount)
            var gas_price = ENUM.GAS_PRICE
            var dest_address = post.dest_add
            var userWalletDetails = {
                wallet_add: post.wallet_add,
                user_id: user_id,
                private_key: post.private_key
                //Use encrypt and decrypt function for private key
                // private_key: decrypt(post.private_key)
            }
            accountFunc.sendETHFromOneToAnother(userWalletDetails, dest_address, withdrawAmount, gas_price, (transfer_result) => {
                if (transfer_result.status == 0) {
                    res.json({ status: 0, message: transfer_result })
                } else {
                    let transaction = new userTransactionModel({
                        user_id: user_id,
                        user_wallet_address: post.wallet_add,
                        dest_wallet_address: dest_address,
                        transaction_hash: transfer_result.data,
                        block_number: 0,
                        confirmation: 1,
                        amount: post.amount,
                        trans_type: "Withdraw"
                    });
                    userTransactionModel.addNewTransaction(transaction, (err, result) => {
                        if (err) {
                            console.log("Error in add data", err)
                            res.json({ "status": 0, message: "Error in store transaction data in database" })
                        } else {
                            res.json({ "status": 1, message: "Token successfully transfered", data: transfer_result })
                        }
                    })
                }
            })
        } else {
            res.json({ status: 0, "message": "Destination address not valid." })
        }
    } else {
        res.json({ status: 0, "message": "Some parameter are missing" })
    }
})

//Send ERC20 token to other users.
router.post('/sendERC20Token', auth.verifyToken, (req, res) => {
    var post = req.body
    var user_id = req.user_id
    var required_params = ["private_key", "amount", "dest_address", "token_name"];
    var elem = auth.validateReqParam(post, required_params);
    var valid = elem.missing.length == 0 && elem.blank.length == 0;
    if (valid) {
        var valAdd = web3.utils.isAddress(post.dest_address)
        if (valAdd == true) {
            var privateKey = post.private_key
            //Use encrypt and decrypt function for private key
            // private_key= decrypt(post.private_key)
            userModel.getUsersById(user_id, (err, user_result) => {
                if (err) {
                    console.log("Err while getting user using id : ", err);
                    res.json({ status: 0, message: "User not found" });
                }
                else {
                    if (user_result[0].publicAddress) {
                        var user_address = user_result[0].publicAddress;
                        tokenModel.getTokenByName(post.token_name, (err, token_result) => {
                            if (err) {
                                console.log("Err while getting token using user id : ", err);
                                res.json({ status: 0, message: "Something went wrong in getting token details" });
                            }
                            else {
                                if (token_result.length > 0) {
                                    var token_name = token_result[0].token_name
                                    var token_data = {
                                        token_name: token_name,
                                        token_address: token_result[0].contract_address,
                                        token_ABI: token_result[0].contract_ABI,
                                        user_address: user_address,
                                        dest_add: post.dest_address,
                                        amount: post.amount,
                                        private_key: privateKey,
                                        bal_type: "Token"
                                    }
                                    accountFunc.sendERC20Token(token_data, (transfer_result) => {
                                        if (transfer_result.status == 0) {
                                            res.json({ status: 0, message: transfer_result })
                                        } else {
                                            let transaction = new userTransactionModel({
                                                user_id: user_id,
                                                user_wallet_address: user_address,
                                                dest_wallet_address: post.dest_address,
                                                transaction_hash: transfer_result.data,
                                                block_number: 0,
                                                confirmation: 1,
                                                amount: post.amount,
                                                trans_type: post.token_name
                                            });
                                            userTransactionModel.addNewTransaction(transaction, (err, result) => {
                                                if (err) {
                                                    console.log("Error in add data", err)
                                                    res.json({ "status": 0, message: "Error in store transaction data in database" })
                                                } else {
                                                    res.json({ "status": 1, message: "Token successfully transfered", data: transfer_result })
                                                }
                                            })
                                        }
                                    })
                                } else {
                                    res.json({ status: 0, message: "No any token found" });
                                }
                            }
                        })
                    } else {
                        res.json({ status: 0, message: "User public address not found" });
                    }
                }
            });
        } else {
            res.json({ status: 0, "message": "Destination address not valid." })
        }
    } else {
        res.json({ status: 0, "message": "Some parameter are missing" })
    }
})

//Send ERC721 token to other users.
router.post('/sendERC721Token', auth.verifyToken, (req, res) => {
    var post = req.body
    var user_id = req.user_id
    var required_params = ["private_key", "amount", "dest_address", "token_name"];
    var elem = auth.validateReqParam(post, required_params);
    var valid = elem.missing.length == 0 && elem.blank.length == 0;
    if (valid) {
        var valAdd = web3.utils.isAddress(post.dest_address)
        if (valAdd == true) {
            userModel.getUsersById(user_id, (err, user_result) => {
                if (err) {
                    console.log("Err while getting user using id : ", err);
                    res.json({ status: 0, message: "User not found" });
                }
                else {
                    var user_address = user_result[0].publicAddress
                    if (user_address) {
                        tokenModel.getTokenByName(post.token_name, (err, token_result) => {
                            if (token_result && token_result.length > 0) {
                                let token_data = {
                                    dest_address: post.dest_address,
                                    token_address: token_result[0].contract_address,
                                    token_ABI: token_result[0].contract_ABI,
                                    user_address: user_address,
                                    private_key: post.private_key,
                                    //Use encrypt and decrypt function for private key
                                    // private_key: decrypt(post.private_key)
                                    amount: 1//post.amount
                                }
                                accountFunc.sendERC721Token(token_data, (transfer_result) => {
                                    if (transfer_result.status == 0) {
                                        console.log("Error in Send ERC721 Token", transfer_result)
                                        res.json({ status: 0, message: transfer_result })
                                    } else {
                                        let transaction = new userTransactionModel({
                                            user_id: user_id,
                                            user_wallet_address: user_address,
                                            dest_wallet_address: post.dest_address,
                                            transaction_hash: transfer_result.data,
                                            block_number: 0,
                                            confirmation: 1,
                                            amount: post.amount,
                                            trans_type: "Transfer ERC721 Token"
                                        });
                                        userTransactionModel.addNewTransaction(transaction, (err, result) => {
                                            if (err) {
                                                console.log("Error in add data", err)
                                                res.json({ "status": 0, message: "Error in store transaction data in database" })
                                            } else {
                                                res.json({ "status": 1, message: "Token successfully transfered", data: transfer_result })
                                            }
                                        })
                                    }
                                })
                            } else {
                                res.json({ "status": 1, message: "Token contract not found" })
                            }
                        }).catch(err => {
                            console.log("Error in get Token contract for send erc721 token : ", err)
                            res.json({ status: 0, message: "Something went wrong." })
                        })
                    } else {
                        res.json({ status: 0, "message": "User public address not found" })
                    }

                };
            })
        } else {
            res.json({ status: 0, "message": "Destination address not valid." })
        }

    } else {
        res.json({ status: 0, "message": "Some parameter are missing" })
    }
})

//Get list of all transaction
router.post('/getAllUserTransaction', auth.verifyToken, (req, res) => {
    var user_id = req.user_id
    userModel.getUsersById(user_id, (err, user_result) => {
        if (err) {
            console.log("Err while getting user using id : ", err);
            res.json({ status: 0, message: "Something went wrong." });
        }
        else {
            if (user_result.length > 0) {
                if (user_result[0].publicAddress) {
                    var user_address = user_result[0].publicAddress
                    userTransactionModel.getUserTransaction(user_address).then(trans_list => {
                        trans_list.map(trans => trans.transaction_hash = "https://etherscan.io/tx/" + trans.transaction_hash)
                        res.json({ status: 1, message: "Success", data: trans_list })
                    }).catch(err => {
                        console.log("Error : ", err)
                        res.json({ status: 0, message: "Something went wrong" })
                    })
                } else {
                    res.json({ status: 0, message: "User wallet address not found." })
                }
            } else {
                res.json({ status: 0, message: "User not found." })
            }
        }
    });
})

//Get transaction receipt after confirm transaction.
router.post('/getTransacrtionReceipt', (req, res) => {
    var post = req.body
    web3.eth.getTransactionReceipt(post.txHash).then((result) => {
        if (result.status == false) {
            res.json({ status: 0, message: "Failed", data: result })
        } else {
            res.json({ status: 1, message: "Success", data: result })
        }
    }).catch(err => {
        console.log("Error in get transaction receipt from blockchain :", err)
        res.json({ status: 0, message: "Failed", data: err })
    })
})

//Redeem physical card
// This function is specific to redeem card from the contract and related to specific contract and not relevant to this demo.
// router.post('/redeemPhysicalCard', auth.verifyToken, (req, res) => {
//     var post = req.body;
//     var response = {};
//     var user_id = req.user_id
//     var required_params = ["setName", "setAddress", "cardName", "redemptionCode", "privateKey"];
//     var elem = auth.validateReqParam(post, required_params);
//     var valid = elem.missing.length == 0 && elem.blank.length == 0;
//     if (valid) {
//         let card_data = new userRedeemPhysicalCardCodeModel({
//             user_id: user_id,
//             set_name: post.setName,
//             set_address: post.setAddress,
//             card_name: post.cardName,
//             redemption_code: post.redemptionCode,
//         });
//         userModel.getUsersById(user_id, (err, user_result) => {
//             if (err) {
//                 console.log("Err while getting user using id : ", err);
//                 res.json({ status: 0, message: "User not found" });
//             }
//             else {
//                 if (user_result.length > 0) {
//                     if (user_result[0].publicAddress) {
//                         var user_address = user_result[0].publicAddress;
//                         let token_data = {
//                             tokenAddress: post.setAddress,
//                             userAddress: user_result[0].publicAddress,
//                             privateKey: decrypt(post.privateKey),
//                             amount: 1,
//                             redemptionCode: post.redemptionCode
//                         }
//                         accountFunc.redeemPhysicalCard(token_data, (transfer_result) => {
//                             if (transfer_result.status == 0) {
//                                 console.log("Error in Redeem physical card", transfer_result)
//                                 res.json({ status: 0, message: "Something went wrong" })
//                             } else {
//                                 userRedeemPhysicalCardCodeModel.addPhysicalCardData(card_data, (err, result) => {
//                                     if (err) {
//                                         console.log("Error in add physical card data", err)
//                                         let transaction = new userTransactionModel({
//                                             user_id: user_id,
//                                             user_wallet_address: user_address,
//                                             dest_wallet_address: user_address,
//                                             transaction_hash: transfer_result.data,
//                                             block_number: 0,
//                                             confirmation: 1,
//                                             amount: 1,
//                                             trans_type: "Redeem Card : " + post.cardName
//                                         });
//                                         userTransactionModel.addNewTransaction(transaction, (err, result) => {
//                                             if (err) {
//                                                 console.log("Error in add transaction data", err)
//                                                 res.json({ "status": 0, message: "Error in store transaction data in database" })
//                                             } else {
//                                                 res.json({ "status": 1, message: "Redeem card successFully", data: transfer_result })
//                                             }
//                                         })
//                                     } else {
//                                         let transaction = new userTransactionModel({
//                                             user_id: user_id,
//                                             user_wallet_address: user_address,
//                                             dest_wallet_address: user_address,
//                                             transaction_hash: transfer_result.data,
//                                             block_number: 0,
//                                             confirmation: 1,
//                                             amount: 1,
//                                             trans_type: "Redeem Card : " + post.cardName
//                                         });
//                                         userTransactionModel.addNewTransaction(transaction, (err, result) => {
//                                             if (err) {
//                                                 console.log("Error in add transaction data", err)
//                                                 res.json({ "status": 0, message: "Error in store transaction data in database" })
//                                             } else {
//                                                 res.json({ "status": 1, message: "Redeem card successFully", data: transfer_result })
//                                             }
//                                         })
//                                     }
//                                 })
//                             }
//                         });
//                     } else {
//                         console.log("Wallet address not found")
//                         res.json({ status: 0, "message": "Wallet address not found" })
//                     }
//                 } else {
//                     console.log("User not found")
//                     res.json({ status: 0, "message": "User not found" })
//                 }
//             }
//         });
//     } else {
//         console.log("Some parameter missing")
//         res.json({ status: 0, "message": "Some parameter are missing" })
//     }
// })

module.exports = router;