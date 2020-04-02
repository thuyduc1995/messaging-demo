import { createAction } from "utils/actionUtils";

const clearMessage = () => createAction({ type: 'CLEAR MESSAGE' });

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

export default {
  clearMessage,
  getMessages,
  sendMessage
}

