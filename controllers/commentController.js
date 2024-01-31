const Comments = require('../models/commentModel')
const Posts = require('../models/postModel')
const jwt = require('jsonwebtoken')
const {body, validationResult} = require('express-validator')

exports.createComment = [
    body('content').trim().escape().isLength({min: 3})
      .withMessage('Comment must be at least 3 characters long'),

    async (req, res, next) => {
        const errors = validationResult(req.body)
        if (!errors.isEmpty()) {
          return res.status(401).json({errors: errors.array(), message: 'Input failed validation'})
        }
        const user = jwt.verify(req.token, env.process.SECRET, {issuer: 'CB'})
        try {
            const myCom = new Comments({
                content: req.body.content,
                date: new Date(),
                author: user._id,
                replyTo: req.body.replyTo ? req.body.replyTo : null
            })
            await myCom.save()
            await Posts.findByIdAndUpdate(req.query.postid, {$push: {comments: myCom._id}}).exec()
            return res.json(myCom)  
        } catch(err) {
            console.error(err)
            return res.status(500).json({message: 'Failed to save comment to database'})
        }
    }
]

exports.editComment = [
    body('content').trim().escape().isLength({min: 3})
      .withMessage('Comment must be at least 3 characters long'),

    async (req, res, next) => {
        const errors = validationResult(req.body)
        if (!errors.isEmpty()) return res.status(401).json({errors: errors.array(), message: 'Validation error'})
        try {
            await Comments.findByIdAndUpdate(req.params.commentid, {content: req.body.content}).exec()
            return res.json({message: 'Edit saved to database'})
        } catch(err) {
            console.error(err)
            return res.status(500).json({message: 'Failed to access database'})
        }
    }
]

exports.delComment = async (req, res, next) => {
    try {
        await Comments.findByIdAndDelete(req.params.commentid).exec()
        await Posts.findByIdAndUpdate(req.query.postid, {$pull: {comments: req.params.commentid}}).exec()
        return res.json({message: 'Comment deleted'})
    } catch(err) {
        console.error(err)
        return res.status(500).json({message: 'Failed to access database'})
    }
}

exports.likeComment = async (req, res, next) => {
    try {
        const user = jwt.verify(req.token, process.env.SECRET, {issuer: 'CB'})
        await Comments.findByIdAndUpdate(req.params.commentid, {$push: {likes: user._id}}).exec()
        return res.json({message: "Like saved!"})
    } catch(err) {
        console.log(err)
        return res.status(500).json({message: 'Failed to access database'})
    }
}

exports.dislikeComment = async (req, res, next) => {
    try {
        const user = jwt.verify(req.token, process.env.SECRET, {issuer: 'CB'})
        await Comments.findByIdAndUpdate(req.params.commentid, {$pull: {likes: user._id}}).exec()
        return res.json({message: "Like removed!"})
    } catch(err) {
        console.log(err)
        return res.status(500).json({message: 'Failed to access database'})
    }
}

exports.commentDetail = async (req, res, next) => {
    try {
        const myCom = Comments.findById(req.params.commentid)
          .populate({
            path: 'author',
            select: 'username'
          })
          .exec()
        if (!myCom) return res.status(401).json({message: 'Comment not found'})
        return res.json(myCom)
    } catch(err) {
        console.log(err)
        return res.status(500).json({message: 'Failed to access database'})
    }
}

exports.commentList = async (req, res, next) => {
    try {
        const comList = Posts.findById(req.query.postid, {comments: 1})
          .populate({
            path: 'comments',
            populate: {
                path: 'author',
                select: 'username',
                model: 'userModel'
            },
            populate: {
                path: 'replyTo',
                select: 'author',
                model: 'commentModel',
                populate: {
                    path: 'author',
                    select: 'username',
                    model: 'userModel'
                }

            }
          }).exec()
        if (!comList) return res.status(401).json({message: 'Parent post not found'})
        const output = comList.comments
        if (output.length < 1) return res.status(401).json({message: 'This post has not comments yet'})
        return res.json(output)
    } catch(err) {
        console.log(err)
        return res.status(500).json({message: 'Failed to access database'})
    }
}