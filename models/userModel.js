const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = new Schema({
    username: {type: String, required: true},
    _password: {type: String, required: true},
    icon: {
        data: Buffer, 
        contentType: String
    },
    googleAcct: {
        displayName: {type: String},
        id: {type: String},
        coverPhoto: {data: Buffer, contentType: String}
    },
    userDetails: {
        fullName: {type: String, required: false, default: 'anon'},
        birthdate: {type: Date, required: true},
        email: {type: String, required: true},    
    },
    friends: [{type: Schema.Types.ObjectId, ref: 'userModel'}],
    requests: [{type: Schema.Types.ObjectId, ref: 'userModel'}],
    pending: [{type: Schema.Types.ObjectId, ref: 'userModel'}],
    posts: [{type: Schema.Types.ObjectId, ref: 'postModel'}],
    inbox: [{type: Schema.Types.ObjectId, ref: 'inboxModel'}],
}, {toJSON: {virtuals: true}})

userSchema.virtual('age').get(function() {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()
    const day = today.getDay()

    const birthYr = this.userDetails.birthdate.getFullYear()
    const birthMo = this.userDetails.birthdate.getMonth()
    const birthDa = this.userDetails.birthdate.getDate()

    let age = year - birthYr

    if (month - birthMo < 1) {
        if (month - birthMo === 0 && day - birthDa < 1) age += 1
        else if (month - birthMo < 0) age += 1
    }

    return age
})

module.exports = mongoose.model('userModel', userSchema)