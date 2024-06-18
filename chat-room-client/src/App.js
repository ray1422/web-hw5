import React, { useState, useEffect } from 'react';
import Login from './Login';
import Chat from './Chat';
import socket from './Socket';

const App = () => {
  const [username, setUsername] = useState('');
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    console.log('connecting...');
    socket.on('connect', () => {
      setConnected(true);
    });
    socket.connect();
    return () => {
      console.log('disconnecting...');
      socket.disconnect();
    };
  }, []);

  if (!connected) {
    return <div>Connecting...</div>;
  }
  return (
    <div>
      {username ? <Chat username={username} /> : <Login setUsername={setUsername} />}
    </div>
  );
};

export default App;