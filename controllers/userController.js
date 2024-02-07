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
  body('password').trim().escape(),
  body('checkPW').trim().escape().custom((value, {req}) => {
    return value === req.body.password 
    }),
  body('oldPW').trim().escape(),

    async (req, res, next) => {
        const errors = validationResult(req.body)
        if (!errors.isEmpty()) return res.status(400).json({message: 'Validation errors', errors: errors.array()})

        try {
            const {username, email, fName, lName, bday, password, checkPW, oldPW} = req.body
            const user = jwt.verify(req.token, process.env.SECRET, {issuer: 'CB'})
            const target = User.findById(user._id).exec()
            if (!target) return res.json({message: 'Access denied or User not found'})
            const match = bcrypt.compare(oldPW, target._password)
            if (!match) return res.json({message: 'Incorrect password'})
            let updatePW
            if (password.length < 1) {
                updatePW = oldPW
            } else {
                updatePW = await bcrypt.hash(password, 10)
            }
            const update = {
                username,
                _password: updatePW,
                userDetails: {
                    fullName: fName + ' ' + lName,
                    birthdate: bday,
                    email,
                }
            }

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


//send request
exports.addFriend = async (req, res, next) => {
    const user = jwt.verify(req.token, process.env.SECRET, {issuer: 'CB'})
    try {  
        //await User.findByIdAndUpdate(user._id, {$push: {friendList: req.params.friendid}}).exec()
        await User.findByIdAndUpdate(req.params.friendid, {$push: {requests: user._id}}).exec()
        await User.findByIdAndUpdate(user._id, {$push: {pending: req.params.friendid}})
        return res.json({message: 'Friends request sent'})
    } catch(err) {
        console.error(err)
        return res.status(500).json({message: 'Unable to update database'})
    }
}

exports.delReq = async (req, res, next) => {
    const user = jwt.verify(req.token, process.env.SECRET, {issuer: 'CB'})
    try {
        await User.findByIdAndUpdate(user._id, {$pull: {requests: req.params.friendid}})
        await User.findByIdAndUpdate(req.params.friendid, {$pull: {pending: user._id}})
    } catch(err) {
        console.error(err)
        return res.status(500).json({message: 'Unable to access database'})
    }
}

exports.rescindReq = async (req, res, next) => {
    const user = jwt.verify(req.token, process.env.SECRET, {issuer: 'CB'})
    try {
        await User.findByIdAndUpdate(req.params.friendid, {$pull: {requests: user._id}})
        await User.findByIdAndUpdate(user._id, {$pull: {pending: req.params.friendid}})
    } catch(err) {
        console.error(err)
        return res.status(500).json({message: 'Unable to access database'})
    }
}

exports.delFriend = async (req, res, next) => {
    const user = jwt.verify(req.token, process.env.SECRET, {issuer: 'CB'})
    try {  
        await User.findByIdAndUpdate(req.params.friendid, {$pull: {requests: user._id}}).exec()
        await User.findByIdAndUpdate(user._id, {$pull: {friends: req.params.friendid}})
        return res.json({message: 'Friends list updated'})
    } catch(err) {
        console.error(err)
        return res.status(500).json({message: 'Unable to update database'})
    }
}

exports.acceptFriend = async (req, res, next) => {
    const user = jwt.verify(req.token, process.env.SECRET, {issuer: 'CB'})
    const {friendid} = req.params
    try {
        await User.findByIdAndUpdate(user._id, 
            {
              $pull: {requests: friendid}, 
              $push: {friendList: friendid}
            }).exec()
        await User.findByIdAndUpdate(friendid, {
            $push: {friendList: user._id},
            $pull: {pending: user._id}
        })
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
        const myUser = await User.findById(req.params.userid, {username: 1, friends: 1, posts: 1, icon: 1})
          .populate({
            path: 'friends',
            select: 'username icon'
          })
          .populate({
            path: 'posts',
            populate: {
                path: 'author comments',
                populate: {
                    path: 'posts.comments.author'
                }
            }

          })
          .exec()
        if (!myUser) return res.status(400).json({message: 'User not found'})
        return res.json(myUser)
    } catch(err) {
        console.error(err)
        res.status(500).json({message: 'Failed to access database'})
    }
}