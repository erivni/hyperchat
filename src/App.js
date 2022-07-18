import React, { Fragment } from 'react';
import './App.css';
import Home from './Home'
import User from './User'
import Chat from './Chat'
import Header from './Header';

function App() {
  return (
    <Fragment>
      <Header />
      <Home />
      <User />
      <Chat />
    </Fragment>
  );
}

export default App;
