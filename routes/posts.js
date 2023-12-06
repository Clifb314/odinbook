const express = require('express')
const router = express.Router()
const postController = require('../controllers/postController')


//recent posts and top
router.get('/list/:sorting', postController.postList)

//top posts
//router.get('/top')

//create post
router.post('/post', postController.createPost)

//edit post
router.put('/:postid/edit', postController.editPost)

//delete post
router.delete('/:postid/del', postController.delPost)

//like and dislike
router.put('/:postid/up', postController.likePost)
router.put('/:postid/down', postController.removeLike)

//post details
router.get('/:postid', postController.postDetail)