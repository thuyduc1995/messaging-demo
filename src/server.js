import http from 'http'
import WebSocket from 'ws'
import { w3cwebsocket as W3CWebSocket } from 'websocket'
import Protobuf from '../src/protobuf/message_pb.js'
import { v4 as uuid } from 'uuid';
import axios from 'axios'

const port = '5795'

const httpServer = http.createServer({}, (req, res) => {
  console.log('CREATE SERVER')
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Request-Method', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.end()
})

const connectionMap = {};
const users = {};
const messages = [];
let messageIndex = 0
let participants = []
httpServer.listen(port)

let roomId = null

console.log("***CREATING WEBSOCKET SERVER");

const wsServer = new WebSocket.Server({
  server: httpServer,
});
const TYPES = {
  CREATE_CALL: 'createVoiceCall',
  JOIN_CALL: 'joinVoiceCall',
  LEAVE_CALL: 'leaveVoiceCall',
  NEW_ICE: 'gatherIceCandidate',
  LOGIN: 'username'
};

const types = Object.values(TYPES)

const axiosInstance = axios.create({
  baseURL: 'http://192.168.1.213:8088/',
})

wsServer.on('connection', connection => {
  let username = null;
  let sessionId = null;
  let handleId = null;
  connection.on('message', async (protoMessage) => {
    const message = Protobuf.CommunicationPayload.deserializeBinary(protoMessage);
    const objectMessage = message.toObject()
    const type = findMessageType(objectMessage)
    switch (type) {
      case TYPES.LOGIN:
        const loginUsername = objectMessage.username;
        if (!!loginUsername && !connectionMap[loginUsername]) {
          connectionMap[loginUsername] = connection;
          username = loginUsername;
          users[loginUsername] = true;
          sessionId = await getJanusSession()
          handleId = await attachPlugin(sessionId)
          connection.send(JSON.stringify({ type: 'login', data: { success: true, username: loginUsername, message: { type: 'success', text: 'Login success' } }}));
          sendToAll({ type: 'users', data: users })
        } else {
          connection.send(JSON.stringify({ type: 'login', data: { success: false, message: { type: 'error', text: 'Username Invalid' } }}));
        }
        return;
      case TYPES.CREATE_CALL:
        if (!roomId) {
          // await keepAlive(sessionId, handleId)
          roomId = await createRoom(sessionId, handleId)
          const response = serializeMessage('voiceCallCreated', username)
          sendToAll(response, false)
        }
        return;
      case TYPES.JOIN_CALL:
        participants = [...participants, username];
        const { sdp } = objectMessage[type].sdpOffer;
        const janusJoinedResponse = await joinJanusCall(sessionId, handleId, sdp, username)
        const response = serializeMessage('joinVoiceCallAccepted', username, janusJoinedResponse)
        const joinedResponse = serializeMessage('voiceCallJoined', username)
        connection.send(response);
        sendToAll(joinedResponse, false, username)
        return;
      case TYPES.NEW_ICE:
        const iceCandidate = objectMessage[type];
        await sendIceCandidate(sessionId, handleId, iceCandidate)
        return;
      case TYPES.LEAVE_CALL:
        participants = participants.filter(participant => participant !== username)
        return;
      case 'get-messages':
        connection.send(JSON.stringify({ type: 'get-messages', data: messages }));
        return;
      case 'new-chat-message':
        const messageElement = { username: username, message: data, index: ++messageIndex }
        messages.push(messageElement)
        sendToAll({ type: 'new-chat-message', data: messageElement })
        return;
      default:
        console.log('DEFAULT', type)
        return;
    }
  })

  connection.on('close', connect => {
    users[username] = false;
    connectionMap[username] = null;
    sendToAll({ type: 'users', data: users })
  })
});

function serializeMessage(type, payload, janusResponse) {
  const channelId = 'f65fd2c6-9d3d-4236-8be7-50ba498a84ce'
  const transaction = 'hkkkfkf-fwbhjfbewjfwj-wfwwefwe'
  const currentTime = Date.now();
  const message = new Protobuf.CommunicationPayload()
  message.setEpoch(currentTime);
  message.setChannelId(channelId);
  switch (type) {
    case 'voiceCallCreated':
      const owner = new Protobuf.VoiceCallCreated()
      owner.setOwnerId(payload)
      message.setVoiceCallCreated(owner);
      return message.serializeBinary();
    case 'joinVoiceCallAccepted':
      const sdpAnswer = janusResponse.jsep.sdp;
      const voiceCallJoinAcceptedMessage = new Protobuf.VoiceCallJoinAccepted()
      const jsep = new Protobuf.Jsep()
      const sdpType = Protobuf.SdpType.ANSWER
      jsep.setSdp(sdpAnswer)
      jsep.setType(sdpType)
      voiceCallJoinAcceptedMessage.setSdpAnswer(jsep)
      voiceCallJoinAcceptedMessage.setParticipant(payload)
      voiceCallJoinAcceptedMessage.setParticipantsList(participants)
      voiceCallJoinAcceptedMessage.setTransaction(transaction)
      message.setVoiceCallJoinAccepted(voiceCallJoinAcceptedMessage)
      return message.serializeBinary();
    case 'voiceCallJoined':
      const voiceCallJoinedMessage = new Protobuf.VoiceCallJoined()
      voiceCallJoinedMessage.setParticipant(payload)
      voiceCallJoinedMessage.setTransaction(transaction)
      message.setVoiceCallJoined(voiceCallJoinedMessage)
      return message.serializeBinary();
    default:
      return ''
  }
}

const sendToAll = (message, isJSON = true, except = null) => {
  const connections = Object.keys(connectionMap);
  connections.forEach((name) => {
    if (connectionMap[name] && connectionMap[name].send && name !== except) {
      if (isJSON) connectionMap[name].send(JSON.stringify(message))
      else connectionMap[name].send(message)
    }
  })
};

const findMessageType = (message) => {
  return types.find(type => !!message[type])
};

async function keepAlive(sessionId, handleId) {
  const response = await axiosInstance.post(`/janus/${sessionId}/${handleId}`, {
    janus: 'keepalive',
    transaction: uuid(),
  })
  return response
}

async function getJanusSession() {
  const response = await axiosInstance.post('/janus', {
    janus: 'create',
    transaction: uuid(),
  })
  return response.data.data.id
}

async function attachPlugin(sessionId) {
  const response = await axiosInstance.post(`/janus/${sessionId}`, {
    janus: 'attach',
    transaction: uuid(),
    plugin: 'janus.plugin.audiobridge'
  })
  return response.data.data.id
}

async function createRoom(sessionId, handleId) {
  const response = await axiosInstance.post(`/janus/${sessionId}/${handleId}`, {
    body: {
      request: 'create',
    },
    janus: 'message',
    transaction: uuid(),
  })
  return response.data.plugindata.data.room
}

async function sendIceCandidate(sessionId, handleId, candidate) {
  const response = await axiosInstance.post(`/janus/${sessionId}/${handleId}`, {
    janus: 'trickle',
    transaction: uuid(),
    candidate: candidate.candidatesList[0]
  })
  return response.data
}

async function joinJanusCall(sessionId, handleId, sdp, username) {
  const response = await axiosInstance.post(`/janus/${sessionId}/${handleId}`, {
    janus: 'message',
    transaction: uuid(),
    jsep: {
      type: 'offer',
      sdp
    },
    body: {
      request : 'join',
      display: username,
      room: roomId,
      muted: false
    },
  });
  const joinResponse = await axiosInstance.get(`/janus/${sessionId}`)
  return joinResponse.data
}

// async function configureRoom(sessionId, handleId, sdp, username) {
//   const response = await axiosInstance.post(`/janus/${sessionId}/${handleId}`, {
//     janus: 'message',
//     transaction: uuid(),
//     body: {
//       request : 'configure',
//       muted: false
//     },
//   })
//   const duc = await axiosInstance.get(`/janus/${sessionId}`)
//   const duc1 = await axiosInstance.get(`/janus/${sessionId}`)
//   console.log('CONFIGURE', response.data)
//   console.log('duc', duc.data)
//   console.log('duc1', duc1.data)
//   return response.data
// }


// const wsJanus = new WebSocket('ws://localhost:8188', 'janus-protocol')
// const transaction = 'B5KF-7499-2A13-9IKM'
// wsJanus.on('open', function open() {
//   wsJanus.send(JSON.stringify({ janus: 'create', transaction }))
// });
//
// wsJanus.on('close', function close() {
//   console.log('disconnected');
// });
//
// wsJanus.on('message', function incoming(data) {
//   console.log('data', data)
// });

// let sessionId = null
// const janusSocket = new W3CWebSocket('ws://127.0.0.1:8188', 'janus-protocol');
// janusSocket.onmessage = (event) => {
//   console.log('event.data', event.data)
//   const messgage = JSON.parse(event.data)
//   switch (messgage.janus) {
//     case 'success':
//       sessionId = messgage.data.id
//       return;
//     default:
//       return
//   }
// };
//
// janusSocket.onclose = () => {}
//
// janusSocket.onopen = () => {
//   console.log('JANUS OPEN')
// }
//
// const createJanusSession = () => {
//   janusSocket.send(JSON.stringify({ janus: 'create', transaction: uuid() }))
// };
//
// const attachPlugin = (plugin) => {
//   janusSocket.send(JSON.stringify({
//     janus: 'attach',
//     transaction: uuid(),
//     session_id: sessionId,
//     plugin
//   }))
// };
//
// setTimeout(createJanusSession, 3000)
// setTimeout(() => attachPlugin('janus.plugin.audiobridge'), 5000)