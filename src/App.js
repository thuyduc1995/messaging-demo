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
        <WebSocketConnection host={'ws://192.168.1.213:5795'}>
        {/*<WebSocketConnection host={'wss://jambo.qa.evidence.com/api/v1/socket'}>*/}
        <MainLayout/>
          <Message />
        </WebSocketConnection>
      </BrowserRouter>
    </Provider>
  )
}

export default App;
