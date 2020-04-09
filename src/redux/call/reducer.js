import { TYPES } from './action'

import { toResponseType } from '../../redux/socketMiddleware'

const initialState = {
  isCalling: false,
  isReceiveInvite: false,
  callAccepted: false,
  callAnswer: null,
  startCall: false,
  owner: null,
  newJoined: []
};

export default function callReducers(state = initialState, action) {
  switch (action.type) {
    case TYPES.CREATE_CALL:
      return {
        ...state,
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
        isReceiveInvite: false,
        callAccepted: false,
        callAnswer: null,
      };
    case toResponseType('CALL_CREATED'):
      return {
        ...state,
        isReceiveInvite: true,
        owner: action.payload.voiceCallCreated.ownerId
      };
    case toResponseType('JOIN_ACCEPTED'):
      return {
        ...state,
        callAccepted: true,
        callAnswer: action.payload.voiceCallJoinAccepted
      };
    case toResponseType('NEW_JOIN_CALL'):
      return {
        ...state,
        newJoined: [...state.newJoined, action.payload.voiceCallJoined.participant]
      };
    default:
      return state
  }
}