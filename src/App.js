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

const Views = {
  HOME: "HOME",
  SYSTEM: "SYSTEM",
  USER: "USER",
  CHAT: "CHAT",
}

function App() {
  const homeRef = useRef(null);
  const systemRef = useRef(null);
  const userRef = useRef(null);
  const chatRef = useRef(null);
  const RefIDs = {
    "HOME": homeRef,
    "SYSTEM": systemRef,
    "USER": userRef,
    "CHAT": chatRef
  }
  const [connectionClosed, setConnectionClosed] = useState(true);
  const [currentViewId, setCurrentViewId] = useState(Views.HOME);

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
  const onInitialization = () => {
    setCurrentViewId(Views.SYSTEM);
    setConnectionClosed(false);
  }
  const onUserDataComplete = () => {
    setCurrentViewId(Views.CHAT)
  }
  const onCloseComplete = () => {
    setCurrentViewId(Views.HOME)
    setConnectionClosed(true)
  }
  const onConnected = () => {
    setCurrentViewId(Views.USER)
  }
  const onConnectionStatusMsg = ({ interrupt, fatal }) => {
    if (interrupt) {
      setCurrentViewId(Views.SYSTEM);
    }
    if (fatal) {
      setCurrentViewId(Views.HOME);
    }
  }

  useEffect(() => {
    console.log(`scrolled to element, current view is ${currentViewId}`)
    scrollToElement(RefIDs[currentViewId])
  }, [currentViewId])

  const handleResize = () => {
    console.log(`resize event called, current view is ${currentViewId}`)
    scrollToElement(RefIDs[currentViewId]);
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

  useEffect(() => {
    console.log("resize useEffect called")
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [handleResize])

  return (
    <Fragment>
      <UserDataProvider>
        <Header />
        <Home onInitialization={onInitialization} ref={homeRef} />
        <System connectionClosed={connectionClosed} ref={systemRef} />
        <User connectionClosed={connectionClosed} ref={userRef} onUserDataComplete={onUserDataComplete} />
        {/* <Capture /> */}
        <Chat connectionClosed={connectionClosed} ref={chatRef} />
        <Close hidden={connectionClosed} />
      </UserDataProvider>
    </Fragment>
  );
}

export default App;
