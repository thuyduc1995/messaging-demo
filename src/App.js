import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from "react-router-dom";
import store from 'redux/store'
import WebSocketConnection from "./pages/Wrapper/WebsocketWrapper";
import MainLayout from 'components/MainLayout/MainLayout'
import Message from 'components/Notification'
import './App.css';
import 'antd/dist/antd.css';

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <WebSocketConnection host={'ws://127.0.0.1:5795'}>
          <MainLayout/>
          <Message />
        </WebSocketConnection>
      </BrowserRouter>
    </Provider>
  )
}

export default App;
