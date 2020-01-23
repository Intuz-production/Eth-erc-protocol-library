const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema(
    {
        email: { type: String, required: true },
        password: { type: String },
        publicAddress: { type: String, default: "" },
    },
    {
        timestamps: true
    });


UserSchema.statics.getUsersByEmail = function (data, cb) {
    return this.find({
        "email": data
    }, cb);
}


UserSchema.statics.getUsersById = function (data, cb) {
    return this.find({
        "_id": data
    }, cb);
}

UserSchema.statics.getUsersByPublicAddress = function (data, cb) {
    return this.find({
        "publicAddress": data
    }, cb);
}

UserSchema.statics.updateUserPublicAddress = function (id, data, cb) {
    return this.updateOne({ _id: id }, data, cb)
}

module.exports = mongoose.model('Users', UserSchema, 'users');