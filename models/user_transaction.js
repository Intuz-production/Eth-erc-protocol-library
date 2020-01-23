const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserTransactionSchema = new Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    user_wallet_address : {type: String, required: true},
    dest_wallet_address : {type: String, required: true},
    transaction_hash:{type:String},
    confirmation : { type: Number, default : 0},
    block_number : { type: Number, default : 0},
    trans_type : {type: String},
    amount:{type:String,required:true}
},{
    timestamps: true
})

UserTransactionSchema.statics.getUserTransaction = function (user_address,cb) {
    // console.log("User Address : ",user_address)
    return this.find({$or : [{user_wallet_address : user_address}, {dest_wallet_address : user_address}]}, cb).sort({ "createdAt": -1 });
}

UserTransactionSchema.statics.addNewTransaction = function (data, cb) {
    data.save((err, result) => {
        if (err) {
            cb(err, result);
        } else {
            cb(err, result);
        }
    });
}
module.exports = mongoose.model('User_transaction', UserTransactionSchema, 'user_transaction');
