import { toResponseType } from '../../redux/socketMiddleware'

const defaultState = {
  connected: false,
  login: false,
  username: null,
  message: null,
  users: {},
  messages: [],
};

export default function websocketReduces(state = defaultState, action) {
  switch (action.type) {
    case 'WS_CONNECTED':
      return { ...state, connected: true }
    case 'WS_DISCONNECTED':
      return { ...state, connected: false }
    case 'CLEAR_MESSAGE':
      return { ...state, message: null }
    case toResponseType('login'): {
      return {
        ...state,
        login: action.payload.success,
        username: action.payload.username || null,
        message: action.payload.message || null
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
    case toResponseType('new-chat-message'): {
      const newMessages = [...state.messages, action.payload];
      return {
        ...state,
        messages: newMessages,
      }
    }
    default:
      return state
  }
}
