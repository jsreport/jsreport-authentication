var passwordHash = require('password-hash')
var shortid = require('shortid')
var q = require('q')

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

      delete doc.passwordVerification
      doc.password = passwordHash.generate(doc.password)

      return self.validate(doc)
    })
  })
}

UsersRepository.prototype.validate = function (user) {
  return this.find(user.username).then(function (user) {
    if (user) {
      return q.reject(new Error('User already exists'))
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
  return this.usersCollection.find({shortid: shortid}).then(function (users) {
    var user = users[0]
    if (!currentUser.isAdmin && !passwordHash.verify(oldPassword, user.password)) {
      return q.reject(new Error('Invalid password'))
    }

    return self.usersCollection.update({shortid: shortid}, {$set: {password: passwordHash.generate(newPassword)}})
  })
}
module.exports = UsersRepository
