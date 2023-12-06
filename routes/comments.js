const express = require('express')
const router = express.Router()

//all comments matching a postid from query string?
//req.query.postid
router.get('/all')

//create comment, also use req.query?
router.post('/post')

//edit comment
router.put('/:commentid/edit')

//delete post
router.delete('/:commentid/del')

//like and dislike
router.put('/:commentid/up')
router.put('/:commentid/down')

//comment details, might not need this
router.get('/:commentid')