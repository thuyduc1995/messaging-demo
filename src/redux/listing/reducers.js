import { toRequest, toSuccess, toError } from "utils/actionUtils";
import { TYPES } from './actions'

const initialState = {
  devices: [],
  isLoading: false,
  page: 0,
  limit: 10,
  total: 0,
  errors: {}
};

export default function listingReducers(state = initialState, action) {
  switch (action.type) {
    case toRequest(TYPES.FETCH_DEVICES):
      return {
        ...state,
        isLoading: true
      };
    case toSuccess(TYPES.FETCH_DEVICES):
      const { payload } = action
      return {
        ...state,
        isLoading: false,
        devices: payload.data,
        ...payload
      };
    case toError(TYPES.FETCH_DEVICES):
      return {
        ...state,
        isLoading: false,
      };
    default:
      return state
  }
}
