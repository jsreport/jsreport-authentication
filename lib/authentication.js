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
var BearerStrategy = require('passport-http-bearer').Strategy
var sessions = require('client-sessions')
var request = require('request')
var S = require('string')
var _ = require('underscore')
var url = require('url')
var bodyParser = require('body-parser')
var UsersRepository = require('./usersRepository')
var viewsPath = path.join(__dirname, '../public/views')
var basicSchemaReg = /Basic/i
var bearerSchemaReg = /Bearer/i

function hasBearerSchema (info) {
  if (Array.isArray(info) && info.some(function (item) { return bearerSchemaReg.test(String(item)) })) {
    return true
  }

  return false
}

function shouldDelegateTokenAuth (definition) {
  var options = definition.options
  var tokenValidation
  var endpoint
  var usernameField
  var activeField
  var scope
  var auth
  var hint
  var timeout = 6000
  var sendAsJSON = false

  if (!options.authorizationServer) {
    return false
  }

  if (!options.authorizationServer.tokenValidation) {
    return false
  }

  tokenValidation = options.authorizationServer.tokenValidation

  if (tokenValidation.sendAsJSON === true) {
    sendAsJSON = true
  }

  if (tokenValidation.hint != null) {
    hint = tokenValidation.hint
  }

  if (tokenValidation.endpoint == null) {
    throw new Error(
      'authorizationServer.tokenValidation.endpoint config is required, ' +
      'please pass the url to the token validation endpoint of your authorization server'
    )
  }

  if (
    typeof tokenValidation.endpoint !== 'string' ||
    tokenValidation.endpoint === ''
  ) {
    throw new Error(
      'authorizationServer.tokenValidation.endpoint config has an invalid value, ' +
      'please pass the url to the token validation endpoint of your authorization server'
    )
  }

  endpoint = tokenValidation.endpoint

  if (tokenValidation.timeout != null && typeof tokenValidation.timeout === 'number') {
    timeout = tokenValidation.timeout
  }

  if (
    (tokenValidation.usernameField != null &&
    typeof tokenValidation.usernameField !== 'string') ||
    tokenValidation.usernameField === ''
  ) {
    throw new Error('authorizationServer.tokenValidation.usernameField config has an invalid value')
  }

  if (tokenValidation.usernameField == null) {
    usernameField = 'username'
  } else {
    usernameField = tokenValidation.usernameField
  }

  if (
    (tokenValidation.activeField != null &&
    typeof tokenValidation.activeField !== 'string') ||
    tokenValidation.activeField === ''
  ) {
    throw new Error('authorizationServer.tokenValidation.activeField config has an invalid value')
  }

  if (tokenValidation.activeField == null) {
    activeField = 'active'
  } else {
    activeField = tokenValidation.activeField
  }

  if (tokenValidation.scope != null) {
    if (typeof tokenValidation.scope !== 'object' || (typeof tokenValidation.scope === 'object' && Array.isArray(tokenValidation.scope))) {
      throw new Error('authorizationServer.tokenValidation.scope config has an invalid value')
    }

    scope = {}

    if (tokenValidation.scope.field != null) {
      if (typeof tokenValidation.scope.field !== 'string') {
        throw new Error('authorizationServer.tokenValidation.scope.field config has an invalid value')
      }

      scope.field = tokenValidation.scope.field
    } else {
      scope.field = 'scope'
    }

    if (tokenValidation.scope.valid == null) {
      throw new Error('authorizationServer.tokenValidation.scope.valid config is required when using scope config')
    }

    if (!Array.isArray(tokenValidation.scope.valid)) {
      throw new Error('authorizationServer.tokenValidation.scope.valid config has an invalid value')
    }

    scope.valid = tokenValidation.scope.valid
  }

  if (tokenValidation.auth == null) {
    throw new Error(
      'authorizationServer.tokenValidation.auth config is required by default, pass a correct auth type with your credentials ' +
      'or pass false if you want to disable authentication to the authorization server'
    )
  }

  if (tokenValidation.auth === false) {
    auth = tokenValidation.auth
  } else {
    if (tokenValidation.auth.type !== 'basic' && tokenValidation.auth.type !== 'bearer') {
      throw new Error('authorizationServer.tokenValidation.auth.type config has no value or an invalid one, please use either "basic" or "bearer"')
    }

    auth = {
      type: tokenValidation.auth.type
    }

    if (tokenValidation.auth.type === 'basic') {
      if (tokenValidation.auth.basic == null) {
        throw new Error('authorizationServer.tokenValidation.auth.basic config is required when using authorizationServer.tokenValidation.auth.type === "basic"')
      }

      if (typeof tokenValidation.auth.basic.clientId !== 'string' || tokenValidation.auth.basic.clientId === '') {
        throw new Error('authorizationServer.tokenValidation.auth.basic.clientId config has an invalid value, please pass a valid clientId string')
      }

      if (typeof tokenValidation.auth.basic.clientSecret !== 'string' || tokenValidation.auth.basic.clientSecret === '') {
        throw new Error('authorizationServer.tokenValidation.auth.basic.clientSecret config has an invalid value, please pass a valid clientSecret string')
      }

      auth.credentials = {
        clientId: tokenValidation.auth.basic.clientId,
        clientSecret: tokenValidation.auth.basic.clientSecret
      }
    } else if (tokenValidation.auth.type === 'bearer') {
      if (tokenValidation.auth.bearer == null) {
        throw new Error('authorizationServer.tokenValidation.auth.bearer config is required when using authorizationServer.tokenValidation.auth.type === "bearer"')
      }

      if (
        typeof tokenValidation.auth.bearer !== 'string' ||
        tokenValidation.auth.bearer === ''
      ) {
        throw new Error('authorizationServer.tokenValidation.auth.bearer config has an invalid value, please pass a valid token string')
      }

      auth.credentials = tokenValidation.auth.bearer
    }
  }

  return {
    endpoint: endpoint,
    timeout: timeout,
    sendAsJSON: sendAsJSON,
    hint: hint,
    usernameField: usernameField,
    activeField: activeField,
    scope: scope,
    auth: auth
  }
}

function addPassport (reporter, app, admin, definition) {
  if (app.isAuthenticated) {
    return
  }

  var authorizationServerAuth = shouldDelegateTokenAuth(definition)
  var supportsTokenAuth = (authorizationServerAuth !== false)

  if (supportsTokenAuth) {
    reporter.logger.info('Token based authentication against custom authorization server is enabled')
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

  function authenticateToken (req, token, done) {
    var reqOpts
    var data
    var isBearerAuth
    var credentials
    var jsonRequest = false

    reqOpts = {
      url: authorizationServerAuth.endpoint,
      timeout: authorizationServerAuth.timeout
    }

    data = {}

    if (authorizationServerAuth.hint != null) {
      if (Array.isArray(authorizationServerAuth.hint)) {
        authorizationServerAuth.hint.forEach(function (item) {
          if (item.name) {
            data[String(item.name)] = item.value
          }
        })
      } else if (typeof authorizationServerAuth.hint === 'object') {
        if (authorizationServerAuth.hint.name) {
          data[String(authorizationServerAuth.hint.name)] = authorizationServerAuth.hint.value
        }
      } else {
        data.hint = authorizationServerAuth.hint
      }
    }

    data.token = token
    data['token_type_hint'] = 'access_token'

    if (authorizationServerAuth.sendAsJSON) {
      jsonRequest = true
    }

    if (jsonRequest) {
      reqOpts.body = data
      reqOpts.json = true
    } else {
      reqOpts.form = data
    }

    if (authorizationServerAuth.auth !== false) {
      isBearerAuth = (authorizationServerAuth.auth.type === 'bearer')
      credentials = authorizationServerAuth.auth.credentials

      if (isBearerAuth) {
        reqOpts.auth = {
          bearer: token,
          sendImmediately: true
        }
      } else {
        reqOpts.auth = {
          username: credentials.clientId,
          password: credentials.clientSecret,
          sendImmediately: true
        }
      }
    }

    reporter.logger.debug('Delegating token auth to authorization server at ' + reqOpts.url)

    request.post(reqOpts, function authorizationServerAuthVerify (err, authRes, body) {
      var tokenResponse
      var scopeResponse
      var scopeValid

      if (err) {
        if (err.code === 'ETIMEDOUT' || err.code === 'ESOCKETTIMEDOUT') {
          reporter.logger.error(
            'Timeout Error in authorization server request, no response was sent after ' +
            authorizationServerAuth.timeout +
            ' milliseconds: ' + err.message
          )

          return done(new Error('Timeout error while verifying token'))
        }

        reporter.logger.error('Error in authorization server request: ' + err.message)
        return done(err)
      }

      if (authRes.statusCode !== 200) {
        reporter.logger.error('Authorization server has sent an invalid status code (' + authRes.statusCode + ') in response, token assumed as invalid')
        return done(null, false)
      }

      if (body && typeof body === 'object') {
        tokenResponse = body
      } else {
        try {
          tokenResponse = JSON.parse(body)
        } catch (e) {}
      }

      if (!tokenResponse || (typeof tokenResponse !== 'object' || Array.isArray(tokenResponse))) {
        reporter.logger.error('Authorization server has sent an invalid response, token assumed as invalid')
        return done(null, false)
      }

      if (tokenResponse[authorizationServerAuth.activeField] == null) {
        reporter.logger.error('Authorization server has no "' + authorizationServerAuth.activeField + '" field in its response, token assumed as invalid')
        return done(null, false)
      }

      if (tokenResponse[authorizationServerAuth.activeField] !== true) {
        reporter.logger.error('Authorization server has responded with a non-true value in active field "' + authorizationServerAuth.activeField + '", token assumed as invalid')
        return done(null, false)
      }

      // check for username field presence if the token is active
      if (tokenResponse[authorizationServerAuth.usernameField] == null) {
        reporter.logger.error('Authorization server has no "' + authorizationServerAuth.usernameField + '" field in its response, token assumed as invalid')
        return done(null, false)
      }

      if (typeof tokenResponse[authorizationServerAuth.usernameField] !== 'string' || tokenResponse[authorizationServerAuth.usernameField].trim() === '') {
        reporter.logger.error('Authorization server has responded with an invalid value in username field "' + authorizationServerAuth.usernameField + '", token assumed as invalid')
        return done(null, false)
      }

      // validating scopes if user has configured it
      if (authorizationServerAuth.scope && authorizationServerAuth.scope.valid.length) {
        scopeResponse = tokenResponse[authorizationServerAuth.scope.field]

        if (scopeResponse == null) {
          reporter.logger.error('Authorization server has no "' + authorizationServerAuth.scope.field + '" field in its response, token assumed as invalid')
          return done(null, false)
        }

        if (typeof scopeResponse === 'string') {
          if (authorizationServerAuth.scope.valid.indexOf(scopeResponse) === -1) {
            reporter.logger.error(
              'Authorization server has responded with an invalid scope type: "' +
              scopeResponse +
              '" in scope field "' + authorizationServerAuth.scope.field +
              '", valid scopes are: ' + authorizationServerAuth.scope.valid.join(', ')
            )
            return done(null, false)
          }
        } else if (Array.isArray(scopeResponse)) {
          scopeValid = scopeResponse.some(function (scope) {
            return authorizationServerAuth.scope.valid.indexOf(scope) !== -1
          })

          if (!scopeValid) {
            reporter.logger.error(
              'Authorization server response doesn\'t contain any valid scope type: "' +
              scopeResponse.join(', ') +
              '" in scope field "' + authorizationServerAuth.scope.field +
              '", valid scopes are: ' + authorizationServerAuth.scope.valid.join(', ')
            )
            return done(null, false)
          }
        }
      }

      reporter.logger.debug('Token auth in authorization server was validated correctly')

      if (admin.username === tokenResponse[authorizationServerAuth.usernameField]) {
        req.authServerTokenValidationResponse = tokenResponse
        return done(null, admin)
      }

      reporter.authentication.usersRepository.find(
        tokenResponse[authorizationServerAuth.usernameField]
      ).then(function (user) {
        if (!user) {
          reporter.logger.error('username "' + tokenResponse[authorizationServerAuth.usernameField] + '" returned from authorization server is not a jsreport user')
          return done(null, false)
        }

        req.authServerTokenValidationResponse = tokenResponse
        done(null, user)
      }).catch(function (e) {
        done(e)
      })
    })
  }

  passport.use(new LocalStrategy(authenticate))

  passport.use(new BasicStrategy(authenticate))

  if (supportsTokenAuth) {
    passport.use(new BearerStrategy({ passReqToCallback: true }, authenticateToken))
  }

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
    var apiAuthStrategies = ['basic']
    // api authentication strategies must be stateless "{ session: false }"
    var apiAuthStrategiesOpts = {
      session: false
    }

    if (req.isAuthenticated()) {
      return next()
    }

    if (supportsTokenAuth) {
      apiAuthStrategies.push('bearer')
    }

    passport.authenticate(apiAuthStrategies, apiAuthStrategiesOpts, function (err, user, info) {
      var authSchema = 'Basic'

      if (err) {
        return next(err)
      }

      if (user) {
        // when using a custom callback in `passport.authenticate` we have the
        // responsibility of login the user, in the case of API auth we want to
        // be stateless so we disable saving the session of the user
        // (passing `apiAuthStrategiesOpts`)
        req.logIn(user, apiAuthStrategiesOpts, function () {
          reporter.logger.debug('API logging in user ' + user.username)
          next()
        })
      } else {
        if (!req.headers.authorization) {
          // if no authorization header was sent, defaults to ask for "Basic" auth
          authSchema = 'Basic'
        } else {
          if (
            basicSchemaReg.test(req.headers.authorization) ||
            (!basicSchemaReg.test(req.headers.authorization) && !bearerSchemaReg.test(req.headers.authorization))
          ) {
            // if authorization header is "Basic" or if it is a unknown schema, defaults to ask for "Basic" auth
            authSchema = 'Basic'
          } else if (supportsTokenAuth && hasBearerSchema(info)) {
            // when user auth fails, passport pass information about the Bearer strategy in `info`
            authSchema = 'Bearer'
            req.authSchema = authSchema
          }
        }

        if (req.url.indexOf('/api') > -1 || req.url.indexOf('/odata') > -1) {
          if (req.isPublic) {
            return next()
          }

          res.setHeader('WWW-Authenticate', authSchema + ' realm=\'realm\'')
          return res.status(401).end()
        }

        next()
      }
    })(req, res, next)
  })

  if (supportsTokenAuth) {
    app.post('/api/auth-server/token', function (req, res) {
      reporter.logger.debug('Request for token information (returned from auth server)')

      if (!req.authServerTokenValidationResponse) {
        return res.status(204).end()
      }

      res.status(200).json(req.authServerTokenValidationResponse)
    })
  }
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
        res.setHeader('WWW-Authenticate', (req.authSchema || 'Basic') + ' realm=\'realm\'')
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
