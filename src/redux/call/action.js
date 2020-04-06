import { createAsyncActions, createAction } from "utils/actionUtils";

const TYPES = {
  CALL: 'CALL',
  END_CALL: 'END_CALL'
};

const call = (target) =>
  createAction({
    type: TYPES.CALL,
    payload: target
  });

const endCall = () => createAction({
  type: TYPES.END_CALL,
});

export default {
  call,
  endCall,
}

export { TYPES, call }