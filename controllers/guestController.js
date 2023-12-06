require('dotenv').config()
const {body, validationResult} = require('express-validator')
const User = require('../models/userModel')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')


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
      return value !== req.body.password
    })
    .withMessage('Passwords must match'),
  body('bday')
    .trim()
    .escape()
    .isDate().withMessage('Must be valid date'),
  body('fName')
    .trim()
    .escape()
    .isAlpha().withMessage('No special characters'),
  body('lName')
    .trim()
    .escape()
    .isAlpha().withMessage('No special characters'),

    async (req, res, next) => {
      const errors = validationResult(req)

      if (!errors.isEmpty()) {
        return res.status(401).json({errors: errors.array(), message: 'Input validation failed'})
      }

      const {username, email, password, fName, lName, bday } = req.body
      //check if username exists
      const checkUsername = await User.findOne({username: username}).exec()
      if (checkUsername) return res.status(400).json({message: 'Username taken'})

      try {
        const hashed = await bcrypt.hash(password, 10)
        const newUser = new User({
          username,
          email,
          _password : hashed,
          userDetails: {
            fullName: fName + ' ' + lName,
            birthdate: bday,
          }
        })

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
              newUser,
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

exports.guestHome = async (req, res, next) => {

  try {
    const feed = User.find({}, {username: 1, friends: 1, posts: 1, _id: 0})
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