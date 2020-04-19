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

const newResponseAction = ({ type, payload }) => ({ type: toResponseType(type), payload })

const TYPES = {
  CALL_CREATED: 'callStarted',
  JOIN_ACCEPTED: 'joinCallResponse',
  NEW_JOIN_CALL: 'callJoined',
  CALL_STOPPED: 'callStopped',
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
      console.log('messageData', messageData)
      const type = findMessageType(messageData)
      switch (type) {
        case TYPES.CALL_CREATED:
          store.dispatch(newResponseAction({
            type: 'CALL_CREATED',
            payload: messageData
          }));
          return;
        case TYPES.JOIN_ACCEPTED:
          store.dispatch(newResponseAction({
            type: 'JOIN_ACCEPTED',
            payload: messageData
          }));
          return;
        case TYPES.NEW_JOIN_CALL:
          store.dispatch(newResponseAction({
            type: 'NEW_JOIN_CALL',
            payload: messageData
          }));
          return;
        case TYPES.CALL_STOPPED:
          store.dispatch(newResponseAction({
            payload: 'CALL_STOPPED'
          }));
          return;
        default:
          return;
      }
    } else {
      const payload = JSON.parse(event.data);
      // console.log('payload', payload)
      store.dispatch(newResponseAction(payload.content))
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
        console.log('SEND DATA', Protobuf.MessagingCommandPayload.deserializeBinary(sendData).toObject())
        const packedMessage = generatePackage(sendData);
        // socket.send(JSON.stringify(action.payload));
        socket.send(packedMessage);
        break;
      default:
        return next(action);
    }
  };
};

function generatePackage(data) {
  const messageType = Protobuf.Type.MESSAGE
  const content = new Protobuf.Content()
  const message = new Protobuf.Message()
  content.setId(1)
  content.setType(messageType)
  content.setBytes(data)
  message.setContent(content)
  return message.serializeBinary()
}

function serializeMessage(originalMsg) {
  const channelId = 'f65fd2c6-9d3d-4236-8be7-50ba498a84ce'
  const currentTime = Date.now();
  const message = new Protobuf.MessagingCommandPayload()
  message.setEpoch(currentTime);
  message.setChannelId(channelId);
  const { data, type } = originalMsg
  switch (type) {
    // case 'login':
    //   message.setUsername(data.username)
    //   return message.serializeBinary()
    case 'create-call':
      const createVoiceCallMessage = generateCreateVoiceCallMessage();
      message.setStartCall(createVoiceCallMessage);
      console.log('CREATE CALL', message.toObject())
      return message.serializeBinary();
    case 'join-call':
      const { offer, callInfo } = data;
      const jsep = generateJsepMessage(offer);
      const joinVoiceCallMessage = generateJoinVoiceCallMessage(jsep, callInfo || {});
      message.setJoinCall(joinVoiceCallMessage);
      return message.serializeBinary();
    case 'new-ice-candidate':
      const gatherCandidateMessage = generateGatherIceCandidate(data)
      message.setGatherIceCandidate(gatherCandidateMessage)
      return message.serializeBinary()
    case 'leave-call':
      const leaveVoiceCallMessage = generateLeaveVoiceCall(data)
      message.setLeaveCall(leaveVoiceCallMessage)
      return message.serializeBinary()
    case 'stop-call':
      const stopVoiceCallMessage = generateStopVoiceCall(data)
      message.setStopCall(stopVoiceCallMessage)
      return message.serializeBinary()
    case 'upsert-token':
      const upsertTokenMessage = generateUpsertToken(data)
      message.setUpsertRegistrationToken(upsertTokenMessage)
      return message.serializeBinary()
    default:
      return ''
  }
}

const parseBinaryMessage = (binaryMessage) => {
  const usherMessage = Protobuf.Message.deserializeBinary(binaryMessage)
  console.log('usherMessage toObject', usherMessage.toObject())
  const eventPayload = usherMessage.getContent().getBytes()
  console.log('eventPayload', eventPayload)
  try {
    return Protobuf.MessagingEventPayload.deserializeBinary(eventPayload).toObject()
  } catch {
    return Protobuf.MessagingResponsePayload.deserializeBinary(eventPayload).toObject()
  }
}

const generateUpsertToken = (data) => {
  const upsetTokenMessage = new Protobuf.UpsertRegistrationTokenRequest()
  upsetTokenMessage.setDeviceRegistrationToken(data)
  return upsetTokenMessage
}

const generateCreateVoiceCallMessage = () => {
  const voiceCallMessage = new Protobuf.StartCallRequest();
  voiceCallMessage.setMuted(false)
  const callType = Protobuf.CallType.CALL_TYPE_VOICE
  voiceCallMessage.setCallType(callType)
  return voiceCallMessage
};

const generateJsepMessage = (offer) => {
  const jsep = new Protobuf.Jsep()
  const sdpType = Protobuf.SdpType.OFFER
  jsep.setSdp(offer.sdp)
  jsep.setType(sdpType)
  return jsep
};

const generateJoinVoiceCallMessage = (jsep, callInfo) => {
  const joinVoiceCall = new Protobuf.JoinCallRequest()
  const callType = Protobuf.CallType.CALL_TYPE_VOICE
  joinVoiceCall.setMuted(false)
  joinVoiceCall.setSdpOffer(jsep)
  joinVoiceCall.setCallType(callType)
  joinVoiceCall.setCallId(callInfo.callId)
  return joinVoiceCall
};

const generateGatherIceCandidate = (data) => {
  const gatherIceCandidateMessage = new Protobuf.GatherIceCandidateRequest();
  const iceCandidateMessage = new Protobuf.IceCandidate();
  iceCandidateMessage.setCandidate(data.candidate);
  iceCandidateMessage.setSdpMlineIndex(data.sdpMLineIndex);
  iceCandidateMessage.setSdpMid(data.sdpMid);
  gatherIceCandidateMessage.setCandidatesList([iceCandidateMessage])
  return gatherIceCandidateMessage
}

const generateLeaveVoiceCall = (callId) => {
  const leaveVoiceCallMessage = new Protobuf.LeaveCallRequest();
  leaveVoiceCallMessage.setCallId(callId)
  return leaveVoiceCallMessage
};

const generateStopVoiceCall = (callId) => {
  const leaveVoiceCallMessage = new Protobuf.StopCallRequest();
  leaveVoiceCallMessage.setCallId(callId)
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

const genearateCallStart = () => {
  const message = new Protobuf.UsherResponse()
  const callStartedEventMessage = new Protobuf.CallStartedEvent()
  callStartedEventMessage.setCallId('call-id')
  const voiceCallType = Protobuf.CallType.CALL_TYPE_VOICE
  callStartedEventMessage.setCallType(voiceCallType)
  message.setCallStarted(callStartedEventMessage)
  return message
}
export default socketMiddleware();