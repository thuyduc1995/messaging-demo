import axios from 'axios';

export const makeRequest = async ({ url, headers, method = 'get', body, params, ...options }) => {
  try {
    return await axios.request({
      url,
      headers,
      method,
      data: body || {},
      params: params || {},
      ...options
    })
  } catch (e) {
    throw e
  }
};
