import React, { Component } from "react";
import { connect } from "react-redux";
import { AudioOutlined, PhoneOutlined } from '@ant-design/icons'
import { actions } from 'redux/websocket'

import './MessageContainer.scss';

class MessageContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      message: ''
    }
  }

  handleInputMessage = (event) => {
    this.setState({ message: event.target.value })
  }

  handlePress = (event) => {
    if (event.key === 'Enter') {
      const { message } = this.state;
      if (message && message !== '') {
        this.props.sendMessage(message)
        this.setState({ message: '' })
      }
    }
  };
  render() {
    return (
      <div className="message-wrapper">
        <div className="user-container">
          <span className="org">Axon Enterprise, Inc.</span>
          <div className='users'>
            <div className='sub-title'># Users</div>
            {
              Object.keys(this.props.users).map(clientId => (
                <UserDisplay
                  key={clientId}
                  isOnline={true}
                  name={this.props.users[clientId]}
                  currentUsername={this.props.username}
                />
              ))
            }
          </div>
        </div>
        <div className="chat-container">
          <div className="chat-header"># comms-messaging <PhoneOutlined onClick={this.props.onCall}/></div>
          <div className="chat-box">
            {
              this.props.messages.map((mess, index) => (
                <MessageLine
                  key={index}
                  name={this.props.users[mess.clientId]}
                  message={mess.message}
                  currentUsername={this.props.username}
                  indexKey={index}
                />
              ))
            }
          </div>
          <div className="chat-input">
            <AudioOutlined/>
            <input
              onChange={this.handleInputMessage}
              onKeyPress={this.handlePress}
              value={this.state.message}
              type="text"
              placeholder="Message #comms-messaging..."/>
          </div>
        </div>
      </div>
    )
  }
}

const mapStateToProps = state => ({
  users: state.websocket.users,
  username: state.websocket.username,
  messages: mergeMessage(state.websocket.messages),
});

const mapDispatchToProps = {
  sendMessage: actions.sendMessage,
  getMessages: actions.getMessages
};

const mergeMessage = (messages) => {
  const message = [];
  let previousName = null;
  let resultIndex = -1;
  messages.forEach((mess) => {
    if (mess.username !== previousName) {
      message.push({ ...mess })
      previousName = mess.username
      resultIndex++
    } else {
      const previousMessage = message[resultIndex].message;
      const formattedMessage = Array.isArray(previousMessage) ? [...previousMessage] : [previousMessage]
      formattedMessage.push(mess.message)
      message[resultIndex].message = formattedMessage
    }
  })
  return message
};
export default connect(mapStateToProps, mapDispatchToProps)(MessageContainer)

const UserDisplay = ({ name, isOnline, currentUsername }) => {
  const style = {
    borderRadius: '50%',
    backgroundColor: isOnline ? '#4CBE93' : '',
    width: '10px',
    height: '10px',
    display: 'inline-block',
    border: !isOnline ? '1px solid gray' : '',
    marginRight: '6px',
    cursor: 'pointer'
  };
  return (
    <div>
      <span style={style}/>
      <span style={{ color: 'white', fontSize: '14px', cursor: 'pointer' }}>{`${name}${currentUsername === name ? ' (You)' : ''}`}</span>
    </div>
  )
}

const MessageLine = ({ name, message, currentUsername, indexKey }) => {
  const style = {
    borderRadius: '18px',
    backgroundColor: currentUsername === name ? '#0084ff' : '#e4e6eb',
    color: currentUsername === name ? 'white' : 'black',
    padding: '4px 8px',
    fontSize: '14px',
    width: 'fit-content',
    marginBottom: '3px',
    marginLeft: currentUsername === name ? 'auto' : 'unset',
    maxWidth: '240px'
  };
  const position = currentUsername === name ? 'flex-end' : 'flex-start';
  return (
    <div style={{ margin: '3px 0', display: 'flex', justifyContent: position }}>
      <div>
        { currentUsername === name ? null : <div style={{ color: '#767676', fontSize: '12px' }}>{name}</div>}
        {
          Array.isArray(message) ?
            message.map((mess, index) => <div key={`${indexKey}-${index}`} style={style}>{mess}</div>)
            : <div style={style}>{message}</div>
        }
      </div>
    </div>
  )
}