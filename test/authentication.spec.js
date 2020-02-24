process.env.debug = 'jsreport'
require('should')
const path = require('path')
const crypto = require('crypto')
const request = require('supertest')
const cloneDeep = require('lodash.clonedeep')
const jsreport = require('jsreport-core')
const createAuthServer = require('./authServer')

describe('authentication', () => {
  let reporter

  beforeEach(() => {
    reporter = jsreport({
      rootDirectory: path.join(__dirname, '../'),
      extensions: {
        authentication: {
          'cookieSession': {
            'secret': 'foo',
            'cookie': { 'domain': 'local.net' }
          },
          admin: { username: 'admin', password: 'password' }
        }
      }
    })

    return reporter.init()
  })

  afterEach(() => reporter.close())

  it('should respond with login without cookie', () => {
    return request(reporter.express.app)
      .get('/')
      .expect(/<h1>jsreport<\/h1>/)
  })

  it('should pass with auth cookie', async () => {
    const res = await request(reporter.express.app).post('/login')
      .type('form')
      .send({username: 'admin', password: 'password'})

    return request(reporter.express.app).get('/api/version')
      .set('cookie', res.headers['set-cookie'])
      .expect(200)
  })

  it('should 401 when calling api without auth header', () => {
    return request(reporter.express.app).get('/api/version')
      .expect(401)
  })

  it('should 200 when calling api with auth header', () => {
    return request(reporter.express.app).get('/api/version')
      .set('Authorization', 'Basic ' + Buffer.from('admin:password').toString('base64'))
      .expect(200)
  })

  it('should 400 when returnUrl is absolute', () => {
    return request(reporter.express.app).post('/login?returnUrl=https://jsreport.net')
      .type('form')
      .send({username: 'admin', password: 'password'})
      .expect(400)
  })

  it('should add the req.context.user', () => {
    return new Promise((resolve, reject) => {
      reporter.documentStore.collection('templates').beforeFindListeners.add('test', this, (q, proj, req) => {
        if (!req.context.user || !req.context.user.username) {
          return reject(new Error('req.context.user not set'))
        }
        resolve()
      })

      request(reporter.express.app).get('/odata/templates')
        .set('Authorization', 'Basic ' + Buffer.from('admin:password').toString('base64'))
        .expect(200).catch(reject)
    })
  })
})

describe('authentication with external authorization server', () => {
  it('should throw when not configuring minimum options', () => {
    return setupReporterForAuthServer({
      custom: {
        rootDirectory: path.join(__dirname, '../'),
        extensions: {
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
      }
    }).should.be.rejectedWith(Error)
  })

  describe('when auth server is public', () => {
    const mainToken = crypto.randomBytes(48).toString('hex')

    common({
      authServer: {
        token: {
          value: mainToken,
          username: 'admin'
        }
      }
    })
  })

  describe('when auth server requires authentication', () => {
    const authOptions = {
      type: 'basic',
      basic: {
        clientId: 'client',
        clientSecret: 'xxxx'
      }
    }

    const mainToken = crypto.randomBytes(48).toString('hex')

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
    let options = _options || {}
    let originalSetup = options.setup || setupReporterForAuthServer
    let tokenFromAuthServer
    let setup

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

    it('should send data as form urlencoded by default', async () => {
      const { reporter } = await setup({ endpoint: '/reply-body' })

      const response = await request(reporter.express.app)
        .post('/api/auth-server/token')
        .set('Authorization', 'Bearer test')
        .expect(200)

      response.body.isFormEncoded.should.be.True()
      response.body.data.token.should.be.eql('test')
      response.body.data['token_type_hint'].should.be.eql('access_token')
    })

    it('should send data as json', async () => {
      const { reporter } = await setup({ endpoint: '/reply-body', sendAsJSON: true })

      const response = await request(reporter.express.app)
        .post('/api/auth-server/token')
        .set('Authorization', 'Bearer test')
        .expect(200)

      response.body.isJson.should.be.True()
      response.body.data.token.should.be.eql('test')
      response.body.data['token_type_hint'].should.be.eql('access_token')
    })

    it('should support sending custom values (hints)', async () => {
      const { reporter } = await setup({
        endpoint: '/reply-body',
        hint: {
          name: 'custom',
          value: 'some value'
        }
      })

      const response = await request(reporter.express.app)
        .post('/api/auth-server/token')
        .set('Authorization', 'Bearer test')
        .expect(200)

      response.body.data.token.should.be.eql('test')
      response.body.data['token_type_hint'].should.be.eql('access_token')
      response.body.data.custom.should.be.eql('some value')
    })

    it('should respond with timeout error when request to auth server takes too long', async () => {
      const { reporter } = await setup({ endpoint: '/timeout' })
      const response = await request(reporter.express.app)
        .post('/api/auth-server/token')
        .set('Authorization', 'Bearer test')
        .expect(500)
      response.error.text.should.match(/timeout/)
    })

    it('should 401 when calling api without auth header', async () => {
      const { reporter } = await setup()
      return request(reporter.express.app)
        .post('/api/auth-server/token')
        .expect(401)
    })

    it('should 401 when calling api with invalid token', async () => {
      const { reporter } = await setup()

      return request(reporter.express.app)
        .post('/api/auth-server/token')
        .set('Authorization', 'Bearer invalidToken')
        .expect(401)
    })

    it('should 401 when calling api that returns invalid scope', async () => {
      const { reporter } = await setup({
        endpoint: '/reply-body',
        scope: {
          valid: ['jsreport']
        }
      })

      return request(reporter.express.app)
        .post('/api/auth-server/token')
        .set('Authorization', 'Bearer invalidToken')
        .expect(401)
    })

    it('should 200 when calling api with valid token', async () => {
      if (!tokenFromAuthServer) {
        throw new Error('no token value found to use in test')
      }

      const { reporter } = await setup()

      const response = await request(reporter.express.app)
        .post('/api/auth-server/token')
        .set('Authorization', 'Bearer ' + tokenFromAuthServer)
        .expect(200)

      response.body.username.should.be.eql('admin')
      response.body.active.should.be.True()
    })

    it('should 200 when calling api with valid token and custom "username" and "active" field names', async () => {
      if (!tokenFromAuthServer) {
        throw new Error('no token value found to use in test')
      }

      const { reporter } = await setup({
        usernameField: 'user',
        activeField: 'enabled'
      })

      const response = await
        request(reporter.express.app)
          .post('/api/auth-server/token')
          .set('Authorization', 'Bearer ' + tokenFromAuthServer)
          .expect(200)

      response.body.user.should.be.eql('admin')
      response.body.enabled.should.be.True()
    })

    it('should 200 when calling api and validating scope', async () => {
      if (!tokenFromAuthServer) {
        throw new Error('no token value found to use in test')
      }

      const { reporter } = await setup({
        scope: {
          valid: ['jsreport']
        }
      })

      const response = await request(reporter.express.app)
        .post('/api/auth-server/token')
        .set('Authorization', 'Bearer ' + tokenFromAuthServer)
        .expect(200)

      response.body.username.should.be.eql('admin')
      response.body.active.should.be.True()
      response.body.scope.should.matchAny('jsreport')
    })

    it('should 200 when calling api and validating scope with custom field name', async () => {
      if (!tokenFromAuthServer) {
        throw new Error('no token value found to use in test')
      }

      const { reporter } = await setup({
        scope: {
          field: 'scopeRole',
          valid: ['jsreport']
        }
      })

      const response = await request(reporter.express.app)
        .post('/api/auth-server/token')
        .set('Authorization', 'Bearer ' + tokenFromAuthServer)
        .expect(200)

      response.body.username.should.be.eql('admin')
      response.body.active.should.be.True()
      response.body.scopeRole.should.matchAny('jsreport')
    })
  }

  async function setupReporterForAuthServer (_options) {
    const options = _options || {}
    var authServerOpts
    let reporter

    // looks like a current bug in jsreport-express, it should start on random port by default
    process.env.PORT = 0

    let jsreportConfig = {
      rootDirectory: path.join(__dirname, '../'),
      extensions: {
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
    }

    if (options.auth) {
      jsreportConfig.extensions.authentication.authorizationServer.tokenValidation.auth = options.auth
    }

    if (options.sendAsJSON) {
      jsreportConfig.extensions.authentication.authorizationServer.tokenValidation.sendAsJSON = options.sendAsJSON
    }

    if (options.hint) {
      jsreportConfig.extensions.authentication.authorizationServer.tokenValidation.hint = options.hint
    }

    if (options.usernameField) {
      jsreportConfig.extensions.authentication.authorizationServer.tokenValidation.usernameField = options.usernameField
    }

    if (options.activeField) {
      jsreportConfig.extensions.authentication.authorizationServer.tokenValidation.activeField = options.activeField
    }

    if (options.scope) {
      jsreportConfig.extensions.authentication.authorizationServer.tokenValidation.scope = options.scope
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
      reporter = jsreport(jsreportConfig)

      await reporter.init()
      return {
        reporter: reporter
      }
    }

    const authInfo = await createAuthServer(authServerOpts)
    jsreportConfig.extensions.authentication.authorizationServer.tokenValidation.endpoint = (
      'http://localhost:' + authInfo.port + (options.endpoint || '/token/introspection')
    )

    reporter = jsreport(jsreportConfig)

    await reporter.init()
    return {
      reporter: reporter,
      authServer: authInfo
    }
  }
})
