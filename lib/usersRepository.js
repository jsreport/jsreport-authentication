const passwordHash = require('password-hash')

module.exports = (reporter) => {
  reporter.documentStore.registerEntityType('UserType', {
    username: {type: 'Edm.String', publicKey: true},
    password: {type: 'Edm.String', visible: false}
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
    }

  }
}
