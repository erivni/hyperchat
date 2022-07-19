import React, { Fragment, useEffect, useRef, useState } from 'react';
import './App.css';
import Home from './Home'
import System from './System'
import User from './User'
import Chat from './Chat'
import Header from './Header';
import Close from './Close';
import WebRtcClient from './webRtcClient';
import { UserDataProvider } from './UserData';

function App() {
  const homeRef = useRef(null);
  const systemRef = useRef(null);
  const userRef = useRef(null);
  const chatRef = useRef(null);
  const [connectionClosed, setConnectionClosed] = useState(true);
  const onInitialization = () => {
    scrollToElement(systemRef);
    setConnectionClosed(false);
  }
  const scrollToElement = (elemRef) => {
    if (!elemRef) {
      console.log("elemRef is null")
      return
    } if (!elemRef.current) {
      console.log("elemRef current is null")
      return
    }
    elemRef.current.scrollIntoView({ behavior: "smooth" })
  }
  const onUserDataComplete = () => {
    scrollToElement(chatRef)
  }
  const onCloseComplete = () => {
    scrollToElement(homeRef)
    setConnectionClosed(true)
  }
  const onConnected = () => {
    scrollToElement(userRef)
  }
  const onConnectionStatusMsg = ({ interrupt, fatal }) => {
    if (interrupt) {
      scrollToElement(systemRef);
    }
    if (fatal) {
      scrollToElement(homeRef);
    }
  }
  useEffect(() => {
    WebRtcClient.on('CONNECTED', onConnected)
    WebRtcClient.on('DISCONNECT', onCloseComplete)
    WebRtcClient.on('CONNECTION_STATUS_MESSAGE', onConnectionStatusMsg)
    return () => {
      WebRtcClient.off('CONNECTED', onConnected)
      WebRtcClient.off('DISCONNECT', onCloseComplete)
      WebRtcClient.off('CONNECTION_STATUS_MESSAGE', onConnectionStatusMsg)

    }
  }, [])

  return (
    <Fragment>
      <UserDataProvider>
        <Header />
        <Home onInitialization={onInitialization} ref={homeRef} />
        <System connectionClosed={connectionClosed} ref={systemRef} />
        <User ref={userRef} onUserDataComplete={onUserDataComplete} />
        {/* <Capture /> */}
        <Chat connectionClosed={connectionClosed} ref={chatRef} />
        <Close hidden={connectionClosed} />
      </UserDataProvider>
    </Fragment>
  );
}

export default App;
