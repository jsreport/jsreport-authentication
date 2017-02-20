/*!
 * Copyright(c) 2014 Jan Blaha
 *
 * Extension used for authenticating user. When the extension is enabled user needs to specify
 * credentials before the jsreport will serve the request.
 *
 * Browser requests are authenticated using cookie.
 * API requests are authenticated using basic auth.
 */

var path = require('path')
var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy
var BasicStrategy = require('passport-http').BasicStrategy
var sessions = require('client-sessions')
var S = require('string')
var _ = require('underscore')
var url = require('url')
var bodyParser = require('body-parser')
var UsersRepository = require('./usersRepository')
var viewsPath = path.join(__dirname, '../public/views')

function addPassport (reporter, app, admin, definition) {
  if (app.isAuthenticated) {
    return
  }

  app.use(sessions({
    cookieName: 'session',
    cookie: definition.options.cookieSession.cookie,
    secret: definition.options.cookieSession.secret,
    duration: 1000 * 60 * 60 * 24 * 365 * 10 // forever
  }))

  app.use(passport.initialize())
  app.use(passport.session())

  function authenticate (username, password, done) {
    if (admin.username === username && admin.password === password) {
      return done(null, admin)
    }

    reporter.authentication.usersRepository.authenticate(username, password).then(function (user) {
      if (!user) {
        return done(null, false, {message: 'Invalid password or user does not exists.'})
      }

      return done(null, user)
    }).catch(function (e) {
      done(null, false, {message: e.message})
    })
  }

  passport.use(new LocalStrategy(authenticate))

  passport.use(new BasicStrategy(authenticate))

  passport.serializeUser(function (user, done) {
    done(null, user.username)
  })

  passport.deserializeUser(function (id, done) {
    if (id === admin.username) {
      return done(null, admin)
    }

    reporter.authentication.usersRepository.find(id).then(function (user) {
      done(null, user)
    }).catch(function (e) {
      done(e)
    })
  })

  app.get('/login', function (req, res, next) {
    if (!req.user) {
      var viewModel = _.extend({}, req.session.viewModel || {})
      req.session.viewModel = null
      return res.render(path.join(viewsPath, 'login.html'), {
        viewModel: viewModel,
        options: reporter.options
      })
    } else {
      next()
    }
  })

  app.post('/login', bodyParser.urlencoded({extended: true, limit: '2mb'}), function (req, res, next) {
    req.session.viewModel = req.session.viewModel || {}

    passport.authenticate('local', function (err, user, info) {
      if (err) {
        return next(err)
      }

      if (!user) {
        req.session.viewModel.login = info.message
        return res.redirect(reporter.options.appPath + '?returnUrl=' + encodeURIComponent(req.query.returnUrl || '/'))
      }

      req.session.viewModel = {}
      req.logIn(user, function (err) {
        if (err) {
          return next(err)
        }

        req.user = user
        reporter.logger.info('Logging in user ' + user.username)

        return res.redirect(decodeURIComponent(req.query.returnUrl) || '/')
      })
    })(req, res, next)
  })

  app.post('/logout', function (req, res) {
    req.logout()
    res.redirect(reporter.options.appPath)
  })

  app.use(function (req, res, next) {
    if (req.isAuthenticated()) {
      return next()
    }

    passport.authenticate('basic', function (err, user, info) {
      if (err) {
        return next(err)
      }

      if (user) {
        req.logIn(user, function () {
          reporter.logger.debug('API logging in user ' + user.username)
          next()
        })
      } else {
        if (req.url.indexOf('/api') > -1 || req.url.indexOf('/odata') > -1) {
          if (req.isPublic) {
            return next()
          }
          res.setHeader('WWW-Authenticate', 'Basic realm=\'realm\'')
          return res.status(401).end()
        }

        next()
      }
    })(req, res, next)
  })
}

function configureRoutes (reporter, app, admin, definition) {
  app.use(function (req, res, next) {
    var publicRoute = _.find(reporter.authentication.publicRoutes, function (r) {
      return S(req.url).startsWith(r)
    })

    var pathname = url.parse(req.url).pathname

    req.isPublic = publicRoute || S(pathname).endsWith('.js') || S(pathname).endsWith('.css')
    next()
  })

  addPassport(reporter, app, admin, definition)

  app.use(function (req, res, next) {
    if (req.isAuthenticated() || req.isPublic) {
      return next()
    }

    var viewModel = _.extend({}, req.session.viewModel || {})
    req.session.viewModel = null

    return res.render(path.join(viewsPath, 'login.html'), {
      viewModel: viewModel,
      options: reporter.options
    })
  })

  app.use(function (req, res, next) {
    if (!reporter.authorization || req.isPublic) {
      return next()
    }

    reporter.authorization.authorizeRequest(req, res).then(function (result) {
      if (result) {
        return next()
      }

      if (req.url.indexOf('/api') > -1 || req.url.indexOf('/odata') > -1) {
        res.setHeader('WWW-Authenticate', 'Basic realm=\'realm\'')
        return res.status(401).end()
      }

      return res.redirect('/login')
    }).catch(function (e) {
      next(e)
    })
  })

  app.post('/api/users/:shortid/password', function (req, res, next) {
    reporter.authentication.usersRepository.changePassword(req.user, req.params.shortid, req.body.oldPassword, req.body.newPassword).then(function (user) {
      res.send({result: 'ok'})
    }).catch(function (e) {
      next(e)
    })
  })

  app.get('/api/current-user', function (req, res, next) {
    res.send({username: req.user.username})
  })
}

function Authentication (reporter) {
  this.publicRoutes = [
    '/?studio=embed', '/css', '/img', '/js', '/lib', '/html-templates',
    '/api/recipe', '/api/engine', '/api/settings', '/favicon.ico', '/api/extensions', '/odata/settings']

  this.usersRepository = new UsersRepository(reporter)

  if (reporter.compilation) {
    reporter.compilation.resourceInTemp('login.html', path.join(__dirname, '../public/views/login.html'))
  }

  viewsPath = reporter.execution ? reporter.execution.tempDirectory : viewsPath
}

module.exports = function (reporter, definition) {
  if (!definition.options.admin) {
    definition.options.enabled = false
    return
  }

  definition.options.admin.name = definition.options.admin.username
  definition.options.admin.isAdmin = true

  reporter.authentication = new Authentication(reporter)

  reporter.on('export-public-route', function (route) {
    reporter.authentication.publicRoutes.push(route)
  })

  reporter.on('after-express-static-configure', function (app) {
    app.engine('html', require('ejs').renderFile)

    reporter.emit('before-authentication-express-routes', app)
    configureRoutes(reporter, app, definition.options.admin, definition)
    // avoid exposing secrets and admin password through /api/extensions
    definition.options = {}
    reporter.emit('after-authentication-express-routes', app)
  })
}
