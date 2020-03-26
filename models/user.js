'use strict';

const mongoose = require('mongoose'),
      Schema = mongoose.Schema;

const SALT_WORK_FACTOR = 10;

const UserSchema = new Schema({
    id: { type: String, required: true, index: { unique: true } },
    token: { type: String, required: true },
});

module.exports = mongoose.model('User', UserSchema);
