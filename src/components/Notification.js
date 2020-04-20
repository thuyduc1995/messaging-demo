import { Component } from "react";
import { connect } from "react-redux";
import { notification } from "antd";
import { actions } from '../redux/websocket'

class Notification extends Component {
  componentDidUpdate(prevProps, prevState, snapshot) {
    if ((!prevProps.message && this.props.message && this.props.message.type) || (prevProps.message && this.props.message && prevProps.message.text !== this.props.message.text)) {
      const { type, text } = this.props.message
      notification[type]({ message: text, duration: 2.5, onClose: this.props.clearMessage })
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