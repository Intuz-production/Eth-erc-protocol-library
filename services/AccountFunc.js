const Web3 = require('web3')
const async = require('async');
const { encrypt, decrypt } = require("./common")

const web3 = new Web3(process.env.RPCURL)
const Tx = require('ethereumjs-tx').Transaction;
var gasPrice = 0;
const ENUM = require('../config/enum')
exports.func = function () {
    return {
        getETHBalance: (address, cb) => {
            var response = {};
            web3.eth.getBalance(address)
                .then((result) => {
                    let inETH = web3.utils.fromWei(result)
                    response.status = 1;
                    response.message = "Got balance in ether !"
                    response.data = inETH
                    cb(response)
                }).catch((err) => {
                    response.status = 0;
                    response.message = "Something went wrong !";
                    response.data = err;
                    cb(response)
                })
        },
        getTokenBalance: (data, cb) => {
            var response = {};
            var tokenAddress = data.token_address
            var tokenABI = data.token_ABI;
            var tokenContract = new web3.eth.Contract(tokenABI, tokenAddress);
            tokenContract.methods.balanceOf(data.user_address).call()
                .then((result) => {
                    let inETH = 0
                    if (data.bal_type == "token") {
                        inETH = web3.utils.fromWei(result)
                    } else {
                        inETH = result
                    }
                    response.status = 1;
                    response.message = "Got balance of Token !"
                    response.data = inETH
                    cb(response)
                }).catch((err) => {
                    response.status = 0;
                    response.message = "Error in getting Token balance !";
                    response.data = err;
                    cb(response)
                })
        },
        //Sen ETH from user to other ETH wallet
        sendETHFromOneToAnother: function (walletdetails, dest_add, withdrawAmount, gasPriceForTransfer, cb) {
            var response = {}
            var private_key = Buffer.from(walletdetails.private_key.substring(2), 'hex')
            var fromAc = walletdetails.wallet_add
            var nonce = ''

            web3.eth.getTransactionCount(fromAc).then((result) => {
                getPriceOfGasFun((gas_result) => {
                    if (gas_result.status == 1) {
                        gasPrice = gas_result.gasPrice
                        var gasLimit = gasPriceForTransfer * gasPrice
                        var temp = ''
                        temp = parseFloat(gasPrice) * parseFloat(gasLimit)
                        var gasPriceHex = web3.utils.toHex(gasPrice);
                        var gasLimitHex = web3.utils.toHex(gasLimit);
                        nonce = web3.utils.toHex(result)
                        var amountHex = web3.utils.toHex(web3.utils.toWei(withdrawAmount.toString(), "ether"))
                        var rawTx = {
                            nonce: nonce,
                            gasPrice: gasPriceHex,
                            gasLimit: gasLimitHex,
                            to: dest_add,
                            value: amountHex,
                            from: fromAc,
                            chainId: 1
                        }
                        var tx = new Tx(rawTx)
                        tx.sign(private_key)
                        var serializedTx = tx.serialize()
                        web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
                            .on('transactionHash', function (hash) {
                                response.message = "Successfully send"
                                response.status = 1
                                response.data = hash
                                cb(response)
                            })
                            .on('error', function (error) {
                                response.message = "Something went wrong"
                                response.status = 0
                                response.data = error
                                cb(response)
                            })
                    } else {
                        response.message = "Error in get gas price"
                        response.status = 0
                        response.data = gas_result.gasPrice
                        cb(response)
                    }
                })
            }).catch(err => {
                console.log("error in get transaction count : ", err)
                response.message = "Error in get transaction"
                response.status = 0
                response.data = []
                cb(response)
            });
        },

        //Test Send ERC20 Token
        sendERC20Token: (data, cb) => {
            var response = {};
            var tokenAddress = data.token_address
            var tokenABI = data.token_ABI;
            var userAddress = data.user_address;
            var destAddress = data.dest_add
            var tokenContract = new web3.eth.Contract(tokenABI, tokenAddress);
            var private_key = Buffer.from(data.private_key.toUpperCase().substring(2), 'hex')
            var nonce = ''
            let gasPriceForTransfer = ENUM.GAS_PRICE
            web3.eth.getTransactionCount(userAddress).then((result) => {
                getPriceOfGasFun((gas_result) => {
                    if (gas_result.status == 1) {
                        gasPrice = gas_result.gasPrice
                        var gasLimit = gasPriceForTransfer * gasPrice
                        var gasPriceHex = web3.utils.toHex(gasPrice);
                        var gasLimitHex = web3.utils.toHex(gasLimit);
                        nonce = web3.utils.toHex(result)
                        let func_contract = tokenContract.methods.transfer(destAddress, web3.utils.toWei(data.amount.toString()))

                        var rawTx = {
                            nonce: nonce,
                            gasPrice: gasPriceHex,
                            gasLimit: gasLimitHex,
                            to: tokenAddress,
                            value: web3.utils.toHex(web3.utils.toWei('0.0', 'ether')),
                            data: func_contract.encodeABI(),
                            chainId: 1,
                            from: userAddress
                        }
                        var tx = new Tx(rawTx)
                        tx.sign(private_key)
                        var serializedTx = tx.serialize()
                        var rawwww = '0x' + serializedTx.toString('hex')

                        web3.eth.sendSignedTransaction(rawwww)
                            .on('transactionHash', function (hash) {
                                response.message = "Successfully send"
                                response.status = 1
                                response.data = hash
                                cb(response)
                            })
                            .on('error', function (error) {
                                response.message = "Something went wrong"
                                response.status = 0
                                response.data = error
                                cb(response)
                            })
                    } else {
                        response.message = "Error in get gas price"
                        response.status = 0
                        response.data = gas_result.gasPrice
                        cb(response)
                    }
                })
            }).catch(err => {
                console.log("error in get transaction count : ", err)
                response.message = "Error in get transaction"
                response.status = 0
                response.data = []
                cb(response)
            });
        },

        //SendToken from user to other token wallet
        sendERC721Token: (data, cb) => {
            var response = {};
            var token_Address = data.token_address
            var token_ABI = data.token_ABI
            var userAddress = data.user_address;
            var destAddress = data.dest_address
            var amount = data.amount
            var tokenContract = new web3.eth.Contract(JSON.parse(token_ABI), token_Address);
            var private_key = Buffer.from(data.private_key.toUpperCase().substring(2), 'hex')
            var nonce = ''
            let gasPriceForTransfer = ENUM.GAS_PRICE
            tokenContract.methods.balanceOf(userAddress).call()
                .then((result) => {
                    if (result > 0 && result >= amount) {
                        for (var i = 0; i < amount; i++){
                            tokenContract.methods.tokenOfOwnerByIndex(userAddress, i).call().then(tokenId => {
                                web3.eth.getTransactionCount(userAddress).then((result) => {
                                    getPriceOfGasFun((gas_result) => {
                                        if (gas_result.status == 1) {
                                            gasPrice = gas_result.gasPrice
                                            var gasLimit = gasPriceForTransfer * gasPrice
                                            var gasPriceHex = web3.utils.toHex(gasPrice);
                                            var gasLimitHex = web3.utils.toHex(gasLimit);
                                            nonce = web3.utils.toHex(result)
                                            let func_contract = tokenContract.methods.safeTransferFrom(userAddress, destAddress, tokenId)

                                            var rawTx = {
                                                nonce: nonce,
                                                gasPrice: gasPriceHex,
                                                gasLimit: gasLimitHex,
                                                to: tokenContract,
                                                data: func_contract.encodeABI(),
                                                chainId: 1,
                                                from: userAddress
                                            }
                                            var tx = new Tx(rawTx)
                                            tx.sign(private_key)
                                            var serializedTx = tx.serialize()
                                            var rawwww = '0x' + serializedTx.toString('hex')

                                            web3.eth.sendSignedTransaction(rawwww)
                                                .on('transactionHash', function (hash) {
                                                    response.message = "Successfully send"
                                                    response.status = 1
                                                    response.data = hash
                                                    cb(response)
                                                })
                                                .on('error', function (error) {
                                                    response.message = "Something went wrong"
                                                    response.status = 0
                                                    response.data = error
                                                    cb(response)
                                                })
                                        } else {
                                            response.message = "Error in get gas price"
                                            response.status = 0
                                            response.data = gas_result.gasPrice
                                            cb(response)
                                        }
                                    })
                                }).catch(err => {
                                    console.log("error in get transaction count : ", err)
                                    response.message = "Error in get transaction"
                                    response.status = 0
                                    response.data = []
                                    cb(response)
                                });
                            }).catch(err => {
                                console.log("Error in get token Id", err)
                                cb({ status: 1, message: "Error in get tokenId" })
                            })
                        }
                    } else {
                        response.status = 0;
                        response.message = "Insufficient funds.";
                        response.data = [];
                        cb(response)
                    }

                }).catch(err => {
                    response.status = 0;
                    response.message = "Error in Get balance !";
                    response.data = err;
                    cb(response)
                })
        }
    }
}

function getPriceOfGasFun(cb) {
    if (gasPrice == 0) {
        web3.eth.getGasPrice((err, gasPrice) => {
            var data = {
                status: 1,
                gasPrice: gasPrice
            }
            return cb(data)
        }).catch((error) => {
            var data = {
                status: 0,
                gasPrice: error
            }
            return cb(data)
        })
    } else {
        var data = {
            status: 1,
            gasPrice: gasPrice
        }
        return cb(data)
    }
}