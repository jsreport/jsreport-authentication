/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _UserEditor = __webpack_require__(1);
	
	var _UserEditor2 = _interopRequireDefault(_UserEditor);
	
	var _LogoutSettingsButton = __webpack_require__(5);
	
	var _LogoutSettingsButton2 = _interopRequireDefault(_LogoutSettingsButton);
	
	var _ChangePasswordSettingsButton = __webpack_require__(6);
	
	var _ChangePasswordSettingsButton2 = _interopRequireDefault(_ChangePasswordSettingsButton);
	
	var _ChangePasswordButton = __webpack_require__(7);
	
	var _ChangePasswordButton2 = _interopRequireDefault(_ChangePasswordButton);
	
	var _jsreportStudio = __webpack_require__(4);
	
	var _jsreportStudio2 = _interopRequireDefault(_jsreportStudio);
	
	var _NewUserModal = __webpack_require__(8);
	
	var _NewUserModal2 = _interopRequireDefault(_NewUserModal);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }
	
	// we want to be at the front, because other extension like scheduling relies on loaded user
	_jsreportStudio2.default.initializeListeners.unshift(_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
	  var response;
	  return regeneratorRuntime.wrap(function _callee$(_context) {
	    while (1) {
	      switch (_context.prev = _context.next) {
	        case 0:
	          _context.next = 2;
	          return _jsreportStudio2.default.api.get('/api/settings');
	
	        case 2:
	          response = _context.sent;
	
	          if (response.tenant) {
	            _context.next = 5;
	            break;
	          }
	
	          return _context.abrupt('return');
	
	        case 5:
	
	          _jsreportStudio2.default.authentication = { user: response.tenant, useEditorComponents: [] };
	
	          if (_jsreportStudio2.default.authentication.user.isAdmin) {
	            _jsreportStudio2.default.addEntitySet({
	              name: 'users',
	              faIcon: 'fa-user',
	              visibleName: 'user',
	              nameAttribute: 'username',
	              onNew: function onNew() {
	                return _jsreportStudio2.default.openModal(_NewUserModal2.default);
	              },
	              entityTreePosition: 200
	            });
	            _jsreportStudio2.default.addEditorComponent('users', _UserEditor2.default);
	            _jsreportStudio2.default.addToolbarComponent(_ChangePasswordButton2.default);
	          }
	
	          _jsreportStudio2.default.addToolbarComponent(_ChangePasswordSettingsButton2.default, 'settings');
	          _jsreportStudio2.default.addToolbarComponent(function () {
	            return React.createElement(
	              'div',
	              { className: 'toolbar-button' },
	              React.createElement(
	                'span',
	                null,
	                React.createElement('i', {
	                  className: 'fa fa-user' }),
	                ' ',
	                _jsreportStudio2.default.authentication.user.username
	              )
	            );
	          }, 'settingsBottom');
	          _jsreportStudio2.default.addToolbarComponent(_LogoutSettingsButton2.default, 'settingsBottom');
	
	        case 10:
	        case 'end':
	          return _context.stop();
	      }
	    }
	  }, _callee, undefined);
	})));

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	var _react = __webpack_require__(2);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _ChangePasswordModal = __webpack_require__(3);
	
	var _ChangePasswordModal2 = _interopRequireDefault(_ChangePasswordModal);
	
	var _jsreportStudio = __webpack_require__(4);
	
	var _jsreportStudio2 = _interopRequireDefault(_jsreportStudio);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	var DataEditor = function (_Component) {
	  _inherits(DataEditor, _Component);
	
	  function DataEditor() {
	    _classCallCheck(this, DataEditor);
	
	    return _possibleConstructorReturn(this, (DataEditor.__proto__ || Object.getPrototypeOf(DataEditor)).apply(this, arguments));
	  }
	
	  _createClass(DataEditor, [{
	    key: 'componentDidMount',
	    value: function componentDidMount() {
	      if (this.props.entity.__isNew && !this.props.entity.password) {
	        _jsreportStudio2.default.openModal(_ChangePasswordModal2.default, { entity: this.props.entity });
	      }
	    }
	  }, {
	    key: 'render',
	    value: function render() {
	      var _props = this.props,
	          entity = _props.entity,
	          onUpdate = _props.onUpdate;
	
	
	      return _react2.default.createElement(
	        'div',
	        { className: 'custom-editor' },
	        _react2.default.createElement(
	          'h1',
	          null,
	          _react2.default.createElement('i', { className: 'fa fa-user' }),
	          ' ',
	          entity.username
	        ),
	        _react2.default.createElement(
	          'div',
	          null,
	          _jsreportStudio2.default.authentication.useEditorComponents.map(function (c, i) {
	            return _react2.default.createElement(
	              'div',
	              { key: i },
	              c(entity, onUpdate)
	            );
	          })
	        )
	      );
	    }
	  }]);
	
	  return DataEditor;
	}(_react.Component);
	
	exports.default = DataEditor;
	
	
	DataEditor.propTypes = {
	  entity: _react2.default.PropTypes.object.isRequired,
	  onUpdate: _react2.default.PropTypes.func.isRequired
	};

/***/ },
/* 2 */
/***/ function(module, exports) {

	module.exports = Studio.libraries['react'];

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	var _react = __webpack_require__(2);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _jsreportStudio = __webpack_require__(4);
	
	var _jsreportStudio2 = _interopRequireDefault(_jsreportStudio);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	var ChangePasswordModal = function (_Component) {
	  _inherits(ChangePasswordModal, _Component);
	
	  function ChangePasswordModal() {
	    _classCallCheck(this, ChangePasswordModal);
	
	    var _this = _possibleConstructorReturn(this, (ChangePasswordModal.__proto__ || Object.getPrototypeOf(ChangePasswordModal)).call(this));
	
	    _this.state = {};
	    return _this;
	  }
	
	  _createClass(ChangePasswordModal, [{
	    key: 'changePassword',
	    value: function () {
	      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
	        var entity, close, data;
	        return regeneratorRuntime.wrap(function _callee$(_context) {
	          while (1) {
	            switch (_context.prev = _context.next) {
	              case 0:
	                entity = this.props.options.entity;
	                close = this.props.close;
	                _context.prev = 2;
	                data = {
	                  newPassword: this.refs.newPassword1.value
	                };
	
	
	                if (!_jsreportStudio2.default.authentication.user.isAdmin) {
	                  data.oldPassword = this.refs.oldPassword.value;
	                }
	
	                _context.next = 7;
	                return _jsreportStudio2.default.api.post('/api/users/' + entity.shortid + '/password', { data: data });
	
	              case 7:
	                this.refs.newPassword1.value = '';
	                this.refs.newPassword2.value = '';
	                close();
	                _context.next = 15;
	                break;
	
	              case 12:
	                _context.prev = 12;
	                _context.t0 = _context['catch'](2);
	
	                this.setState({ apiError: _context.t0.message });
	
	              case 15:
	              case 'end':
	                return _context.stop();
	            }
	          }
	        }, _callee, this, [[2, 12]]);
	      }));
	
	      function changePassword() {
	        return _ref.apply(this, arguments);
	      }
	
	      return changePassword;
	    }()
	  }, {
	    key: 'validatePassword',
	    value: function validatePassword() {
	      this.setState({
	        passwordError: this.refs.newPassword2.value && this.refs.newPassword2.value !== this.refs.newPassword1.value,
	        apiError: null
	      });
	    }
	  }, {
	    key: 'render',
	    value: function render() {
	      var _this2 = this;
	
	      return _react2.default.createElement(
	        'div',
	        null,
	        _jsreportStudio2.default.authentication.user.isAdmin ? '' : _react2.default.createElement(
	          'div',
	          { className: 'form-group' },
	          _react2.default.createElement(
	            'label',
	            null,
	            'old password'
	          ),
	          _react2.default.createElement('input', { type: 'password', ref: 'oldPassword' })
	        ),
	        _react2.default.createElement(
	          'div',
	          { className: 'form-group' },
	          _react2.default.createElement(
	            'label',
	            null,
	            'new password'
	          ),
	          _react2.default.createElement('input', { type: 'password', ref: 'newPassword1' })
	        ),
	        _react2.default.createElement(
	          'div',
	          { className: 'form-group' },
	          _react2.default.createElement(
	            'label',
	            null,
	            'new password verification'
	          ),
	          _react2.default.createElement('input', { type: 'password', ref: 'newPassword2', onChange: function onChange() {
	              return _this2.validatePassword();
	            } })
	        ),
	        _react2.default.createElement(
	          'div',
	          { className: 'form-group' },
	          _react2.default.createElement(
	            'span',
	            { style: { color: 'red', display: this.state.passwordError ? 'block' : 'none' } },
	            'password doesn\'t match'
	          ),
	          _react2.default.createElement(
	            'span',
	            { style: { color: 'red', display: this.state.apiError ? 'block' : 'none' } },
	            this.state.apiError
	          )
	        ),
	        _react2.default.createElement(
	          'div',
	          { className: 'button-bar' },
	          _react2.default.createElement(
	            'button',
	            { className: 'button confirmation', onClick: function onClick() {
	                return _this2.changePassword();
	              } },
	            'ok'
	          )
	        )
	      );
	    }
	  }]);
	
	  return ChangePasswordModal;
	}(_react.Component);
	
	exports.default = ChangePasswordModal;
	
	
	ChangePasswordModal.propTypes = {
	  close: _react.PropTypes.func.isRequired,
	  options: _react.PropTypes.object.isRequired
	};

/***/ },
/* 4 */
/***/ function(module, exports) {

	module.exports = Studio;

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	var _react = __webpack_require__(2);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _jsreportStudio = __webpack_require__(4);
	
	var _jsreportStudio2 = _interopRequireDefault(_jsreportStudio);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	var LogoutSettingsButton = function (_Component) {
	  _inherits(LogoutSettingsButton, _Component);
	
	  function LogoutSettingsButton() {
	    _classCallCheck(this, LogoutSettingsButton);
	
	    return _possibleConstructorReturn(this, (LogoutSettingsButton.__proto__ || Object.getPrototypeOf(LogoutSettingsButton)).apply(this, arguments));
	  }
	
	  _createClass(LogoutSettingsButton, [{
	    key: 'render',
	    value: function render() {
	      var _this2 = this;
	
	      return _react2.default.createElement(
	        'div',
	        null,
	        _react2.default.createElement(
	          'div',
	          {
	            onClick: function onClick() {
	              return _this2.refs.logout.click();
	            }, style: { cursor: 'pointer' } },
	          _react2.default.createElement(
	            'form',
	            { method: 'POST', action: _jsreportStudio2.default.resolveUrl('/logout') },
	            _react2.default.createElement('input', { ref: 'logout', type: 'submit', id: 'logoutBtn', style: { display: 'none' } })
	          ),
	          _react2.default.createElement('i', { className: 'fa fa-power-off' }),
	          ' Logout'
	        )
	      );
	    }
	  }]);
	
	  return LogoutSettingsButton;
	}(_react.Component);
	
	exports.default = LogoutSettingsButton;

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _ChangePasswordModal = __webpack_require__(3);
	
	var _ChangePasswordModal2 = _interopRequireDefault(_ChangePasswordModal);
	
	var _jsreportStudio = __webpack_require__(4);
	
	var _jsreportStudio2 = _interopRequireDefault(_jsreportStudio);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	exports.default = function (props) {
	  return _jsreportStudio2.default.authentication.user.isAdmin ? React.createElement('span', null) : React.createElement(
	    'div',
	    null,
	    React.createElement(
	      'a',
	      {
	        id: 'changePassword',
	        onClick: function onClick() {
	          return _jsreportStudio2.default.openModal(_ChangePasswordModal2.default, { entity: _jsreportStudio2.default.authentication.user });
	        },
	        style: { cursor: 'pointer' } },
	      React.createElement('i', { className: 'fa fa-key' }),
	      ' Change password'
	    )
	  );
	};

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	var _react = __webpack_require__(2);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _ChangePasswordModal = __webpack_require__(3);
	
	var _ChangePasswordModal2 = _interopRequireDefault(_ChangePasswordModal);
	
	var _jsreportStudio = __webpack_require__(4);
	
	var _jsreportStudio2 = _interopRequireDefault(_jsreportStudio);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	var ChangePasswordButton = function (_Component) {
	  _inherits(ChangePasswordButton, _Component);
	
	  function ChangePasswordButton() {
	    _classCallCheck(this, ChangePasswordButton);
	
	    return _possibleConstructorReturn(this, (ChangePasswordButton.__proto__ || Object.getPrototypeOf(ChangePasswordButton)).apply(this, arguments));
	  }
	
	  _createClass(ChangePasswordButton, [{
	    key: 'render',
	    value: function render() {
	      var _this2 = this;
	
	      if (!this.props.tab || !this.props.tab.entity || this.props.tab.entity.__entitySet !== 'users') {
	        return _react2.default.createElement('span', null);
	      }
	
	      return _react2.default.createElement(
	        'div',
	        null,
	        _react2.default.createElement(
	          'div',
	          {
	            className: 'toolbar-button',
	            onClick: function onClick(e) {
	              return _jsreportStudio2.default.openModal(_ChangePasswordModal2.default, { entity: _this2.props.tab.entity });
	            } },
	          _react2.default.createElement('i', { className: 'fa fa-key' }),
	          ' Change Password'
	        )
	      );
	    }
	  }]);
	
	  return ChangePasswordButton;
	}(_react.Component);
	
	exports.default = ChangePasswordButton;
	
	
	ChangePasswordButton.propTypes = {
	  tab: _react2.default.PropTypes.object,
	  onUpdate: _react2.default.PropTypes.func.isRequired
	};

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	var _react = __webpack_require__(2);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _jsreportStudio = __webpack_require__(4);
	
	var _jsreportStudio2 = _interopRequireDefault(_jsreportStudio);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	var NewUserModal = function (_Component) {
	  _inherits(NewUserModal, _Component);
	
	  function NewUserModal() {
	    _classCallCheck(this, NewUserModal);
	
	    var _this = _possibleConstructorReturn(this, (NewUserModal.__proto__ || Object.getPrototypeOf(NewUserModal)).call(this));
	
	    _this.state = {};
	    return _this;
	  }
	
	  _createClass(NewUserModal, [{
	    key: 'createUser',
	    value: function () {
	      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
	        var response;
	        return regeneratorRuntime.wrap(function _callee$(_context) {
	          while (1) {
	            switch (_context.prev = _context.next) {
	              case 0:
	                if (this.refs.username.value) {
	                  _context.next = 2;
	                  break;
	                }
	
	                return _context.abrupt('return', this.setState({ userNameError: true }));
	
	              case 2:
	                if (this.refs.password1.value) {
	                  _context.next = 4;
	                  break;
	                }
	
	                return _context.abrupt('return', this.setState({ passwordError: true }));
	
	              case 4:
	                _context.prev = 4;
	                _context.next = 7;
	                return _jsreportStudio2.default.api.post('/odata/users', {
	                  data: {
	                    username: this.refs.username.value,
	                    password: this.refs.password1.value
	                  }
	                });
	
	              case 7:
	                response = _context.sent;
	
	                response.__entitySet = 'users';
	
	                _jsreportStudio2.default.addExistingEntity(response);
	                this.props.close();
	                _context.next = 16;
	                break;
	
	              case 13:
	                _context.prev = 13;
	                _context.t0 = _context['catch'](4);
	
	                this.setState({ apiError: _context.t0.message });
	
	              case 16:
	              case 'end':
	                return _context.stop();
	            }
	          }
	        }, _callee, this, [[4, 13]]);
	      }));
	
	      function createUser() {
	        return _ref.apply(this, arguments);
	      }
	
	      return createUser;
	    }()
	  }, {
	    key: 'validatePassword',
	    value: function validatePassword() {
	      this.setState({
	        passwordError: this.refs.password2.value && this.refs.password2.value !== this.refs.password1.value,
	        apiError: null
	      });
	    }
	  }, {
	    key: 'validateUsername',
	    value: function validateUsername() {
	      this.setState({
	        userNameError: this.refs.username.value === '',
	        apiError: null
	      });
	    }
	  }, {
	    key: 'render',
	    value: function render() {
	      var _this2 = this;
	
	      return _react2.default.createElement(
	        'div',
	        null,
	        _react2.default.createElement(
	          'div',
	          { className: 'form-group' },
	          _react2.default.createElement(
	            'label',
	            null,
	            'Username'
	          ),
	          _react2.default.createElement('input', { type: 'text', ref: 'username', onChange: function onChange() {
	              return _this2.validateUsername();
	            } })
	        ),
	        _react2.default.createElement(
	          'div',
	          { className: 'form-group' },
	          _react2.default.createElement(
	            'label',
	            null,
	            'Password'
	          ),
	          _react2.default.createElement('input', { type: 'password', ref: 'password1' })
	        ),
	        _react2.default.createElement(
	          'div',
	          { className: 'form-group' },
	          _react2.default.createElement(
	            'label',
	            null,
	            'Password verification'
	          ),
	          _react2.default.createElement('input', { type: 'password', ref: 'password2', onChange: function onChange() {
	              return _this2.validatePassword();
	            } })
	        ),
	        _react2.default.createElement(
	          'div',
	          { className: 'form-group' },
	          _react2.default.createElement(
	            'span',
	            { style: { color: 'red', display: this.state.passwordError ? 'block' : 'none' } },
	            'password doesn\'t match'
	          ),
	          _react2.default.createElement(
	            'span',
	            {
	              style: { color: 'red', display: this.state.userNameError ? 'block' : 'none' } },
	            'username must be filled'
	          ),
	          _react2.default.createElement(
	            'span',
	            { style: { color: 'red', display: this.state.apiError ? 'block' : 'none' } },
	            this.state.apiError
	          )
	        ),
	        _react2.default.createElement(
	          'div',
	          { className: 'button-bar' },
	          _react2.default.createElement(
	            'button',
	            { className: 'button confirmation', onClick: function onClick() {
	                return _this2.createUser();
	              } },
	            'ok'
	          )
	        )
	      );
	    }
	  }]);
	
	  return NewUserModal;
	}(_react.Component);
	
	exports.default = NewUserModal;
	
	
	NewUserModal.propTypes = {
	  close: _react.PropTypes.func.isRequired
	};

/***/ }
/******/ ]);