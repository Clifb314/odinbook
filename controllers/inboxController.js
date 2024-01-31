const Users = require('../models/userModel')
const Inbox = require('../models/inboxModel')
const jwt = require('jsonwebtoken')
const {body, validationResult} = require('express-validator')

const verify = () => jwt.verify(req.token, process.env.SECRET, {issuer: 'CB'})

exports.inboxList = async (req, res, next) => {
    try {
        const user = verify()
        const messages = await Users.findById(user._id, {inbox: 1})
          .populate({
            path: 'inbox',
            options: {sort: {date: -1}},
            populate: 'from'
          })
          .lean()
          .exec()
        if (messages.length < 1) return res.json({message: 'Inbox empty!'})
    
        //will filter into seen and unseen on client end
        return res.json(messages)    
    } catch(err) {
        console.error(err)
        return res.status(500).json({message: 'Could not access database'})
    }
}


exports.messageDetail = async (req, res, next) => {


    async function messageChain(_id, userid) {
        const message = await Inbox.findOne({_id, $or: [{to: userid}, {from: userid}]})
          .lean()
          .exec()
        //not found
        if (!message) return null
        //go to head first
        if (message.head) return messageChain(message.head, userid)
        //reaching the end of the chain
        if (!message.tail) return [message]
        //follow the tail
        return [message].concat(messageChain(message.tail, userid))
    }



    try {
        const user = verify()
        //const target = Inbox.findOne({_id: req.params.inboxid, to: user._id}).lean().exec()
        const chain = messageChain(req.params.inboxid, user._id)
    
        if (!chain) return res.status(400).json({message: 'Access denied'})
        //chain should be an array with target[0] == the first message in a message chain
        return res.json(chain)
    } catch(err) {
        console.error(err)
        return res.status(500).json({message: 'Could not access database'})       
    }
}

exports.sendMsg = [
    body('title').trim().escape(),
    body('content').trim().escape().isLength({min: 1}).withMessage('message cannot be empty'),

    async (req, res, next) => {
        const {title, content, to, from, head} = req.body
        const errors = validationResult(req.body)
        if (!errors.isEmpty()) return res.status(401).json({errors: errors.array(), message: 'input validation failed'})
        try {
            const newMsg = new Inbox({
                title,
                content,
                from,
                to,
                date: new Date(),
                head,
                tail: null,
                seen: false,
            })
            await newMsg.save()
            //update head/parent, remove from inbox
            if (head) {
                await Inbox.findByIdAndUpdate(head, {tail: newMsg._id}).exec()
                await Users.findByIdAndUpdate(to, {$pull: {inbox: newMsg.head}})
            }
            //update target user inbox with new msg
            await Users.findByIdAndUpdate(to, {$push: {inbox: newMsg._id}}).exec()
            return res.json(newMsg)
        } catch(err) {
            console.error(err)
            return res.status(500).json({message: 'Could not access database'})
        }
    }
]

exports.markRead = async (req, res, next) => {
    try {
        const user = verify()
        const msg = await Inbox.findOneAndUpdate({_id: req.params.inboxid, to: user._id}, {seen: true}, {new: true}).exec()
        if (!msg) return res.status(401).json({message: 'Item not found'})
        //await Users.findOneAndUpdate({_id: user._id}, {$pull: {inbox: req.params.inboxid}})
        return res.json({message: 'Status updated'})
    } catch(err) {
        console.error(err)
        return res.status(500).json({message: 'Could not access database'})  
    }
}

exports.delMsg = async (req, res, next) => {
    try {
        const user = verify()
        //should someone be able to delete a message off the server? maybe just hide it
        const msg = await Inbox.findOneAndDelete({_id: req.params.inboxid, to: user._id}).exec()
        if (!msg) return res.status(401).json({message: 'Access denied'})
        await Users.findOneAndUpdate({_id: user._id}, {$pull: {inbox: req.params.inboxid}})
        return res.json({message: 'Message deleted'})
    } catch(err) {
        console.error(err)
        return res.status(500).json({message: 'Could not access database'})     
    }
}