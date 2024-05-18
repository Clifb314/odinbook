const express = require('express')
const router = express.Router()
const inboxController = require('../controllers/inboxController')


//inbox list
router.get('/all', inboxController.inboxList)
//send inbox
router.post('/send', inboxController.sendMsg)

//to find message chain from a friend's page
//use query
router.get('/find', inboxController.findTo)


//mark seen
router.put('/:inboxid/seen', inboxController.markRead)
//delete
router.delete('/:inboxid/delete', inboxController.delMsg)
//message detail, message chain
router.get('/:inboxid', inboxController.messageDetail)


module.exports = router;