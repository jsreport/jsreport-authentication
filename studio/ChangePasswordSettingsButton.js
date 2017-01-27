import ChangePasswordModal from './ChangePasswordModal.js'
import Studio from 'jsreport-studio'

export default (props) => {
  return Studio.authentication.user.isAdmin ? <span /> : <div>
    <a
      id='changePassword'
      onClick={() => Studio.openModal(ChangePasswordModal, { entity: Studio.authentication.user })}
      style={{cursor: 'pointer'}}><i className='fa fa-key' /> Change password
    </a>
  </div>
}
