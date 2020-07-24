import PropTypes from 'prop-types'
import React, { Component } from 'react'
import ChangePasswordModal from './ChangePasswordModal.js'
import Studio from 'jsreport-studio'

export default class ChangePasswordButton extends Component {
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

ChangePasswordButton.propTypes = {
  tab: PropTypes.object,
  onUpdate: PropTypes.func.isRequired
}
