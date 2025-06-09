require('dotenv').config()
const {body, validationResult} = require('express-validator')
const User = require('../models/userModel')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const fs = require('node:fs/promises')

//multer setup for icon/file mgmt
const multer = require('multer')
const path = require('node:path')
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './icons')
  },
  filename: (req, file, cb) => {
    const extension = file.originalname.split('.')
    cb(null, req.userPayload._id + '-icon.' + extension[1])
  }
})

const upload = multer({storage})


exports.signup = [
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
  body("password").trim().escape(),
  //keep password requirements off for initial testing
  // .isStrongPassword({
  //   minLength: 8,
  //   minLowercase: 1,
  //   minUppercase: 1,
  //   minNumbers: 1,
  //   minSymbols: 1,
  // })
  // .withMessage("Please review password requirements")
  body("checkPW")
    .trim()
    .escape()
    .custom(async (value, { req }) => {
      return value === req.body.password
    })
    .withMessage('Passwords must match'),
  body('bday')
    .trim()
    .escape()
    .isISO8601().withMessage('Must be valid date'),
  body('fName')
    .trim()
    .escape()
    .isLength({min: 1}).withMessage('First name is required')
    .isAlpha().withMessage('No special characters'),
  body('lName')
    .trim()
    .escape()
    .isLength({min: 1}).withMessage('Last name is required')
    .isAlpha().withMessage('No special characters'),

    async (req, res, next) => {
      const errors = validationResult(req)

      if (!errors.isEmpty()) {
        return res.status(401).json({errors: errors.array(), message: 'Input validation failed'})
      }

      const { username, email, password, fName, lName, bday } = req.body
      //check if username exists
      const checkUsername = await User.findOne({username: username}).exec()
      if (checkUsername) return res.status(400).json({message: 'Username taken'})
      console.log(req.body)
      console.log(email)
      try {
        const hashed = await bcrypt.hash(password, 10)
        const newUser = new User({
          username,
          _password : hashed,
          userDetails: {
            fullName: fName + ' ' + lName,
            birthdate: bday,
            email,
          }
        })
        console.log(newUser)
        await newUser.save()
        const payload = {
          _id: newUser._id,
          username: newUser.username,
        }
        jwt.sign(payload,
          process.env.SECRET,
          {issuer: 'CB', expiresIn: '15m'},
          (err, token) => {
            if (err) return next(err)
            return res.json({
              token,
              user: {_id: newUser._id, username: newUser.username},
              message: 'Logged in'})
          }
        )
      } catch(err) {
        console.error(err)
        return res.status(500).json({message: 'Could not save new user to database'})
      }

      //from here, create a fb account or local account?


    }
]

exports.signupIcon = [
  //pass icon and user._id to update after signup finishes
  

  upload.single('icon'),

  async (req, res, next) => {
    console.log(req.body.userid)
    try {
      const user = User.findById(req.body.userid).exec()
      if (!user) return res.status(500).json({err: 'Could not find user'})
      user.icon = req.file.filename
      await user.save()
      return res.json({message: 'Icon saved'})
    } catch(err) {
      console.error(err)
      return res.status(500).json({err, message: 'Failed to add icon'})
    }

  }
  
]

exports.guestHome = async (req, res, next) => {

  try {
    const feed = await User.find({}, {username: 1, friends: 1, posts: 1})
      .populate({
        path: 'posts',
        select: 'title content date',
      })
    
    if (feed.length < 0) return res.json({message: "Uh oh! There's nothing here.."})
    else return res.json(feed)
  } catch(err) {
    console.error(err)
    return res.status(500).json({message: 'Could not access database'})
  }
}