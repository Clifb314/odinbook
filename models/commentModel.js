const mongoose = require('mongoose')
const Schema = mongoose.Schema

const commentSchema = new Schema({
    author: {type: Schema.Types.ObjectId, ref: 'userModel', required: true},
    content: {type: String, required: true},
    date: {type: Date, default: new Date()},
    likes: [{type: Schema.Types.ObjectId, ref: 'userModel'}],
    replyTo: {type: Schema.Types.ObjectId, ref: 'commentModel'}
})

commentSchema.virtual('easyDate').get(function() {
    return this.date.toLocaleString()
})

module.exports = mongoose.model('commentModel', commentSchema)