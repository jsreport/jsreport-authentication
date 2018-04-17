var main = require('./lib/authentication.js')
var config = require('./jsreport.config.js')

module.exports = function (options) {
  config.options = options

  config.optionsSchema = {
    extensions: {
      authentication: {
        type: 'object',
        properties: {
          cookieSession: {
            type: 'object',
            properties: {
              cookie: { type: 'string' },
              secret: { type: 'string' }
            }
          },
          admin: {
            type: 'object',
            properties: {
              username: { type: 'string' },
              password: { type: 'string' }
            }
          },
          authorizationServer: {
            type: 'object',
            properties: {
              tokenValidation: {
                type: 'object',
                properties: {
                  endpoint: { type: 'string' },
                  timeout: { type: 'number' },
                  sendAsJSON: { type: 'boolean' },
                  hint: {
                    oneOf: [{
                      type: 'string'
                    }, {
                      type: 'object'
                    }, {
                      type: 'array',
                      items: { type: 'object' }
                    }]
                  },
                  usernameField: { type: 'string' },
                  activeField: { type: 'string' },
                  scope: {
                    type: 'object',
                    properties: {
                      field: { type: 'string' },
                      valid: { type: 'array', items: { type: 'string' } }
                    }
                  },
                  auth: {
                    type: 'object',
                    properties: {
                      type: { type: 'string', enum: ['basic', 'bearer'] },
                      basic: {
                        type: 'object',
                        properties: {
                          clientId: { type: 'string' },
                          clientSecret: { type: 'string' }
                        }
                      },
                      bearer: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  config.main = main
  config.directory = __dirname
  return config
}
