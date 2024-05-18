const Posts = require('../models/postModel')
const jwt = require('jsonwebtoken')
const User = require('../models/userModel')
const {body, validationResult} = require('express-validator')

exports.createPost = [
    body('title')
      .trim()
      .escape(),
    body('content')
      .trim()
      .escape(),

    async (req, res, next) => {
      const errors = validationResult(req.body)
      if (!errors.isEmpty()) {
        return res.status(401).json({errors: errors.array(), message: 'Input failed validation'})
      }
      const {title, content} = req.body
      try {
          if (!req.token) return res.status(403).json({message: 'Access denied', err: 'Token invalid/expired'})
          const author = jwt.verify(req.token, process.env.SECRET, {issuer: 'CB'})
          const newPost = new Posts({
              author,
              title,
              content,
              date: new Date()
          })
          await newPost.save()
          await User.findByIdAndUpdate(author._id, {$push: {posts: newPost._id}})
          return res.json({message: 'Post saved to database'})
      } catch (err) {
          console.error(err)
          return res.status(500).json({message: "Failed to access database"})
      }
    }
]

exports.editPost = [
  body('title')
    .trim()
    .escape(),
  body('content')
    .trim()
    .escape(),
  
  async (req, res, next) => {
    const errors = validationResult(req.body)
    if (!errors.isEmpty()) {
      return res.status(401).json({errors: errors.array(), message: 'Input failed validation'})
    }
    const { title, content } = req.body
    try {
        const update = {
            title,
            content
        }
        const myPost = await Posts.findByIdAndUpdate(req.params.postid, update, {new: true}).exec()
        if (!myPost) return res.status(401).json({message: 'Post not found'})
        return res.json({message: 'Editted sucessfully', post: myPost})
    } catch(err) {
        console.log(err)
        return res.status(500).json({message: 'Failed to update database'})
    }
  }
]

exports.delPost = async (req, res, next) => {
    try {
      if (!req.token) return res.status(403).json({message: 'Access denied', err: 'Token invalid/expired'})
        const myUser = jwt.verify(req.token, process.env.SECRET, {issuer: 'CB'})
        const myPost = await Posts.findOneAndDelete({_id: req.params.postid, author: myUser._id}).exec()
        if (!myPost) return res.status(401).json({message: 'Post could not be found or user/credentials mismatch'})
        await User.findByIdAndUpdate(myUser._id, {$pull: {posts: req.params.postid}}).exec()
        return res.json({message: 'Post deleted'})
    } catch(err) {
        console.error(err)
        return res.status(500).json({message: 'Failed to delete post'})
    }
}

exports.likePost = async (req, res, next) => {
    try {
      if (!req.token) {return res.status(403).json({message: 'Access denied', err: 'Token invalid/expired'})}
      const myUser = jwt.verify(req.token, process.env.SECRET, {issuer: 'CB'})
      await Posts.findByIdAndUpdate(req.params.postid, {$push: {likes: myUser._id}}).exec()
      return res.json({message: 'Like sent'})
    } catch(err) {
        console.error(err)
        return res.status(500).json({message: 'Failed to send like'})
    }
}

exports.removeLike = async (req, res, next) => {
    try {
      if (!req.token) {return res.status(403).json({message: 'Access denied', err: 'Token invalid/expired'})}
      const myUser = jwt.verify(req.token, process.env.SECRET, {issuer: 'CB'})
      await Posts.findByIdAndUpdate(req.params.postid, {$pull: {likes: myUser._id}}).exec()
      return res.json({message: 'Like removed :('})
    } catch(err) {
        console.error(err)
        return res.status(500).json({message: 'Failed to remove like'})
    }
}

exports.postDetail = async (req, res, next) => {
    try {
        const myPost = await Posts.findById(req.params.postid)
          .populate({
            path: 'comments',
            populate: {
                path: 'author',
                model: 'userModel',
                select: 'username'
            },
            perDocumentLimit: 5,
          })
          .populate({
            path: 'author',
            select: 'username'
          })
          .exec()

          if (!myPost) return res.status(400).json({message: 'Unable to find that post'})
          return res.json(myPost)
    } catch(err) {
        console.error(err)
        return res.status(500).json({message: 'Failed to find Post on database'})
    }
}

exports.postList = async (req, res, next) => {
  try {
    const sorting = req.params.sorting === 'top' ? {'likes': -1} : {'date': -1}
    //want to prioritize friends posts
    //will show top or recents interspersed with friends recent posts
    if (!req.token) {
      const list = await Posts.find({})
      .populate({
        path: 'comments',
        populate: {
            path: 'author',
            model: 'userModel',
            select: 'username icon',
        },
        perDocumentLimit: 5
      })
      .populate({
        path: 'author',
        model: 'userModel',
        select: 'username icon'
      })
      .limit(10)
      .sort(sorting)
      .exec()

      return res.json(list)
    }
    const myUser = jwt.verify(req.token, process.env.SECRET, {issuer: 'CB'})
    console.log(myUser)
    const list = await Posts.find({})
      .populate({
        path: 'comments',
        populate: {
            path: 'author',
            model: 'userModel',
            select: 'username icon',
        },
        perDocumentLimit: 5
      })
      .populate({
        path: 'author',
        model: 'userModel',
        select: 'username icon'
      })
      .limit(10)
      .sort(sorting)
      .exec()
    //find friend's posts
    let params = []
    if (myUser.friends) {
      for (const friend of myUser.friends) {
        params.push({author: friend})
      }
    }
    if (params.legnth > 0) {
      const friendsPosts = await Posts.find({$or: params})
      .populate({
        path: 'comments',
        populate: {
            path: 'author',
            model: 'userModel',
            select: 'username',
        },
        //populate replyTo also
        perDocumentLimit: 5
      })
      .populate({
        path: 'author',
        select: 'username'
      }).limit(10).exec()

      if (friendsPosts.length > 0) {
        list.concat(friendsPosts)
        //shuffle list
        let current = list.length, randomItem
        while (current > 0) {
          randomItem = Math.floor(Math.random() * current)
          current -= 1
          //can apparently do this in one line
          //[list[current], list[rano]] = [list[rand], list[current]]
          let tmp = list[current]
          list[current] = list[randomItem]
          list[randomItem] = tmp
        }
      }
    }


    if (list.length < 0) return res.json({message: "Nothing's here.."})
    return res.json(list)
 
  } catch(err) {
    console.error(err)
    if (err.TokenExpiredError) return res.status(403).json({
      message: `token expired at ${err.expiredAt}`,
      forceLogOut: true,
    })
    else return res.status(500).json({message: 'Unable to access database'})
  }
}
