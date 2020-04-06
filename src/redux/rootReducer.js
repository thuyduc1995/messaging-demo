import { combineReducers } from "redux";

import { reducers as homeReducers } from './home'
import { reducers as listingReducers } from './listing'
import { reducers as websocketReducers } from './websocket'
import { reducers as callReducers } from './call'

export default combineReducers({
  home: homeReducers,
  listing: listingReducers,
  websocket: websocketReducers,
  call: callReducers,
})
