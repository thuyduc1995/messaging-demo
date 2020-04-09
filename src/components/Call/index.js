import React, { Component } from "react";
import { connect } from "react-redux";
import { Modal } from 'antd';
import { actions as callActions } from 'redux/call'
import { AudioOutlined } from '@ant-design/icons'
import './call.scss'
import {call} from "../../redux/call/action";
import adapter from 'webrtc-adapter';
/*eslint-disable*/
class CallModal extends Component {
  myPeerConnection = null
  webcamStream = null

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.callAccepted && this.props.callAccepted && this.props.callAnswer) {
      this.handleVideoAnswerMsg(this.props.callAnswer)
    }
  }

  createPeerConnection = async () => {
    this.myPeerConnection = new RTCPeerConnection({});
    this.myPeerConnection.onicecandidate = this.handleICECandidateEvent;
    this.myPeerConnection.oniceconnectionstatechange = this.handleICEConnectionStateChangeEvent;
    this.myPeerConnection.onsignalingstatechange = this.handleSignalingStateChangeEvent;
    this.myPeerConnection.onnegotiationneeded = this.handleNegotiationNeededEvent;
    this.myPeerConnection.ontrack = this.handleTrackEvent;
  }

  handleICECandidateEvent = (event) => {
    if (event.candidate) {
      this.props.sendIceCandidate(event.candidate)
    }
  };

  handleICEConnectionStateChangeEvent = (event) => {
    switch(this.myPeerConnection.iceConnectionState) {
      case "closed":
      case "failed":
      case "disconnected":
        this.closeVideoCall();
        break;
    }
  }

  handleSignalingStateChangeEvent = event => {
    switch(this.myPeerConnection.signalingState) {
      case "closed":
        this.closeVideoCall();
        break;
    }
  };

  handleNegotiationNeededEvent = async () => {
    try {
      console.log('hello')
      const offer = await this.myPeerConnection.createOffer();
      if (this.myPeerConnection.signalingState != "stable") {
        return;
      }
      await this.myPeerConnection.setLocalDescription(offer);
      this.props.joinCall(offer)
    } catch(err) {
      console.log(err)
    }
  }

  handleTrackEvent = (event) => {
    document.getElementById("received_video").srcObject = event.streams[0];
  }

  handleVideoAnswerMsg = async (msg) => {
    const sdpAnswer = msg.sdpAnswer.sdp
    const desc = new RTCSessionDescription({ sdp: sdpAnswer, type: 'answer' });
    const candidates = this.splitCandidate(sdpAnswer)
    candidates.forEach(candidate => this.handleNewICECandidateMsg(candidate));
    await this.myPeerConnection.setRemoteDescription(desc);
  };

  closeVideoCall = () => {
    if (this.myPeerConnection) {
      this.myPeerConnection.ontrack = null;
      this.myPeerConnection.onnicecandidate = null;
      this.myPeerConnection.oniceconnectionstatechange = null;
      this.myPeerConnection.onsignalingstatechange = null;
      this.myPeerConnection.onicegatheringstatechange = null;
      this.myPeerConnection.onnotificationneeded = null;
      this.myPeerConnection.close();
      this.myPeerConnection = null;
      this.webcamStream = null;
    }
    this.props.leaveCall()
  }

  handleNewICECandidateMsg = async (msg) => {
    const candidate = new RTCIceCandidate({ candidate: msg, sdpMid: '0' });

    try {
      await this.myPeerConnection.addIceCandidate(candidate)
    } catch(err) {
      console.log(err)
    }
  }

  onStartCall = async () => {
    await this.createPeerConnection()
    this.props.startCall()
  };

  onEndCall = () => {
    if (this.props.isCalling) {
      this.closeVideoCall();
    }
    this.props.leaveCall(this.props.username)
  };

  splitCandidate = (sdpAnswer) => {
    const result = []
    return sdpAnswer.substring(
      sdpAnswer.indexOf("a=candidate"),
      sdpAnswer.lastIndexOf("host") + 4
    ).split('\r\n');
  };

  render() {
    const { isInvited, isCalling, owner } = this.props
    return (
      <Modal
        title={`GROUP HAS A CALL FROM ${owner}`}
        visible={isInvited}
        cancelText={isCalling ? 'END CALL' : 'DECLINE'}
        closable={false}
        okText={'JOIN CALL'}
        onOk={this.onStartCall}
        okButtonProps={{ disabled: isCalling }}
        onCancel={this.onEndCall}
        cancelButtonProps={{ danger: true, type: 'primary' }}
        width={1080}
      >
        <div className={'video-container'}>
          <video id="received_video" autoPlay />
          <video id="local_video" autoPlay muted />
        </div>
        { isCalling ? 'JOINED' : 'WAITING' }
      </Modal>
    )
  }
}

const mapStateToProps = (state) => ({
  targetUsername: state.call.targetUsername,
  isCalling: state.call.isCalling,
  username: state.websocket.username,
  receiveCall: state.websocket.receiveCall,
  callAccepted: state.call.callAccepted,
  isInvited: state.call.isReceiveInvite,
  owner: state.call.owner,
  callAnswer: state.call.callAnswer
});

const mapDispatchToProps = {
  leaveCall: callActions.leaveCall,
  startCall: callActions.startCall,
  joinCall: callActions.joinCall,
  sendIceCandidate: callActions.sendIceCandidate,
};

export default connect(mapStateToProps, mapDispatchToProps)(CallModal)