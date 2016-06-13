require('should')
var path = require('path')
var request = require('supertest')
var Reporter = require('jsreport-core').Reporter

describe('authentication', function () {
  var reporter

  beforeEach(function (done) {
    // looks like a current bug in jsreport-express, it should start on random port by default
    process.env.PORT = 0

    reporter = new Reporter({
      rootDirectory: path.join(__dirname, '../'),
      authentication: {
        'cookieSession': {
          'secret': 'foo',
          'cookie': {'domain': 'local.net'}
        },
        admin: {username: 'admin', password: 'password'}
      }
    })

    reporter.init().then(function () {
      done()
    }).fail(done)
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
})

