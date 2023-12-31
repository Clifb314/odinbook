require('dotenv')
const passport = require("passport");
const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");


//multer setup for profile icons
const multer = require('multer')
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'icons')
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now())
  }
})

const upload = multer({storage})


exports.login = [
    body('username').trim().escape(),
    body('password').trim().escape(),

    async (req, res, next) => {
        passport.authenticate('local', {session: false}, (err, user) => {
            if (err || !user) {
                return res.status(401).json({err, message: 'Incorrect username or password'})
            }
            jwt.sign({
                _id: user._id,
                username: user.username,
                googleID: user.googleAcct.id
                },
            process.env.SECRET,
            {expiresIn: '15m', issuer: 'CB'},
            (err, token) => {
                res.json({
                    token,
                    user,
                    message: 'Signed in'
                })
            }
            )
        })(req, res)
    }
]

exports.googleAuth = async (req, res, next) => {
    //i think this has to go in passport.use in app.js. will review
    const user = jwt.verify(req.token, process.env.SECRET, {issuer: 'CB'})
    if (!user) return res.status(401).json({message: 'Must be logged in to link google account'})
    passport.authenticate('google', {scope: ['profile'], session: false}, async (err, profile) => {
        if (err || !profile) return res.status(401).json({
            err,
            message: 'Google account not found'
        })
        console.log(profile)
        const update = {
            displayName: profile.displayName,
            id: profile.id,
            coverPhoto: profile.coverPhoto
        }
        const myUser = await User.findByIdAndUpdate(user._id, {googleAcct: update}, {new: true}).exec()
        if (!myUser) return res.json(update)
        return res.json(myUser)
    })
}


exports.accountPage = async (req, res, next) => {
    try {
        const user = jwt.verify(req.token, process.env.SECRET, {issuer: 'CB'})
        const myUser = User.findById(user._id, {_password: 0}).exec()

        if (!myUser) return res.status(400).json({message: 'User not found'})
        else return res.json(myUser)

        } catch(err) {
            console.error(err)
            return res.status(500).json({message: 'Unable to access database'})
        }
}


exports.editAcct = [
    //validate
  body("username", "Username must be at least 3 characters")
    .trim()
    .escape()
    .isLength({ min: 3 })
    .isAlphanumeric()
    .withMessage("Username: No Special Characters"),
  body("email")
    .trim()
    .escape()
    .isEmail()
    .withMessage("Please enter valid email"),
    body("fName", "First name must be at least 3 characters")
    .trim()
    .escape()
    .isLength({ min: 3 })
    .isAlpha()
    .withMessage("No Special Characters"),
  body("lName", "Last name must be at leasst 3 characters")
    .trim()
    .escape()
    .isAlpha()
    .isLength({min: 3})
    .withMessage("No Special characters"),
    body("bday", "Please enter a valid date")
    .isDate(),

    async (req, res, next) => {
        const errors = validationResult(req.body)
        if (!errors.isEmpty()) return res.status(400).json({message: 'Validation errors', errors: errors.array()})

        try {
            const {username, email, fName, lName, bday} = req.body
            const update = {
                username,
                userDetails: {
                    fullName: fName + ' ' + lName,
                    birthdate: bday,
                    email,
                }
            }
            const user = jwt.verify(req.token, process.env.SECRET, {issuer: 'CB'})
            const push = User.findByIdAndUpdate(user._id, update, {new: true}).exec()
            return res.json(push)
        } catch(err) {
            console.error(err)
            return res.json({message: 'Error updating user'})
        }

    }
]



exports.friendList = async (req, res, next) => {
    try {
        const user = jwt.verify(req.token, process.env.SECRET, {issuer: 'CB'})
        const friends = await User.findById(user._id, 'friends')
        .populate({
            path: 'friends',
            select: 'username'
        })
        .sort({username: 1})
        .exec()
        
        if (friends.length < 1) return res.json({message: 'friends list is empty'})
        else return res.json(friends)
        

    } catch(err) {
        console.error(err)
        return res.status(500).json({message: 'Error accessing database'})
    }
}

exports.userList = async (req, res, next) => {
    try {
        const users = User.find({}, {username: 1, icon: 1}).lean().sort('-username').exec()
        if (users.length < 1) return res.json({message: 'database is empty!'})
        return res.json(users)
    } catch (err) {
        console.error(err)
        return res.status(500).json({message: 'Unable to update database'}) 
    }
}

exports.addFriend = async (req, res, next) => {
    const user = jwt.verify(req.token, process.env.SECRET, {issuer: 'CB'})
    try {  
        await User.findByIdAndUpdate(user._id, {$push: {friendList: req.params.friendid}}).exec()
        return res.json({message: 'Friends list updated'})
    } catch(err) {
        console.error(err)
        return res.status(500).json({message: 'Unable to update database'})
    }
}

exports.delFriend = async (req, res, next) => {
    const user = jwt.verify(req.token, process.env.SECRET, {issuer: 'CB'})
    try {  
        await User.findByIdAndUpdate(req.params.friendid, {$pull: {requests: user._id}}).exec()
        return res.json({message: 'Friends list updated'})
    } catch(err) {
        console.error(err)
        return res.status(500).json({message: 'Unable to update database'})
    }
}

exports.acceptFriend = async (req, res, next) => {
    const user = jwt.verify(req.token, process.env.SECRET, {issuer: 'CB'})
    try {
        await User.findByIdAndUpdate(user._id, 
            {
              $pull: {requests: req.params.friendid}, 
              $push: {friendList: req.params.friendid}
            }).exec()
        await User.findByIdAndUpdate(req.params.friendid, {$push: {friendList: user._id}})
        return res.json({message: 'Friend request accepted'})
    } catch(err) {
        console.error(err)
        return res.status(500).json({message: 'Unable to update database'})
    }
}

exports.uploadIcon = async (req, res, next) => {
    const user = jwt.verify(req.token, process.env.SECRET, {issuer: 'CB'})
    if (!user) return res.status(403).json({message: "Access denied"})

    try {
        upload.single(user.username)
        const icon = {
            data: fs.readFileSync(path.join(__dirname + '/icons/' + req.file.filename)),
            contentType: 'image/png'
        }
        await User.findByIdAndUpdate(user._id, icon).exec()
        res.json({message: 'Upload successful'})

    } catch(err) {
        console.error(err)
        res.status(500).json({message: 'Failed to upload image'})
    }
}

exports.userDetail = async (req, res, next) => {
    const user = jwt.verify(req.token, process.env.SECRET, {issuer: 'CB'})
    if (!user) return res.status(403).json({message: "Access denied"})
    try {
        const myUser = await User.findById(req.params.userid, {username: 1, friends: 1})
          .populate({
            path: 'friends',
            select: 'username'
          })
          .exec()
        if (!myUser) return res.status(400).json({message: 'User not found'})
        return res.json(myUser)
    } catch(err) {
        console.error(err)
        res.status(500).json({message: 'Failed to access database'})
    }
}