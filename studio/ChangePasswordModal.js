import React, {Component, PropTypes} from 'react'
import Studio from 'jsreport-studio'

export default class ChangePasswordModal extends Component {
  static propTypes = {
    close: PropTypes.func.isRequired,
    options: PropTypes.object.isRequired
  }

  constructor () {
    super()
    this.state = {}
  }

  async changePassword () {
    const { entity } = this.props.options
    const { close } = this.props

    try {
      let data = {
        newPassword: this.refs.newPassword1.value
      }

      if (!Studio.authentication.user.isAdmin) {
        data.oldPassword = this.refs.oldPassword.value
      }

      await Studio.api.post(`/api/users/${entity.shortid}/password`, { data: data })
      this.refs.newPassword1.value = ''
      this.refs.newPassword2.value = ''
      close()
    } catch (e) {
      this.setState({ apiError: e.message })
    }
  }

  validatePassword () {
    this.setState(
      {
        passwordError: this.refs.newPassword2.value && this.refs.newPassword2.value !== this.refs.newPassword1.value,
        apiError: null
      })
  }

  render () {
    return <div>
      {Studio.authentication.user.isAdmin ? '' : <div className='form-group'>
        <label>old password</label>
        <input type='password' ref='oldPassword' />
      </div>
      }
      <div className='form-group'>
        <label>new password</label>
        <input type='password' ref='newPassword1' />
      </div>
      <div className='form-group'>
        <label>new password verification</label>
        <input type='password' ref='newPassword2' onChange={() => this.validatePassword()} />
      </div>
      <div className='form-group'>
        <span style={{color: 'red', display: this.state.passwordError ? 'block' : 'none'}}>password doesn't match</span>
        <span style={{color: 'red', display: this.state.apiError ? 'block' : 'none'}}>{this.state.apiError}</span>
      </div>
      <div className='button-bar'>
        <button className='button confirmation' onClick={() => this.changePassword()}>ok</button>
      </div>
    </div>
  }
}
