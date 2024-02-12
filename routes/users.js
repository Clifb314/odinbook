var express = require('express');
var router = express.Router();
const userController = require('../controllers/userController')

/* GET users listing. */


//login
router.post('/login', userController.login)

//upload icon
router.post('/icon', userController.uploadIcon)

//userlist
router.get('/userlist', userController.userList)

//home page
router.get('/home', userController.accountPage)

//friends list
router.get('/friends', userController.friendList)
//add/del friend
router.put('/add/:friendid', userController.addFriend)
router.put('/delete/:friendid', userController.delFriend)
router.put('/delreq/:friendid', userController.delReq)
router.put('/rescreq/:friendid', userController.rescindReq)
router.put('/accept/:friendid', userController.acceptFriend)

//account
router.get('/account', userController.accountPage)
//edit
router.put('/account/', userController.editAcct)
//link google
router.get('/google', userController.googleAuth)

//user detail page
router.get('/:userid', userController.userDetail)

//send/update icon
router.put('/icon/edit', userController.editIcon)
router.get('/icon', userController.sendIcon)
router.get('/icon/:id', userController.sendUserIcon)



module.exports = router;
