const passwordHash = require('password-hash')

const maxFailedAttempts = 10

module.exports = (reporter, admin) => {
  reporter.documentStore.registerEntityType('UserType', {
    username: {type: 'Edm.String', publicKey: true},
    password: {type: 'Edm.String', visible: false},
    failedLoginAttemptsCount: {type: 'Edm.Int32', visible: false},
    failedLoginAttemptsStart: {type: 'Edm.DateTimeOffset', visible: false}
  })

  reporter.documentStore.registerEntitySet('users', { entityType: 'jsreport.UserType' })

  reporter.initializeListeners.add('repository', () => {
    reporter.documentStore.collection('users').beforeInsertListeners.add('users', async (doc) => {
      if (!doc.username) {
        throw reporter.createError('username is required', {
          statusCode: 400
        })
      }

      if (typeof doc.username !== 'string') {
        throw reporter.createError('username has an invalid value', {
          statusCode: 400
        })
      }

      // normalizing username to prevent registering a repeated username with spaces
      doc.username = doc.username.trim()

      if (!doc.password) {
        throw reporter.createError('password is required', {
          statusCode: 400
        })
      }

      if (typeof doc.password !== 'string') {
        throw reporter.createError('password has an invalid value', {
          statusCode: 400
        })
      }

      delete doc.passwordVerification

      if (!passwordHash.isHashed(doc.password)) {
        doc.password = passwordHash.generate(doc.password)
      }

      const users = await reporter.documentStore.collection('users').find({ username: doc.username })

      if (users.length > 0) {
        throw reporter.createError('User already exists', {
          statusCode: 409
        })
      }

      return true
    })
  })

  return {
    async authenticate (username, password) {
      let user
      if (admin.username === username) {
        user = admin
      } else {
        user = await reporter.documentStore.collection('users').findOne({username: username})
      }

      if (user == null) {
        return {
          valid: false,
          message: 'Invalid password or user does not exist.'
        }
      }

      const validLogin = user.isAdmin ? user.password === password : passwordHash.verify(password, user.password)
      const lockWindowInterval = 5 * 60 * 1000 // 5 minutes is considered the valid range for failed attempts reset
      const failedLoginAttemptsStart = user.failedLoginAttemptsStart || new Date()
      const currentDate = new Date()
      const isInLockWindow = (currentDate - failedLoginAttemptsStart) <= lockWindowInterval
      const failedAttemptsCount = user.failedLoginAttemptsCount || 0

      let newFailedAttemptsCount
      let newFailedLoginAttemptsStart
      let shouldUpdate

      if (isInLockWindow) {
        if (failedAttemptsCount >= maxFailedAttempts) {
          let secondsToWait = Math.round((lockWindowInterval - (currentDate - failedLoginAttemptsStart)) / 1000)

          return {
            valid: false,
            message: `Max attempts to login has been reached (${maxFailedAttempts}), login for this user has been locked for ${secondsToWait} second(s)`,
            status: 403
          }
        }

        newFailedAttemptsCount = validLogin ? failedAttemptsCount : failedAttemptsCount + 1
        newFailedLoginAttemptsStart = failedLoginAttemptsStart
        shouldUpdate = validLogin !== true
      } else {
        shouldUpdate = true
        newFailedAttemptsCount = validLogin ? 0 : 1
        newFailedLoginAttemptsStart = currentDate
      }

      if (shouldUpdate) {
        if (user.isAdmin) {
          user.failedLoginAttemptsCount = newFailedAttemptsCount
          user.failedLoginAttemptsStart = newFailedLoginAttemptsStart
        } else {
          await reporter.documentStore.collection('users').update({
            username: user.username
          }, {
            $set: {
              failedLoginAttemptsCount: newFailedAttemptsCount,
              failedLoginAttemptsStart: newFailedLoginAttemptsStart
            }
          })
        }
      }

      if (validLogin) {
        return { valid: true, user }
      }

      return {
        valid: false,
        message: 'Invalid password or user does not exist.'
      }
    },

    async find (username) {
      const users = await reporter.documentStore.collection('users').find({username: username})
      if (users.length !== 1) {
        return null
      }

      return users[0]
    },

    async changePassword (currentUser, shortid, oldPassword, newPassword) {
      const users = await reporter.documentStore.collection('users').find({ shortid: shortid })
      const user = users[0]
      let password = newPassword

      if (!currentUser.isAdmin && !passwordHash.verify(oldPassword, user.password)) {
        throw reporter.createError('Invalid password', {
          statusCode: 400
        })
      }

      if (!password) {
        throw reporter.createError('password is required', {
          statusCode: 400
        })
      }

      if (typeof password !== 'string') {
        throw reporter.createError('password has an invalid value', {
          statusCode: 400
        })
      }

      password = passwordHash.generate(password)

      return reporter.documentStore.collection('users').update({ shortid: shortid }, { $set: { password: password } })
    },

    get maxFailedLoginAttempts () {
      return maxFailedAttempts
    }
  }
}
