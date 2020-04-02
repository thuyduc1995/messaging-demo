import config from 'configs'
import { makeRequest } from "utils/request";

const toRequest = (type) => `${type}_REQUEST`;
const toSuccess = (type) => `${type}_SUCCESS`;
const toError = (type) => `${type}_ERROR`;

const makeAction = transform => (
  {type, payload, meta},
  response
) => ({
  type: transform(type),
  payload: response || payload,
  meta: {...(meta || {})}
});

const makeRequestAction = makeAction(toRequest);
const makeSuccessAction = makeAction(toSuccess);
const makeErrorAction = makeAction(toError);

const createRequestUrl = ({ url, absolute }) => {
  if (absolute) {
    return url
  }
  return config.API_URL + url
};

const createRequestParams = ({ method, body, params, headers: optionHeaders }) => {
  const hasBody = !!body;
  const headers = {
    ...optionHeaders
  };
  if (hasBody) {
    headers["Content-Type"] = "application/json; charset=UTF-8";
  }

  return {
    headers,
    params,
    method,
    body: hasBody ? JSON.stringify(body) : body
  }
};

const validateResponse = (response, absolute) => {
  if (!absolute) {
    if (!response.success) {
      throw new Error(JSON.stringify(response));
    }
  }

  return response;
};

const createAsyncActions = action => async (dispatch, getState) => {
  const { payload, onSuccess, onError } = action;
  if (!payload || typeof payload.url !== "string") {
    console.error("The request url not exist");
    return false;
  }

  dispatch(makeRequestAction(action));
  const { url, method, body, params, options, headers, absolute = false } = payload;

  try {
    const requestUrl = createRequestUrl({ url, ...options, absolute })
    const requestData = createRequestParams({ method, body, params, headers });
    const response = await makeRequest({ ...requestData, url: requestUrl });
    validateResponse(response, absolute);

    if (typeof onSuccess === "function") {
      onSuccess(dispatch, response);
    }

    return dispatch(makeSuccessAction(action, response));
  } catch (e) {
    const error = JSON.parse(e.message);
    if (typeof onError === "function") {
      onError(dispatch, error, getState);
    }

    return dispatch(makeErrorAction(action, error));
  }
};

const createAction = action => (dispatch, getState) => {
  const { type, payload, onSuccess } = action
  try {
    dispatch({ type, payload })
    if (typeof onSuccess === 'function') {
      onSuccess(dispatch, getState)
    }
  } catch (e) {
    return e
  }
};

export {
  createAction,
  createAsyncActions,
  toError,
  toRequest,
  toSuccess
}
