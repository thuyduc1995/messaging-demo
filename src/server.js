import http from 'http'
import WebSocket from 'ws'
import Protobuf from '../src/protobuf/message_pb'

const port = '5795'

const httpServer = http.createServer({}, (req, res) => {
  console.log('CREATE SERVER')
  res.end()
})

const connectionMap = {};
const users = {};
const messages = [];
let messageIndex = 0

httpServer.listen(port)

console.log("***CREATING WEBSOCKET SERVER");

const wsServer = new WebSocket.Server({
  server: httpServer,
});

wsServer.on('connection', connection => {
  let username = null;
  connection.on('message', (message) => {
    // var protobufMessage = new Protobuf.Message();
    // console.log('message', message);
    // console.log('Protobuf.deserializeBinary(message)', Protobuf.Message.deserializeBinary(message))
    // const datamess = Protobuf.Message.deserializeBinary(message)
    // console.log('datamess.toObject', datamess.toObject())
    console.log('message', message)
    const { type, data } = JSON.parse(message)
    switch (type) {
      case 'login':
        if (data && data.username && !connectionMap[data.username]) {
          connectionMap[data.username] = connection;
          username = data.username;
          users[username] = true;
          connection.send(JSON.stringify({ type: 'login', data: { success: true, username: data.username, message: { type: 'success', text: 'Login success' } }}));
          sendToAll({ type: 'users', data: users })
        } else {
          connection.send(JSON.stringify({ type: 'login', data: { success: false, message: { type: 'error', text: 'Username Invalid' } }}));
        }
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

const sendToAll = (message) => {
  const connections = Object.keys(connectionMap);
  connections.forEach((name) => {
    if (connectionMap[name] && connectionMap[name].send) {
      connectionMap[name].send(JSON.stringify(message))
    }
  })
};
console.log('***REQUEST HANDLER CREATED***');