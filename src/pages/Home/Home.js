import React, { Component } from "react";
import { connect } from "react-redux";
import { MessageOutlined, ArrowRightOutlined } from '@ant-design/icons'
import MessageContainer from 'components/Message/MessageContainer'
import { actions } from 'redux/home'
import './home.scss'
import '../../components/Input/input.css'


class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: ''
    }
  }
  handleInputUsername = (event) => {
    this.setState({ username: event.target.value })
  }

  handlePress = (event) => {
    if (event.key === 'Enter') {
      const { username } = this.state;
      if (username && username !== '') {
        this.props.login(username)
      }
    }
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
            !this.props.isLogin ? null : <MessageContainer/>
          }
        </div>
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
  login: actions.login
};

export default connect(mapStateToProps, mapDispatchToProps)(Home)


