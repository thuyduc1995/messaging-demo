import { toResponseType } from '../../redux/socketMiddleware'
import {message} from "antd";

const defaultState = {
  connected: false,
  login: false,
  username: null,
  message: null,
  users: {},
  messages: [],
  userId: null,
};

export default function websocketReduces(state = defaultState, action) {
  switch (action.type) {
    case 'WS_CONNECTED':
      return { ...state, connected: true }
    case 'WS_DISCONNECTED':
      return { ...state, connected: false }
    case 'CLEAR_MESSAGE':
      return { ...state, message: null }
    case 'LOGIN':
      return {
        ...state,
        login: true,
        username: action.payload,
        message: {
          type: 'success',
          text: 'Login Success'
        },
        users: {
          [action.payload]: true
        }
      }
    case toResponseType('login'): {
      return {
        ...state,
        login: action.payload.success,
        username: action.payload.username || null,

      }
    }
    case toResponseType('users'): {
      return {
        ...state,
        users: action.payload,
      }
    }
    case toResponseType('get-messages'): {
      return {
        ...state,
        messages: action.payload,
      }
    }
    case 'new-chat-message': {
      const { userId } = state
      const newMessages = [...state.messages, { message: action.payload, clientId: userId }];
      return {
        ...state,
        messages: newMessages,
      }
    }
    case toResponseType('message'): {
      return {
        ...state,
        message: {
          type: 'info',
          text: action.payload
        },
      }
    }
    case toResponseType('CHANNEL_JOINED'): {
      const { clientInfo } = action.payload.channelJoined
      return {
        ...state,
        message: {
          type: 'info',
          text: `${clientInfo.clientAlias} joined into the group`
        },
        users: {
          ...state.users,
          [clientInfo.clientId]: clientInfo.clientAlias
        }
      }
    }
    case toResponseType('JOIN_CHANNEL_RESPONSE'): {
      const { participant, currentParticipantsList: currentParticipants } = action.payload.joinChannelResponse
      console.log('action.payload', action.payload)
      const { clientId, clientAlias } = participant
      console.log('currentParticipants', currentParticipants)
      return {
        ...state,
        login: true,
        username: clientAlias,
        message: {
          type: 'success',
          text: `Join channel successfully, welcome ${clientAlias}!`
        },
        userId: clientId,
        users: transformParticipants(currentParticipants)
      }
    }
    case toResponseType('MESSAGE_SENT'): {
      const { content, sender } = action.payload.messageSent
      console.log('action.payload.messageSent', action.payload.messageSent)
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            message: content,
            clientId: sender
          }
        ]
      }
    }
    default:
      return state
  }
}

const transformParticipants = (userList) => {
  return userList.reduce((result, user) => {
    result[user.clientId] = user.clientAlias
    return result
  }, {})
}
