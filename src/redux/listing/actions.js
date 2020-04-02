import { createAsyncActions } from 'utils/actionUtils';

const TYPES = {
  FETCH_DEVICES: 'FETCH_DEVICES'
};

const fetchDevices = () =>
  createAsyncActions({
    type: TYPES.FETCH_DEVICES,
    payload: {
      url: '/devices',
    }
  });


export { TYPES }

export default { fetchDevices }
