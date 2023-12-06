var express = require('express');
var router = express.Router();
const guestControl = require('../controllers/guestController')


//guest homepage
router.get('/home')


//signup
router.post('/signup', guestControl.signup)


module.exports = router;
