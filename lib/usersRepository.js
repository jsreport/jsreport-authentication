const passwordHash = require('password-hash')

module.exports = (reporter) => {
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
      const users = await reporter.documentStore.collection('users').find({username: username})
      if (users.length !== 1 || !passwordHash.verify(password, users[0].password)) {
        return null
      }
      return users[0]
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

    async checkFailedLoginAttempts (currentUser, update = true) {
      if (!currentUser || !currentUser.username) {
        return { valid: true }
      }

      let user

      if (currentUser.isAdmin) {
        user = currentUser
      } else {
        user = await reporter.documentStore.collection('users').findOne({ username: currentUser.username })
      }

      if (!user) {
        return { valid: true }
      }

      const failedAttemptsCount = user.failedLoginAttemptsCount || 0
      const failedLoginAttemptsStart = user.failedLoginAttemptsStart || new Date()
      const currentDate = new Date()
      const maxAttempts = 10
      const validRangeTime = 5 * 60 * 1000 // 5 minutes is considered the valid range for failed attempts reset
      const isInRange = (currentDate - failedLoginAttemptsStart) <= validRangeTime

      let newFailedAttemptsCount = failedAttemptsCount + 1
      let newFailedLoginAttemptsStart = failedLoginAttemptsStart
      let result

      if (isInRange) {
        if (newFailedAttemptsCount >= maxAttempts) {
          let timeStr = (validRangeTime - (currentDate - failedLoginAttemptsStart)) / 60000

          if (timeStr > 1) {
            timeStr = `${timeStr.toFixed(1)} minute(s)`
          } else {
            timeStr = timeStr / 1000
            timeStr = `${timeStr.toFixed(1)} second(s)`
          }

          result = { valid: false, message: `Max attempts to login has been reached (${maxAttempts}), login for this user has been locked for ${timeStr}` }
          newFailedAttemptsCount = maxAttempts
        } else {
          result = { valid: true }
        }
      } else {
        result = { valid: true }
        newFailedAttemptsCount = 1
        newFailedLoginAttemptsStart = new Date()
      }

      if (!update) {
        return result
      }

      if (currentUser.isAdmin) {
        user.failedLoginAttemptsCount = newFailedAttemptsCount
        user.failedLoginAttemptsStart = newFailedLoginAttemptsStart
      } else {
        await reporter.documentStore.collection('users').update({
          username: currentUser.username
        }, {
          $set: {
            failedLoginAttemptsCount: newFailedAttemptsCount,
            failedLoginAttemptsStart: newFailedLoginAttemptsStart
          }
        })
      }

      return result
    }
  }
}
