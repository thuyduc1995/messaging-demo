import { w3cwebsocket as W3CWebSocket } from 'websocket'
import Protobuf from 'protobuf/message_pb.js'

/*eslint-disable*/
export const toResponseType = type => `WS_NEW_RESPONSE_${type.toUpperCase()}`;
export const wsConnect = host => ({ type: 'WS_CONNECT', host });
export const wsConnecting = host => ({ type: 'WS_CONNECTING', host });
export const wsConnected = host => ({ type: 'WS_CONNECTED', host });
export const wsDisconnect = host => ({ type: 'WS_DISCONNECT', host });
export const wsDisconnected = host => ({ type: 'WS_DISCONNECTED', host });
const newMessageAction = payload => ({ type: 'WS_NEW_MESSAGE', payload });

const newResponseAction = ({ type, data }) => ({ type: toResponseType(type), payload: data })

const TYPES = {
  CALL_CREATED: 'voiceCallCreated',
  JOIN_ACCEPTED: 'voiceCallJoinAccepted',
  NEW_JOIN_CALL: 'voiceCallJoined',
};

const types = Object.values(TYPES)

const socketMiddleware = () => {
  let socket = null;

  const onOpen = store => (event) => {
    store.dispatch(wsConnected(event.target.url));
  };

  const onClose = store => () => {
    store.dispatch(wsDisconnected());
  };

  const onMessage = store => (event) => {
    if (!isValidJSON(event.data)) {
      const messageData = parseBinaryMessage(event.data)
      const type = findMessageType(messageData)
      switch (type) {
        case TYPES.CALL_CREATED:
          store.dispatch(newResponseAction({
            type: 'CALL_CREATED',
            data: messageData
          }));
          return;
        case TYPES.JOIN_ACCEPTED:
          store.dispatch(newResponseAction({
            type: 'JOIN_ACCEPTED',
            data: messageData
          }));
          return;
        case TYPES.NEW_JOIN_CALL:
          store.dispatch(newResponseAction({
            type: 'NEW_JOIN_CALL',
            data: messageData
          }));
          return;
        default:
          return;
      }
    } else {
      const payload = JSON.parse(event.data);
      store.dispatch(newResponseAction(payload))
    }
  };

  // the middleware part of this function
  return store => next => action => {
    switch (action.type) {
      case 'WS_CONNECT':
        if (socket !== null) {
          socket.close();
        }

        // connect to the remote host
        socket = new W3CWebSocket(action.host);

        // websocket handlers
        socket.onmessage = onMessage(store);
        socket.onclose = onClose(store);
        socket.onopen = onOpen(store);
        socket.binaryType = 'arraybuffer';
        break;
      case 'WS_DISCONNECT':
        if (socket !== null) {
          socket.close();
        }
        socket = null;
        break;
      case 'NEW_MESSAGE':
        store.dispatch(newMessageAction(action.payload))
        const sendData = serializeMessage(action.payload);
        // socket.send(JSON.stringify(action.payload));
        socket.send(sendData);
        break;
      default:
        return next(action);
    }
  };
};

function serializeMessage(originalMsg) {
  const channelId = 'f65fd2c6-9d3d-4236-8be7-50ba498a84ce'
  const currentTime = Date.now();
  const message = new Protobuf.CommunicationPayload()
  message.setEpoch(currentTime);
  message.setChannelId(channelId);
  const { data, type } = originalMsg
  switch (type) {
    case 'login':
      message.setUsername(data.username)
      return message.serializeBinary()
    case 'create-call':
      const createVoiceCallMessage = generateCreateVoiceCallMessage();
      message.setCreateVoiceCall(createVoiceCallMessage);
      return message.serializeBinary();
    case 'join-call':
      const jsep = generateJsepMessage(data);
      const joinVoiceCallMessage = generateJoinVoiceCallMessage(jsep);
      message.setJoinVoiceCall(joinVoiceCallMessage);
      return message.serializeBinary();
    case 'new-ice-candidate':
      const gatherCandidateMessage = generateGatherIceCandidate(data)
      message.setGatherIceCandidate(gatherCandidateMessage)
      return message.serializeBinary()
    case 'leave-call':
      const leaveVoiceCallMessage = generateLeaveVoiceCall(data)
      message.setLeaveVoiceCall(leaveVoiceCallMessage)
      return message.serializeBinary()
    default:
      return ''
  }
}

const parseBinaryMessage = (binaryMessage) => Protobuf.CommunicationPayload.deserializeBinary(binaryMessage).toObject()

const generateCreateVoiceCallMessage = () => {
  const voiceCallMessage = new Protobuf.CreateVoiceCall();
  voiceCallMessage.setMuted(false);
  return voiceCallMessage
};

const generateJsepMessage = (data) => {
  const jsep = new Protobuf.Jsep()
  const sdpType = Protobuf.SdpType.OFFER
  jsep.setSdp(data.sdp)
  jsep.setType(sdpType)
  return jsep
};

const generateJoinVoiceCallMessage = (jsep) => {
  const joinVoiceCall = new Protobuf.JoinVoiceCall()
  joinVoiceCall.setMuted(false)
  joinVoiceCall.setSdpOffer(jsep)
  return joinVoiceCall
};

const generateGatherIceCandidate = (data) => {
  const gatherIceCandidateMessage = new Protobuf.GatherIceCandidate();
  const iceCandidateMessage = new Protobuf.IceCandidate();
  iceCandidateMessage.setCandidate(data.candidate);
  iceCandidateMessage.setSdpMLineIndex(data.sdpMLineIndex);
  iceCandidateMessage.setSdpMid(data.sdpMid);
  gatherIceCandidateMessage.setCandidatesList([iceCandidateMessage])
  return gatherIceCandidateMessage
}

const generateLeaveVoiceCall = (data) => {
  const leaveVoiceCallMessage = new Protobuf.LeaveVoiceCall();
  leaveVoiceCallMessage.setParticipant(data)
  return leaveVoiceCallMessage
};

function isValidJSON(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

const findMessageType = (message) => {
  return types.find(type => !!message[type])
}

export default socketMiddleware();