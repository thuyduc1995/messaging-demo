import { Component } from "react";
import { connect } from "react-redux";
import { notification } from "antd";
import { actions } from '../redux/websocket'

class Notification extends Component {
  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.message && this.props.message && this.props.message.type) {
      const { type, text } = this.props.message
      notification[type]({ message: text, duration: 1.5, onClose: this.props.clearMessage })
    }
  }

  render() {
    return null
  }
}

const mapStateToProps = state => ({
  message: state.websocket.message
});

const mapDispatchToProps = {
  clearMessage: actions.clearMessage,
};

export default connect(mapStateToProps, mapDispatchToProps)(Notification)