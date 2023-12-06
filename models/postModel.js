const mongoose = require('mongoose')
const Schema = mongoose.Schema


const postSchema = new Schema({
    title: {type: String, required: false, default: ''},
    content: {type: String, required: true},
    date: {type: Date, default: new Date()},
    comments: [{type: Schema.Types.ObjectId, ref: 'commentModel'}],
    likes: [{type: Schema.Types.ObjectId, ref: 'userModel'}]
})

postSchema.virtual('easyDate').get(function() {
    return this.date.toLocaleString()
})

module.exports = mongoose.model('postModel', postSchema)