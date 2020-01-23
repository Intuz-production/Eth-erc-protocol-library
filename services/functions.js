var async = require("async");
var Web3 = require('web3');
const web3 = new Web3(process.env.RPCURL)
const userTransactionModel = require('../models/user_transaction');
const userModel = require('../models/user');
const { encrypt, decrypt } = require('./common');
var abiDecoder = require('abi-decoder');

// Test network Web socket URL = 'wss://rinkeby.infura.io/ws'
// Main network Web socket URL = 'wss://mainnet.infura.io/ws'
const web3socket = new Web3(new Web3.providers.WebsocketProvider('wss://rinkeby.infura.io/ws/v3/<enter your API Key>'));
const subscription = web3socket.eth.subscribe("newBlockHeaders", (error, result) => {
    if (error) {
        console.error(error);
        response.message = error
        response.status = 0
        cb(response)
    }
})
var confirmation_count = 5;
var gasPrice = 0;


exports.func = function () {
    return {
        //start web socket subscription
        webSocketImplement: function (cb) {
            var response = {}
            subscription.on('data', (log) => {
                response.message = "Data Fetching"
                response.status = 1
                response.hash = log.hash
                response.number = log.number
                cb(response)
            }).on("error", (err) =>{
                console.log("Error in websocket : ",err)
                response.message = "Data Fetching"
                response.status = 2
                cb(response)
            });

        },
        //for get block data by using block hash number
        getBlockDataByHash: function (data, cb) {
            var response = {}
            web3.eth.getBlock(data.hash, (error, result) => {
                if (error) {
                    console.error(error);
                    response.message = error
                    response.status = 0
                    cb(response)
                }
            }).then((result) => {
                if (result) {
                    response.message = "Data Fetching"
                    response.status = 1
                    response.data = (result.transactions == null ? '' : result.transactions)
                    cb(response)
                    tx_confirmation(data.number, confirmation_count)
                } else {
                    response.message = "Data Fetching"
                    response.status = 2
                    cb(response)
                    tx_confirmation(data.number, confirmation_count)
                }
            }).catch(err => {
                console.log("error in get block data by hash.",err)
                response.message = "Data Fetching"
                response.status = 2
                cb(response)
            });
        },

        // for get all transaction from block using hash
        getTransactionByHash: function (transactions, allAddress, allTokenAddress, cb) {
            var response = {}
            var allTokenAddresses = Object.keys(allTokenAddress)
            var transactionDataTo = []
            async.each(transactions, function (tran, callback) {
                web3.eth.getTransaction(tran)
                    .then((result) => {
                        if (result != null) {
                            if (allAddress.includes(result.to)) {
                                response = {}
                                response.toAddress = result.to;
                                response.amount = result.value
                                transactionDataTo.push(response)

                                userModel.find({ publicAddress: result.to }).select("_id").then(user_details => {
                                    let transaction = new userTransactionModel({
                                        user_id: user_details._id,
                                        user_wallet_address: result.to,
                                        dest_wallet_address: result.from,
                                        transaction_hash: result.hash,
                                        block_number: result.blockNumber,
                                        confirmation: 1,
                                        amount: web3.utils.fromWei(result.value),
                                        trans_type: "Deposit"
                                    });
                                    userTransactionModel.addNewTransaction(transaction, (err, result) => {
                                        if (err) {
                                            console.log("Error in add data", err)
                                            callback()
                                        } else {
                                            callback()
                                        }
                                    })
                                })
                                //If want ot track token address then use below else if condition.
                            } else if (allTokenAddresses.includes(result.to)) {
                                var tokenAddress = result.to
                                var tokenABI = allTokenAddress[result.to]["contract_ABI"];
                                abiDecoder.addABI(tokenABI);
                                var tokenContract = new web3.eth.Contract(tokenABI, tokenAddress);
                                tokenContract.methods.symbol().call()
                                    .then((symbol_result) => {
                                        var inputData = abiDecoder.decodeMethod(result.input)
                                        if (inputData.name.toLowerCase() == "transfer") {
                                            var toAddress = inputData.params.filter(function (entry) { return entry.name.toLowerCase() === "_to"; });
                                            var amount = inputData.params.filter(function (entry) { return entry.name.toLowerCase() == "_value"; });
                                            if (allAddress.includes(toAddress[0].value.toLowerCase())) {
                                                response = {}
                                                response.toAddress = toAddress[0].value;
                                                response.amount = web3.utils.fromWei(amount[0].value)
                                                transactionDataTo.push(response)

                                                userModel.find({ publicAddress: { $regex: new RegExp("^" + toAddress[0].value.toLowerCase(), "i") } }).select("_id").then(user_details => {
                                                    let transaction = new userTransactionModel({
                                                        user_id: user_details._id,
                                                        user_wallet_address: toAddress[0].value,
                                                        dest_wallet_address: result.from,
                                                        transaction_hash: result.hash,
                                                        block_number: result.blockNumber,
                                                        confirmation: 1,
                                                        amount: web3.utils.fromWei(amount[0].value),
                                                        trans_type: "Deposit : " + symbol_result
                                                    });
                                                    userTransactionModel.addNewTransaction(transaction, (err, result) => {
                                                        if (err) {
                                                            console.log("Error in add data", err)
                                                            abiDecoder.removeABI(tokenABI);
                                                            callback()
                                                        } else {
                                                            abiDecoder.removeABI(tokenABI);
                                                            callback()
                                                        }
                                                    })
                                                })
                                            } else {
                                                abiDecoder.removeABI(tokenABI);
                                                callback()
                                            }
                                        }
                                    }).catch(err => {
                                        abiDecoder.removeABI(tokenABI);
                                        callback()
                                        console.log("err in get symbol", err)
                                    })
                            } else {
                                callback()
                            }
                        } else {
                            callback()
                        }
                    }).catch(err => {
                        console.log("error in get transaction callback")
                        callback()
                    })
            }, function (err) {
                if (err) {
                    response.message = err
                    response.status = 0
                    cb(response)
                    console.log("Error : ", err)
                } else {
                    if (transactionDataTo.length > 0) {
                        // console.log('Transaction Match')
                        response.message = "Data Fetching"
                        response.status = 1
                        response.data = transactionDataTo
                        // subscription.unsubscribe()
                        cb(response)
                    }
                }
            })
        },
    };
}

function tx_confirmation(blocknumber, confirmation_count) {
    var old_blockNumber = blocknumber - confirmation_count;

    userTransactionModel.updateMany(
        {
            $and: [
                { "block_number": { $lt: blocknumber } },
                { "block_number": { $gte: old_blockNumber } },
                { "confirmation": { $lt: 6 } }]
        },
        {
            $inc: { confirmation: 1 }
        }).then((response) => {
        }).catch((error) => {
            console.log("Error in store transaction data :", error)
        })
}

function getCountOfTransactionFun(fromAc, cb) {
    web3.eth.getTransactionCount(fromAc).then((result) => {
        var data = {
            status: 1,
            result: result
        }
        cb(data)
    })
}