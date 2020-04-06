import { TYPES } from './action'

const initialState = {
  targetUsername: '',
  isCalling: false,
  callAccepted: false,
  startCall: false,
  receiveCall: false,
};

export default function callReducers(state = initialState, action) {
  switch (action.type) {
    case TYPES.CALL:
      return {
        ...state,
        isCalling: true,
        targetUsername: action.payload,
        startCall: true
      };
    case TYPES.END_CALL:
      return {
        ...state,
        isCalling: false,
        targetUsername: '',
        startCall: false,
        receiveCall: false,
      };
    default:
      return state
  }
}