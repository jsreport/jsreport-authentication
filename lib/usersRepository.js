const passwordHash = require('password-hash')
const shortid = require('shortid')
const Promise = require('bluebird')

module.exports = (reporter) => {
  reporter.documentStore.registerEntityType('UserType', {
    _id: {type: 'Edm.String', key: true},
    shortid: {type: 'Edm.String'},
    username: {type: 'Edm.String'},
    password: {type: 'Edm.String'}
  })
  reporter.documentStore.registerEntitySet('users', {entityType: 'jsreport.UserType', humanReadableKey: 'shortid'})

  reporter.initializeListeners.add('repository', () => {
    reporter.documentStore.collection('users').beforeInsertListeners.add('users', async (doc) => {
      if (!doc.shortid) {
        doc.shortid = shortid.generate()
      }

      if (!doc.username) {
        throw new Error('username is required')
      }

      if (typeof doc.username !== 'string') {
        throw new Error('username has an invalid value')
      }

      // normalizing username to prevent registering a repeated username with spaces
      doc.username = doc.username.trim()

      if (!doc.password) {
        throw new Error('password is required')
      }

      if (typeof doc.password !== 'string') {
        throw new Error('password has an invalid value')
      }

      delete doc.passwordVerification

      doc.password = passwordHash.generate(doc.password)
      const users = await reporter.documentStore.collection('users').find({ username: doc.username })
      if (users.length > 0) {
        throw new Error('User already exists')
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
        return Promise.reject(new Error('Invalid password'))
      }

      if (!password) {
        throw new Error('password is required')
      }

      if (typeof password !== 'string') {
        throw new Error('password has an invalid value')
      }

      password = passwordHash.generate(password)

      return reporter.documentStore.collection('users').update({ shortid: shortid }, { $set: { password: password } })
    }

  }
}
