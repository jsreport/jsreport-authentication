
var Promise = require('bluebird')
var Passport = require('passport').Passport
var BasicStrategy = require('passport-http').BasicStrategy
var express = require('express')
var bodyParser = require('body-parser')
var passport = new Passport()

module.exports = function createAuthServer (_options) {
  var options = _options || {}
  var app = express()
  var mainUser
  var mainToken
  var mainTokenUsername
  var usernameField = options.usernameField || 'username'
  var activeField = options.activeField || 'active'

  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(bodyParser.json())

  if (options.token) {
    mainToken = options.token.value
    mainTokenUsername = options.token.username
  }

  // require authentication for endpoints when user options was specified
  if (options.user) {
    mainUser = options.user

    app.use(passport.initialize())

    passport.use(new BasicStrategy(function (username, password, done) {
      if (username === mainUser.username && password === mainUser.password) {
        return done(null, mainUser)
      }

      return done(null, false)
    }))

    app.use('/', passport.authenticate('basic', { session: false }))
  }

  app.post('/reply-body', function (req, res) {
    var isUrlEncoded = req.is('urlencoded')
    var isJson = req.is('json')

    isUrlEncoded = (isUrlEncoded === 'urlencoded') ? true : isUrlEncoded
    isJson = (isJson === 'json') ? true : isJson

    var payload = {
      isFormEncoded: isUrlEncoded,
      isJson: isJson,
      data: req.body
    }

    payload[activeField] = true
    payload[usernameField] = 'admin'

    res.status(200).json(payload)
  })

  app.post('/timeout', function (req, res) {
    var payload = {}

    setTimeout(function () {
      payload[activeField] = true
      payload[usernameField] = 'admin'

      res.status(200).json(payload)
    }, 10000)
  })

  app.post('/token/introspection', function (req, res) {
    if (!mainToken) {
      return res.status(500).end()
    }

    var payload = {}
    var isValid = (mainToken === req.body.token)

    payload[activeField] = isValid

    if (isValid) {
      payload[usernameField] = mainTokenUsername
    }

    res.status(200).json(payload)
  })

  app.use(function (err, req, res, next) {
    console.error('final error handler in auth server:', err)
    res.status(500).end()
  })

  return new Promise(function (resolve, reject) {
    var isServerBound = false

    // start on random port
    app.listen(0, function () {
      isServerBound = true

      resolve({
        port: this.address().port,
        app: app
      })
    })

    app.on('error', function (err) {
      if (!isServerBound) {
        app.close(function () {
          reject(err)
        })
      }
    })
  })
}
