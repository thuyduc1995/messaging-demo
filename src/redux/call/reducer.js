import { TYPES } from './action'

import { toResponseType } from '../../redux/socketMiddleware'

const initialState = {
  isCreate: false,
  isCalling: false,
  isReceiveInvite: false,
  callAccepted: false,
  callAnswer: null,
  startCall: false,
  callInfo: null,
  newJoined: []
};

export default function callReducers(state = initialState, action) {
  switch (action.type) {
    case TYPES.CREATE_CALL:
      return {
        ...state,
        isCreate: true,
      };
    case TYPES.START_CALL:
      return {
        ...state,
        isCalling: true,
      };
    case TYPES.LEAVE_CALL:
      return {
        ...state,
        isCalling: false,
        callAccepted: false,
        callAnswer: null,
      };
    case toResponseType('CALL_CREATED'):
      return {
        ...state,
        isReceiveInvite: true,
        callInfo: action.payload.callStarted
      };
    case toResponseType('JOIN_ACCEPTED'):
      if (!action.payload.sdpAnswer) return state
      return {
        ...state,
        callAccepted: true,
        callAnswer: action.payload.joinCallResponse
      };
    case toResponseType('CALL_STOPPED'):
      return {
        ...state,
        isCalling: false,
        callAccepted: false,
        callAnswer: null,
        isReceiveInvite: false
      };
    case toResponseType('NEW_JOIN_CALL'):
      return {
        ...state,
        newJoined: [...state.newJoined, action.payload.callJoined.newParticipant]
      };
    default:
      return state
  }
}