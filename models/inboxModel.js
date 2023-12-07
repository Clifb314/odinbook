const mongoose = require('mongoose')
const Schema = require('mongoose').Schema

const inboxSchema = new Schema({
    title: {type: String, default: '', required: false},
    content: {type: String, required: true},
    from: {type: Schema.Types.ObjectId, required: true},
    to: {type: Schema.Types.ObjectId, required: true},
    seen: {type: Boolean, default: false},
    date: {type: Date, required: true},
    head: {type: Schema.Types.ObjectId, required: false, default: null},
    tail: {type: Schema.Types.ObjectId, required: false, default: null}
})

module.exports = mongoose.model('inboxModel', inboxSchema)