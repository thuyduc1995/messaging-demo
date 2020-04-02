import http from 'http'
import { server as WebSocketServer } from 'websocket'

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

const wsServer = new WebSocketServer({
  httpServer: httpServer,
  autoAcceptConnections: false
});

wsServer.on('request', request => {
  const connection = request.accept('json', request.origin);
  let username = null;
  connection.on('message', (message) => {
    if (message.type === 'utf8') {
      const messageData = message.utf8Data
      const { type, data } = JSON.parse(messageData)
      switch (type) {
        case 'login':
          if (data && data.username && !connectionMap[data.username]) {
            connectionMap[data.username] = connection;
            username = data.username;
            users[username] = true;
            connection.sendUTF(JSON.stringify({ type: 'login', data: { success: true, username: data.username, message: { type: 'success', text: 'Login success' } }}));
            sendToAll({ type: 'users', data: users })
          } else {
            connection.sendUTF(JSON.stringify({ type: 'login', data: { success: false, message: { type: 'error', text: 'Username Invalid' } }}));
          }
          return;
        case 'get-messages':
          connection.sendUTF(JSON.stringify({ type: 'get-messages', data: messages }));
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
    if (connectionMap[name] && connectionMap[name].sendUTF) {
      connectionMap[name].sendUTF(JSON.stringify(message))
    }
  })
};
console.log('***REQUEST HANDLER CREATED***');