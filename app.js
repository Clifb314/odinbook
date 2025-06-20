const express = require('express');
const createError = require('http-errors')
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors')
require('dotenv').config()

//mongoose setup
const mongoose = require('mongoose')
const myDB = process.env.MONGODB
const depreciatedDBopts = {useUnifiedTopology: true, useNewUrlParser: true}
mongoose.connect(myDB)
const db = mongoose.connection
db.on('error', console.error.bind(console, 'mongo connection error'))


//passport setup
const User = require('./models/userModel')
const passport = require('passport')
const gStrat = require('passport-google-oauth20').Strategy
const fbStrat = require('passport-facebook').Strategy
const localStrat = require('passport-local').Strategy
const jwtStrat = require('passport-jwt').Strategy
const extractJWT = require('passport-jwt').ExtractJwt
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')


passport.use(new localStrat(async (username, password, done) => {
  try {
    const myUser = await User.findOne({username})
    .populate({
      path: 'friends',
      select: 'icon username'
    })
    .populate({
      path: 'requests',
      select: 'icon username'
    })
    .populate({
      path: 'pending',
      select: 'icon username'
    })
    .populate({
      path: 'inbox',
      select: 'seen'
    })
    .exec()
    if (!myUser) return done(null, false, 'User not found')

    bcrypt.compare(password, myUser._password, (err, res) => {
      if (res) {
        myUser._password = "It's a secret"
        return done(null, myUser)
      }
      else return done(null, false, {message: 'Password incorrect'})
    })

  } catch(err) {
    return done(null, false, {message: 'internal server error'})
  }
}))

passport.use(
  new gStrat({
    clientID: process.env.gClientID,
    clientSecret: process.env.gSECRET,
    callbackURL: '/api/auth/oauth2/redirect/google',
    scope: ['profile', 'email'],
    // 'http://localhost:3001/api/auth/oauth2/redirect/google',
    passReqToCallback: true
    },
    async function (accessToken, refreshToken, profile, done) {
      console.log('strat triggered')
      console.log(req.userPayload)
      try {
        const findUser = User.findOne({username: {$in: [profile.displayName, req.userPayload]}}).exec()
        if (findUser) {
          //update account here

          
        }
        console.log(findUser)
        console.log(profile)
        return done(null, profile)
      } catch(err) {
        return done(err, false)
      }
  }
))

const options = {
  jwtFromRequest: extractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.SECRET,
  issuer: 'CB'
}

passport.use(new jwtStrat(options, function(payload, done) {
  return done(null, payload)
}))



// passport.use(new fbStrat({
//   clientID: process.env.FBAPPID,
//   clientSecret: process.env.FBSECRET,
//   callbackURL: 'https://www.example.com/oauth2/redirect/facebook',
// },
//   function(accessToken, refreshToken, profile, cb) {
//    return done(null, profile)
//   }
// ))


const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const postRouter = require('./routes/posts')
const commentRouter = require('./routes/comments')
const inboxRouter = require('./routes/inbox')

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors())

app.use(function(req, res, next) {
  const bearerHeader = req.headers.authorization
  if (bearerHeader) {
    const tokenArr = bearerHeader.split(' ')
    req.token = tokenArr[1]
  }
  next()
})

app.use(async function(req, res, next) {
  try {
    const user = jwt.verify(req.token, process.env.SECRET, {issuer: 'CB'})
    req.userPayload = user
    next()
  } catch(err) {
    console.log('Caught expired token')
    req.token = null
    next()
  }
})


app.use('/api', indexRouter);
app.use('/api/auth', usersRouter);
app.use('/api/posts', postRouter)
app.use('/api/comments', commentRouter)
app.use('/api/inbox', inboxRouter)



// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
  });
  
// error handler
app.use(function(err, req, res, next) {
// set locals, only providing error in development
res.locals.message = err.message;
res.locals.error = req.app.get('env') === 'development' ? err : {};
console.log(err.message)

// render the error page || this is a server, so return error message/json
res.status(err.status || 500);
res.json({err})
//res.render('error');
});

app.listen(process.env.PORT || 5001, () => {
console.log(`Server started on port ${process.env.PORT || 5000}`);
});

module.exports = app;
