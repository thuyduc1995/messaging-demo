import React, { Component } from "react";
import { connect } from "react-redux";
import { MessageOutlined, ArrowRightOutlined } from '@ant-design/icons'
import MessageContainer from 'components/Message/MessageContainer'
import Protobuf from 'protobuf/message_pb.js'
import { v4 as uuid } from 'uuid';
import { Modal } from 'antd';
import { actions } from 'redux/home'
import { actions as callActions } from 'redux/call'
import CallModal from '../../components/Call'
import './home.scss'
import '../../components/Input/input.css'


class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      visible: false,
      callingName: ''
    }
  }
  handleInputUsername = (event) => {
    this.setState({ username: event.target.value })
  }

  handleClickCall = (username) => {
    this.setState({
      visible: true,
      callingName: username
    });
  };

  handleOk = e => {
    const target = this.state.callingName
    this.setState({
      visible: false,
      callingName: ''
    }, () => this.props.call(target));
  };

  handleCancel = e => {
    this.setState({
      visible: false,
      callingName: ''
    });
  };

  handlePress = (event) => {
    if (event.key === 'Enter') {
      const { username } = this.state;
      if (username && username !== '') {
        this.props.login(username)
      }
    }
  };

  test = () => {
    var message = new Protobuf.CommunicationPayload()
    const currentTimestamp = Date.now()
    const channelId = uuid()
    const joinVoiceCall = new Protobuf.JoinVoiceCall()
    const endBroadcast = new Protobuf.EndBroadcast()
    joinVoiceCall.setMuted(false)
    endBroadcast.setCallId('abc')
    message.setEpoch(currentTimestamp)
    message.setChannelId(channelId)
    message.setEndBroadcast(endBroadcast)
    message.setJoinVoiceCall(joinVoiceCall)
    console.log('message.toObject()', message.toObject())
  };

  render() {
    return (
      <div>
        <div className='header'>
          <div className="title">WELCOME TO MESSAGING APP <MessageOutlined /></div>
          {
            !this.props.isLogin ? (<div className="login">
              <input
                onChange={this.handleInputUsername}
                onKeyPress={this.handlePress}
                type="text"
                id="input"
                className="Input-text" placeholder="Username..."/>
              <ArrowRightOutlined className="loginIcon"/>
            </div>) : <div className="title">Hi, {this.props.username}, let send some message</div>
          }
        </div>
        <div className='content'>
          {
            !this.props.isLogin ? null : <MessageContainer onCall={this.handleClickCall}/>
          }
        </div>
        {/*<button onClick={this.test}>Test message</button>*/}
        <Modal
          title={`'Calling to ${this.state.callingName}`}
          visible={this.state.visible}
          onOk={this.handleOk}
          onCancel={this.handleCancel}
        >
          <p>Are you want to call {this.state.callingName}</p>
        </Modal>
        <CallModal />
      </div>
    )
  }
}

const mapStateToProps = (state) => ({
  todos: state.home.todos,
  isLogin: state.websocket.login,
  username: state.websocket.username
});

const mapDispatchToProps = {
  fetchTodos: actions.fetchTodos,
  login: actions.login,
  call: callActions.call
};

export default connect(mapStateToProps, mapDispatchToProps)(Home)


