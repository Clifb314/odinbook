var express = require('express');
var router = express.Router();
const userController = require('../controllers/userController')

/* GET users listing. */


//login
router.post('/login', userController.login)

//upload icon
router.post('/icon', userController.uploadIcon)


//home page
router.get('/home')

//friends list
router.get('/friends', userController.friendList)
//add/del friend
router.put('/friends/add/:friendid', userController.addFriend)
router.put('/friends/delete/friendid', userController.delFriend)

//account
router.get('/account', userController.accountPage)
//edit
router.put('/account/', userController.editAcct)
//link google
router.get('/auth/google', userController.googleAuth)

//user detail page
router.get('/:userid')

module.exports = router;
