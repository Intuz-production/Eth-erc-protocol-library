const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TokenSchema = new Schema({
    token_name:{type:String,required:true},
    contract_ABI:{type:Array},
    contract_address:{type:String}
})

TokenSchema.statics.getTokenData = function (cb) {
    return this.find({}, cb);
}

TokenSchema.statics.getTokenByName = function (data ,cb) {
    return this.find({token_name : data}, cb);
}
module.exports = mongoose.model('Token_info', TokenSchema, 'token_info');