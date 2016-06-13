import React, { Component } from 'react'

export default class LogoutSettingsButton extends Component {
  render () {
    return <div>
      <div
        onClick={() => this.refs.logout.click()} style={{ cursor: 'pointer' }}>
        <form method='POST' action='/logout'>
          <input ref='logout' type='submit' id='logoutBtn' style={{ display: 'none' }} />
        </form>
        <i className='fa fa-power-off' /> Logout
      </div>
    </div>
  }
}
