require('should')
var path = require('path')
var crypto = require('crypto')
var request = require('supertest')
var cloneDeep = require('lodash.clonedeep')
var Reporter = require('jsreport-core').Reporter
var createAuthServer = require('./authServer')

describe('authentication', function () {
  var reporter

  beforeEach(function () {
    // looks like a current bug in jsreport-express, it should start on random port by default
    process.env.PORT = 0

    reporter = new Reporter({
      rootDirectory: path.join(__dirname, '../'),
      authentication: {
        'cookieSession': {
          'secret': 'foo',
          'cookie': { 'domain': 'local.net' }
        },
        admin: { username: 'admin', password: 'password' }
      }
    })

    return reporter.init()
  })

  it('should respond with login without cookie', function (done) {
    request(reporter.express.app).get('/')
      .end(function (err, res) {
        if (err) {
          return done(err)
        }
        res.text.should.containEql('<h1>jsreport</h1>')
        done()
      })
  })

  it('should pass with auth cookie', function (done) {
    request(reporter.express.app).post('/login')
      .type('form')
      .send({username: 'admin', password: 'password'})
      .end(function (err, res) {
        if (err) {
          return done(err)
        }

        request(reporter.express.app).get('/api/version')
          .set('cookie', res.headers['set-cookie'])
          .expect(200, done)
      })
  })

  it('should 401 when calling api without auth header', function (done) {
    request(reporter.express.app).get('/api/version')
      .expect(401, done)
  })

  it('should 200 when calling api with auth header', function (done) {
    request(reporter.express.app).get('/api/version')
      .set('Authorization', 'Basic ' + new Buffer('admin:password').toString('base64'))
      .expect(200, done)
  })

  it('should 400 when returnUrl is absolute', function (done) {
    request(reporter.express.app).post('/login?returnUrl=https://jsreport.net')
      .type('form')
      .send({username: 'admin', password: 'password'})
      .expect(400, done)
  })
})

describe('authentication with external authorization server', function () {
  it('should throw when not configuring minimum options', function () {
    return setupReporterForAuthServer({
      custom: {
        rootDirectory: path.join(__dirname, '../'),
        authentication: {
          'cookieSession': {
            'secret': 'foo'
          },
          admin: { username: 'admin', password: 'password' },
          authorizationServer: {
            tokenValidation: {}
          }
        }
      }
    }).should.be.rejectedWith(Error)
  })

  describe('when auth server is public', function () {
    var mainToken = crypto.randomBytes(48).toString('hex')

    common({
      authServer: {
        token: {
          value: mainToken,
          username: 'admin'
        }
      }
    })
  })

  describe('when auth server requires authentication', function () {
    var authOptions = {
      type: 'basic',
      basic: {
        clientId: 'client',
        clientSecret: 'xxxx'
      }
    }

    var mainToken = crypto.randomBytes(48).toString('hex')

    common({
      authServer: {
        user: {
          username: 'client',
          password: 'xxxx'
        },
        token: {
          value: mainToken,
          username: 'admin'
        }
      },
      auth: authOptions
    })
  })

  function common (_options) {
    var options = _options || {}
    var originalSetup = options.setup || setupReporterForAuthServer
    var tokenFromAuthServer
    var setup

    if (options.authServer && options.authServer.token) {
      tokenFromAuthServer = options.authServer.token.value
    }

    if (options.auth || options.authServer) {
      setup = function (_originalOpts) {
        if (!_originalOpts) {
          return originalSetup({
            auth: options.auth,
            authServer: options.authServer
          })
        }

        _originalOpts.auth = _originalOpts.auth || cloneDeep(options.auth)
        _originalOpts.authServer = _originalOpts.authServer || cloneDeep(options.authServer)

        return originalSetup(_originalOpts)
      }
    } else {
      setup = originalSetup
    }

    it('should send data as form urlencoded by default', function () {
      return setup({ endpoint: '/reply-body' }).then(function (info) {
        var reporter = info.reporter

        return (
          request(reporter.express.app)
          .post('/api/auth-server/token')
          .set('Authorization', 'Bearer test')
          .expect(200)
          .then(function (response) {
            response.body.isFormEncoded.should.be.True()
            response.body.data.token.should.be.eql('test')
            response.body.data['token_type_hint'].should.be.eql('access_token')
          })
        )
      })
    })

    it('should send data as json', function () {
      return setup({ endpoint: '/reply-body', sendAsJSON: true }).then(function (info) {
        var reporter = info.reporter

        return (
          request(reporter.express.app)
          .post('/api/auth-server/token')
          .set('Authorization', 'Bearer test')
          .expect(200)
          .then(function (response) {
            response.body.isJson.should.be.True()
            response.body.data.token.should.be.eql('test')
            response.body.data['token_type_hint'].should.be.eql('access_token')
          })
        )
      })
    })

    it('should support sending custom values (hints)', function () {
      return setup({
        endpoint: '/reply-body',
        hint: {
          name: 'custom',
          value: 'some value'
        }
      }).then(function (info) {
        var reporter = info.reporter

        return (
          request(reporter.express.app)
          .post('/api/auth-server/token')
          .set('Authorization', 'Bearer test')
          .expect(200)
          .then(function (response) {
            response.body.data.token.should.be.eql('test')
            response.body.data['token_type_hint'].should.be.eql('access_token')
            response.body.data.custom.should.be.eql('some value')
          })
        )
      })
    })

    it('should respond with timeout error when request to auth server takes too long', function () {
      return setup({ endpoint: '/timeout' }).then(function (info) {
        var reporter = info.reporter

        return (
          request(reporter.express.app)
          .post('/api/auth-server/token')
          .set('Authorization', 'Bearer test')
          .expect(500)
          .then(function (response) {
            response.error.text.should.match(/Timeout error/)
          })
        )
      })
    })

    it('should 401 when calling api without auth header', function () {
      return setup().then(function (info) {
        var reporter = info.reporter

        return (
          request(reporter.express.app)
          .post('/api/auth-server/token')
          .expect(401)
        )
      })
    })

    it('should 401 when calling api with invalid token', function () {
      return setup().then(function (info) {
        var reporter = info.reporter

        return (
          request(reporter.express.app)
          .post('/api/auth-server/token')
          .set('Authorization', 'Bearer invalidToken')
          .expect(401)
        )
      })
    })

    it('should 401 when calling api that returns invalid scope', function () {
      return setup({
        endpoint: '/reply-body',
        scope: {
          valid: ['jsreport']
        }
      }).then(function (info) {
        var reporter = info.reporter

        return (
          request(reporter.express.app)
          .post('/api/auth-server/token')
          .set('Authorization', 'Bearer invalidToken')
          .expect(401)
        )
      })
    })

    it('should 200 when calling api with valid token', function () {
      if (!tokenFromAuthServer) {
        throw new Error('no token value found to use in test')
      }

      return setup().then(function (info) {
        var reporter = info.reporter

        return (
          request(reporter.express.app)
          .post('/api/auth-server/token')
          .set('Authorization', 'Bearer ' + tokenFromAuthServer)
          .expect(200)
          .then(function (response) {
            response.body.username.should.be.eql('admin')
            response.body.active.should.be.True()
          })
        )
      })
    })

    it('should 200 when calling api with valid token and custom "username" and "active" field names', function () {
      if (!tokenFromAuthServer) {
        throw new Error('no token value found to use in test')
      }

      return setup({
        usernameField: 'user',
        activeField: 'enabled'
      }).then(function (info) {
        var reporter = info.reporter

        return (
          request(reporter.express.app)
          .post('/api/auth-server/token')
          .set('Authorization', 'Bearer ' + tokenFromAuthServer)
          .expect(200)
          .then(function (response) {
            response.body.user.should.be.eql('admin')
            response.body.enabled.should.be.True()
          })
        )
      })
    })

    it('should 200 when calling api and validating scope', function () {
      if (!tokenFromAuthServer) {
        throw new Error('no token value found to use in test')
      }

      return setup({
        scope: {
          valid: ['jsreport']
        }
      }).then(function (info) {
        var reporter = info.reporter

        return (
          request(reporter.express.app)
          .post('/api/auth-server/token')
          .set('Authorization', 'Bearer ' + tokenFromAuthServer)
          .expect(200)
          .then(function (response) {
            response.body.username.should.be.eql('admin')
            response.body.active.should.be.True()
            response.body.scope.should.matchAny('jsreport')
          })
        )
      })
    })

    it('should 200 when calling api and validating scope with custom field name', function () {
      if (!tokenFromAuthServer) {
        throw new Error('no token value found to use in test')
      }

      return setup({
        scope: {
          field: 'scopeRole',
          valid: ['jsreport']
        }
      }).then(function (info) {
        var reporter = info.reporter

        return (
          request(reporter.express.app)
          .post('/api/auth-server/token')
          .set('Authorization', 'Bearer ' + tokenFromAuthServer)
          .expect(200)
          .then(function (response) {
            response.body.username.should.be.eql('admin')
            response.body.active.should.be.True()
            response.body.scopeRole.should.matchAny('jsreport')
          })
        )
      })
    })
  }

  function setupReporterForAuthServer (_options) {
    var options = _options || {}
    var authServerOpts
    var reporter

    // looks like a current bug in jsreport-express, it should start on random port by default
    process.env.PORT = 0

    var jsreportConfig = {
      rootDirectory: path.join(__dirname, '../'),
      authentication: {
        'cookieSession': {
          'secret': 'foo'
        },
        admin: { username: 'admin', password: 'password' },
        authorizationServer: {
          tokenValidation: {
            timeout: 3000,
            auth: false
          }
        }
      }
    }

    if (options.auth) {
      jsreportConfig.authentication.authorizationServer.tokenValidation.auth = options.auth
    }

    if (options.sendAsJSON) {
      jsreportConfig.authentication.authorizationServer.tokenValidation.sendAsJSON = options.sendAsJSON
    }

    if (options.hint) {
      jsreportConfig.authentication.authorizationServer.tokenValidation.hint = options.hint
    }

    if (options.usernameField) {
      jsreportConfig.authentication.authorizationServer.tokenValidation.usernameField = options.usernameField
    }

    if (options.activeField) {
      jsreportConfig.authentication.authorizationServer.tokenValidation.activeField = options.activeField
    }

    if (options.scope) {
      jsreportConfig.authentication.authorizationServer.tokenValidation.scope = options.scope
    }

    if (options.custom) {
      jsreportConfig = options.custom
    }

    if (options.authServer) {
      if (typeof options.authServer === 'boolean') {
        authServerOpts = {}
      } else {
        authServerOpts = options.authServer
      }
    }

    if (authServerOpts) {
      if (options.usernameField) {
        authServerOpts.usernameField = options.usernameField
      }

      if (options.activeField) {
        authServerOpts.activeField = options.activeField
      }

      if (options.scope) {
        authServerOpts.scope = options.scope
      }
    }

    if (!authServerOpts) {
      reporter = new Reporter(jsreportConfig)

      return reporter.init().then(function () {
        return {
          reporter: reporter
        }
      })
    }

    return createAuthServer(authServerOpts).then(function (authInfo) {
      jsreportConfig.authentication.authorizationServer.tokenValidation.endpoint = (
        'http://localhost:' + authInfo.port + (options.endpoint || '/token/introspection')
      )

      reporter = new Reporter(jsreportConfig)

      return reporter.init().then(function () {
        return {
          reporter: reporter,
          authServer: authInfo
        }
      })
    })
  }
})
