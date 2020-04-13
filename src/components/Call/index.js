import React, { Component } from "react";
import { connect } from "react-redux";
import { Modal } from 'antd';
import { actions as callActions } from 'redux/call'
import './call.scss'
import adapter from 'webrtc-adapter';
/*eslint-disable*/
class CallModal extends Component {
  myPeerConnection = null
  webcamStream = null
  transceiver = null
  mediaConstraints = {
    audio: true,            // We want an audio track
  };
  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.callAccepted && this.props.callAccepted && this.props.callAnswer) {
      this.handleVideoAnswerMsg(this.props.callAnswer)
    }
    if (!prevProps.isCreate && this.props.isCreate && this.props.isInvited) {
      this.onStartCall()
    }
  }

  createPeerConnection = async () => {
    this.myPeerConnection = new RTCPeerConnection({});
    this.myPeerConnection.onicecandidate = this.handleICECandidateEvent;
    this.myPeerConnection.oniceconnectionstatechange = this.handleICEConnectionStateChangeEvent;
    this.myPeerConnection.onsignalingstatechange = this.handleSignalingStateChangeEvent;
    this.myPeerConnection.onnegotiationneeded = this.handleNegotiationNeededEvent;
    this.myPeerConnection.ontrack = this.handleTrackEvent;
    try {
      this.webcamStream = await navigator.mediaDevices.getUserMedia(this.mediaConstraints);
    } catch(err) {
      this.handleGetUserMediaError(err);
      return;
    }

    // Add the tracks from the stream to the RTCPeerConnection

    try {
      this.webcamStream.getTracks().forEach(
        this.transceiver = track => this.myPeerConnection.addTransceiver(track, {streams: [this.webcamStream]})
      );
    } catch(err) {
      this.handleGetUserMediaError(err);
    }
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
    if (this.props.isCreate) {
      this.props.stopCall()
    }
  };

  handleGetUserMediaError = (e) => {
    switch(e.name) {
      case "NotFoundError":
        alert("Unable to open your call because no camera and/or microphone" +
          "were found.");
        break;
      case "SecurityError":
      case "PermissionDeniedError":
        // Do nothing; this is the same as the user canceling the call.
        break;
      default:
        alert("Error opening your camera and/or microphone: " + e.message);
        break;
    }

    // Make sure we shut down our end of the RTCPeerConnection so we're
    // ready to try again.

    this.closeVideoCall();
  }

  splitCandidate = (sdpAnswer) => {
    const result = []
    return sdpAnswer.substring(
      sdpAnswer.indexOf("a=candidate"),
      sdpAnswer.lastIndexOf("host") + 4
    ).split('\r\n');
  };

  render() {
    const { isInvited, isCalling, isCreate } = this.props
    return (
      <Modal
        title="GROUP HAS A CALL"
        visible={isInvited}
        cancelText={isCalling ? 'END CALL' : 'DECLINE'}
        closable={false}
        okText={'JOIN CALL'}
        onOk={this.onStartCall}
        okButtonProps={{ disabled: isCalling || isCreate }}
        onCancel={this.onEndCall}
        cancelButtonProps={{ danger: true, type: 'primary' }}
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
  callAnswer: state.call.callAnswer,
  isCreate: state.call.isCreate,
});

const mapDispatchToProps = {
  leaveCall: callActions.leaveCall,
  startCall: callActions.startCall,
  joinCall: callActions.joinCall,
  stopCall: callActions.stopCall,
  sendIceCandidate: callActions.sendIceCandidate,
};

export default connect(mapStateToProps, mapDispatchToProps)(CallModal)