import { createStore, applyMiddleware, compose } from 'redux'
import thunk from 'redux-thunk';
import socketMiddleware from "./socketMiddleware";

import rootReducer from './rootReducer'

// const env = process.env;

// const preloadState = {
//   application: {
//     env
//   }
// };

// const store = createStore(rootReducer, preloadState, applyMiddleware(thunk));

const middleware = [thunk, socketMiddleware]
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(rootReducer, /* preloadedState, */ composeEnhancers(
  applyMiddleware(...middleware)
));
export default store;
