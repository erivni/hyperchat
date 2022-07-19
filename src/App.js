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
  const chatRef = useRef(null);;
  const [closeButtonHidden, setCloseButtonHidden] = useState(true);
  const onInitialization = () => {
    scrollToElement(systemRef);
    setCloseButtonHidden(false);
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
    setCloseButtonHidden(true)
    scrollToElement(homeRef)
  }
  const onConnected = () => {
    scrollToElement(userRef)
  }
  const onInterruptMsg = (msg) => {
    scrollToElement(systemRef);
  }
  useEffect(() => {
    WebRtcClient.on('CONNECTED', onConnected)
    WebRtcClient.on('DISCONNECT', onInterruptMsg)
  }, [])

  return (
    <Fragment>
      <UserDataProvider>
        <Header />
        <Home onInitialization={onInitialization} ref={homeRef} />
        <System ref={systemRef} />
        <User ref={userRef} onUserDataComplete={onUserDataComplete} />
        {/* <Capture /> */}
        <Chat ref={chatRef} />
        <Close hidden={closeButtonHidden} onCloseComplete={onCloseComplete} />
      </UserDataProvider>
    </Fragment>
  );
}

export default App;
