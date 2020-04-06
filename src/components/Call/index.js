import React, { Component } from "react";
import { connect } from "react-redux";
import { Modal } from 'antd';
import { actions as callActions } from 'redux/call'
import './call.scss'

class CallModal extends Component {
  myPeerConnection = null
  webcamStream = null
  mediaConstraints = {
    audio: true,            // We want an audio track
    video: {
      aspectRatio: {
        ideal: 1.333333     // 3:2 aspect is preferred
      }
    }
  };
  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevProps.isCalling && this.props.isCalling && this.props.targetUsername !== '' && this.props.startCall) {
      this.createPeerConnection()
      this.setLocalVideo()
    } else if (!prevProps.receiveCall && this.props.receiveCall) {
      this.handleVideoOfferMsg()
    }
  }

  handleVideoOfferMsg = async () => {
    // remember to set target username
    if (!this.myPeerConnection) {
      this.createPeerConnection();
    }

    const desc = new RTCSessionDescription(msg.sdp);
    if (this.myPeerConnection.signalingState != "stable") {

      await Promise.all([
        this.myPeerConnection.setLocalDescription({type: "rollback"}),
        this.myPeerConnection.setRemoteDescription(desc)
      ]);
      return;
    } else {
      await this.myPeerConnection.setRemoteDescription(desc);
    }

    if (!this.webcamStream) {
      try {
        this.webcamStream = await navigator.mediaDevices.getUserMedia(this.mediaConstraints);
      } catch(err) {
        console.log('error', error)
        return;
      }

      document.getElementById("local_video").srcObject = this.webcamStream;


      try {
        this.webcamStream.getTracks().forEach(
           track => this.myPeerConnection.addTransceiver(track, {streams: [this.webcamStream]})
        );
      } catch(err) {
        console.log('error', error)
      }

      this.sendToServer({
        name: this.props.username,
        target: this.props.targetUsername,
        type: "video-answer",
        sdp: this.myPeerConnection.localDescription
      });
    }

    await this.myPeerConnection.setLocalDescription(await this.myPeerConnection.createAnswer());
  }

  setLocalVideo = async () => {
    try {
      this.webcamStream = await navigator.mediaDevices.getUserMedia(this.mediaConstraints);
      document.getElementById("local_video").srcObject = this.webcamStream;
    } catch(err) {
      console.log(err);
      return;
    }
  }
  createPeerConnection = () => {
    console.log("Setting up a connection...")
    this.myPeerConnection = new RTCPeerConnection({
      iceServers: [     // Information about ICE servers - Use your own!
        {
          urls: "",  // A TURN server
          username: "webrtc",
          credential: "turnserver"
        }
      ]
    });
    this.myPeerConnection.onicecandidate = this.handleICECandidateEvent;
    this.myPeerConnection.oniceconnectionstatechange = this.handleICEConnectionStateChangeEvent;
    this.myPeerConnection.onsignalingstatechange = this.handleSignalingStateChangeEvent;
    this.myPeerConnection.onnegotiationneeded = this.handleNegotiationNeededEvent;
    this.myPeerConnection.ontrack = this.handleTrackEvent;
  }

  handleICECandidateEvent = (event) => {
    if (event.candidate) {
      this.sendToServer({
        type: "new-ice-candidate",
        target: this.props.targetUsername,
        candidate: event.candidate
      });
    }
  }

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

      this.sendToServer({
        name: this.props.username,
        target: this.props.targetUsername,
        type: "video-offer",
        sdp: this.myPeerConnection.localDescription
      });
    } catch(err) {
      console.log(err)
    };
  }

  handleTrackEvent = (event) => {
    document.getElementById("received_video").srcObject = event.streams[0];
  }

  sendToServer = () => {
    console.log('SEND TO SERVER SIMULATED')
  };

  handleVideoAnswerMsg = async (msg) => {
    const desc = new RTCSessionDescription(msg.sdp);
    await this.myPeerConnection.setRemoteDescription(desc);
  };

  closeVideoCall = () => {
    const localVideo = document.getElementById("local_video");
    if (this.myPeerConnection) {
      this.myPeerConnection.ontrack = null;
      this.myPeerConnection.onnicecandidate = null;
      this.myPeerConnection.oniceconnectionstatechange = null;
      this.myPeerConnection.onsignalingstatechange = null;
      this.myPeerConnection.onicegatheringstatechange = null;
      this.myPeerConnection.onnotificationneeded = null;
      this.myPeerConnection.getTransceivers().forEach(transceiver => {
        transceiver.stop();
      });
      if (localVideo.srcObject) {
        localVideo.pause();
        localVideo.srcObject.getTracks().forEach(track => {
          track.stop();
        });
      }

      this.myPeerConnection.close();
      this.myPeerConnection = null;
      this.webcamStream = null;
    }
    this.props.endCall()
  }

  handleNewICECandidateMsg = async (msg) => {
    const candidate = new RTCIceCandidate(msg.candidate);

    try {
      await this.myPeerConnection.addIceCandidate(candidate)
    } catch(err) {
      console.log(error)
    }
  }

  render() {
    const { targetUsername, isCalling, endCall } = this.props
    return (
      <Modal
        title={'Calling to ' + targetUsername}
        visible={isCalling}
        cancelText={'END CALL'}
        closable={false}
        okButtonProps={{ hidden: true }}
        onCancel={endCall}
        cancelButtonProps={{ danger: true, type: 'primary' }}
        width={1080}
      >
        <div className={'video-container'}>
          <video id="received_video" autoPlay />
          <video id="local_video" autoPlay muted />
        </div>
      </Modal>
    )
  }
}

const mapStateToProps = (state) => ({
  targetUsername: state.call.targetUsername,
  isCalling: state.call.isCalling,
  username: state.websocket.username,
  startCall: state.websocket.startCall,
  receiveCall: state.websocket.receiveCall
});

const mapDispatchToProps = {
  endCall: callActions.endCall
};

export default connect(mapStateToProps, mapDispatchToProps)(CallModal)