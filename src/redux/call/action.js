import { createAction } from "utils/actionUtils";

const TYPES = {
  CREATE_CALL: 'CREATE_CALL',
  END_CALL: 'END_CALL',
  LEAVE_CALL: 'LEAVE_CALL',
  JOIN_CALL: 'JOIN_CALL',
  RECEIVE_CALL: 'RECEIVE_CALL',
  CALL_ANSWER: 'CALL_ANSWER',
  START_CALL: 'START_CALL',
  SEND_ICE: 'SEND_ICE',
};

const call = () =>
  createAction({
    type: TYPES.CREATE_CALL,
    // payload: {},
    onSuccess: (dispatch) => {
      dispatch({
        type: 'NEW_MESSAGE',
        payload: {
          type: 'create-call'
        }
      })
    }
  });

const startCall = () =>
  createAction({
    type: TYPES.START_CALL
  })

const joinCall = (offer) =>
  createAction({
    type: TYPES.JOIN_CALL,
    onSuccess: (dispatch) => {
      dispatch({
        type: 'NEW_MESSAGE',
        payload: {
          type: 'join-call',
          data: offer,
        }
      })
    }
  })

const sendIceCandidate = (ice) =>
  createAction({
    type: TYPES.SEND_ICE,
    onSuccess: (dispatch) => {
      dispatch({
        type: 'NEW_MESSAGE',
        payload: {
          type: 'new-ice-candidate',
          data: ice,
        }
      })
    }
  })


const leaveCall = (username) => createAction({
  type: TYPES.LEAVE_CALL,
  onSuccess: (dispatch) => {
    dispatch({
      type: 'NEW_MESSAGE',
      payload: {
        type: 'leave-call',
        data: username,
      }
    })
  }
});

export default {
  call,
  leaveCall,
  startCall,
  joinCall,
  sendIceCandidate
}

export { TYPES, call }