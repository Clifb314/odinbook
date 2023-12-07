const express = require('express')
const router = express.Router()
const inboxController = require('../controllers/inboxController')


//inbox list
router.get('/all', inboxController.inboxList)
//send inbox
router.post('/send', inboxController.sendMsg)

//mark seen
router.put('/:inboxid/seen', inboxController.markRead)
//message detail
router.get('/:inboxid', inboxController.messageDetail)