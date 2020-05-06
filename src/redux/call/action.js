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
  STOP_CALL: 'STOP_CALL',
  START_BROADCAST: 'START_BROADCAST',
  STOP_BROADCAST: 'STOP_BROADCAST',
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
    onSuccess: (dispatch, getState) => {
      const state = getState()
      dispatch({
        type: 'NEW_MESSAGE',
        payload: {
          type: 'join-call',
          data: {
            offer,
            callInfo: state.call.callInfo
          },
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


const leaveCall = () => createAction({
  type: TYPES.LEAVE_CALL,
  onSuccess: (dispatch, getState) => {
    const state = getState()
    const { callId } = state.call.callInfo
    dispatch({
      type: 'NEW_MESSAGE',
      payload: {
        type: 'leave-call',
        data: callId,
      }
    })
  }
});

const stopCall = () => createAction({
  type: TYPES.STOP_CALL,
  onSuccess: (dispatch, getState) => {
    const state = getState()
    const { callId } = state.call.callInfo
    dispatch({
      type: 'NEW_MESSAGE',
      payload: {
        type: 'stop-call',
        data: callId,
      }
    })
  }
})

const startBroadcast = () => createAction({
  type: TYPES.START_BROADCAST,
  onSuccess: (dispatch, getState) => {
    const state = getState()
    const { callId } = state.call.callInfo
    dispatch({
      type: 'NEW_MESSAGE',
      payload: {
        type: 'start-broadcast',
        data: callId,
      }
    })
  }
})

const stopBroadcast = () => createAction({
  type: TYPES.STOP_BROADCAST,
  onSuccess: (dispatch, getState) => {
    const state = getState()
    const { callId } = state.call.callInfo
    dispatch({
      type: 'NEW_MESSAGE',
      payload: {
        type: 'stop-broadcast',
        data: callId,
      }
    })
  }
})

export default {
  call,
  leaveCall,
  startCall,
  joinCall,
  sendIceCandidate,
  stopCall,
  startBroadcast,
  stopBroadcast,
}

export { TYPES, call }