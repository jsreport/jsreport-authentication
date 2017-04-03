var passwordHash = require('password-hash')
var shortid = require('shortid')
var Promise = require('bluebird')

function UsersRepository (reporter) {
  var self = this

  this.reporter = reporter

  this.UserType = this.reporter.documentStore.registerEntityType('UserType', {
    _id: {type: 'Edm.String', key: true},
    shortid: {type: 'Edm.String'},
    username: {type: 'Edm.String'},
    password: {type: 'Edm.String'}
  })

  this.reporter.documentStore.registerEntitySet('users', {entityType: 'jsreport.UserType', humanReadableKey: 'shortid'})

  this.reporter.initializeListeners.add('repository', function () {
    var col = self.usersCollection = self.reporter.documentStore.collection('users')

    col.beforeInsertListeners.add('users', function (doc) {
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

      return self.validate(doc)
    })
  })
}

UsersRepository.prototype.validate = function (user) {
  return this.find(user.username).then(function (user) {
    if (user) {
      return Promise.reject(new Error('User already exists'))
    }

    return true
  })
}

UsersRepository.prototype.authenticate = function (username, password) {
  return this.usersCollection.find({username: username}).then(function (users) {
    if (users.length !== 1 || !passwordHash.verify(password, users[0].password)) {
      return null
    }
    return users[0]
  })
}

UsersRepository.prototype.find = function (username) {
  return this.usersCollection.find({username: username}).then(function (users) {
    if (users.length !== 1) {
      return null
    }

    return users[0]
  })
}

UsersRepository.prototype.changePassword = function (currentUser, shortid, oldPassword, newPassword) {
  var self = this

  return this.usersCollection.find({ shortid: shortid }).then(function (users) {
    var user = users[0]
    var password = newPassword

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

    return self.usersCollection.update({ shortid: shortid }, { $set: { password: password } })
  })
}

module.exports = UsersRepository
