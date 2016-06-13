import React, {Component, PropTypes} from 'react'
import Studio from 'jsreport-studio'

export default class NewUserModal extends Component {
  static propTypes = {
    close: PropTypes.func.isRequired
  }

  constructor () {
    super()
    this.state = {}
  }

  async createUser () {
    if (!this.refs.username.value) {
      return this.setState({ userNameError: true })
    }

    if (!this.refs.password1.value) {
      return this.setState({ passwordError: true })
    }

    try {
      let response = await Studio.api.post('/odata/users', {
        data: {
          username: this.refs.username.value,
          password: this.refs.password1.value
        }
      })
      response.__entitySet = 'users'

      Studio.addExistingEntity(response)
      this.props.close()
    } catch (e) {
      this.setState({ apiError: e.message })
    }
  }

  validatePassword () {
    this.setState(
      {
        passwordError: this.refs.password2.value && this.refs.password2.value !== this.refs.password1.value,
        apiError: null
      })
  }

  validateUsername () {
    this.setState(
      {
        userNameError: this.refs.username.value === '',
        apiError: null
      })
  }

  render () {
    return <div>
      <div className='form-group'>
        <label>Username</label>
        <input type='text' ref='username' onChange={() => this.validateUsername()} />
      </div>
      <div className='form-group'>
        <label>Password</label>
        <input type='password' ref='password1' />
      </div>
      <div className='form-group'>
        <label>Password verification</label>
        <input type='password' ref='password2' onChange={() => this.validatePassword()} />
      </div>
      <div className='form-group'>
        <span style={{color: 'red', display: this.state.passwordError ? 'block' : 'none'}}>password doesn't match</span>
        <span
          style={{color: 'red', display: this.state.userNameError ? 'block' : 'none'}}>username must be filled</span>
        <span style={{color: 'red', display: this.state.apiError ? 'block' : 'none'}}>{this.state.apiError}</span>
      </div>
      <div className='button-bar'>
        <button className='button confirmation' onClick={() => this.createUser()}>ok</button>
      </div>
    </div>
  }
}
