import { createAction } from "utils/actionUtils";

const clearMessage = () => createAction({ type: 'CLEAR_MESSAGE' });

const sendMessage = (message) =>
  createAction({
    type: 'NEW_MESSAGE',
    payload: {
      type: 'new-chat-message',
      data: message
    }
  });

const getMessages = () =>
  createAction({
    type: 'NEW_MESSAGE',
    payload: {
      type: 'get-messages',
    }
  });

const joinChannel = (username) => createAction({
  type: 'JOIN_CHANNEL',
  onSuccess: (dispatch) => {
    dispatch({
      type: 'NEW_MESSAGE',
      payload: {
        type: 'join-channel',
        data: username,
      }
    })
  }
})

export default {
  clearMessage,
  getMessages,
  sendMessage,
  joinChannel
}

