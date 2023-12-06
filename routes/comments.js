const express = require('express')
const router = express.Router()
const commentController = require('../controllers/commentController')

//all comments matching a postid from query string?
//req.query.postid
router.get('/all')

//create comment, also use req.query?
router.post('/post', commentController.createComment)

//edit comment
router.put('/:commentid/edit', commentController.editComment)

//delete post
router.delete('/:commentid/del', commentController.delComment)

//like and dislike
router.put('/:commentid/up')
router.put('/:commentid/down')

//comment details, might not need this
router.get('/:commentid')