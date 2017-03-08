import React, { Component } from 'react'
import ChangePasswordModal from './ChangePasswordModal.js'
import Studio from 'jsreport-studio'

export default class ChangePasswordButton extends Component {
  static propTypes = {
    tab: React.PropTypes.object,
    onUpdate: React.PropTypes.func.isRequired
  }

  render () {
    if (!this.props.tab || !this.props.tab.entity || this.props.tab.entity.__entitySet !== 'users') {
      return <span />
    }

    return <div>
      <div
        className='toolbar-button'
        onClick={(e) => Studio.openModal(ChangePasswordModal, { entity: this.props.tab.entity })}>
        <i className='fa fa-key' /> Change Password
      </div>
    </div>
  }
}
