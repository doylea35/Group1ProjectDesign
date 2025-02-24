import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Cross2Icon } from '@radix-ui/react-icons';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const LoginPage = ({ setOpen }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (event) => {
    event.preventDefault();
    console.log("Login Submitted:", username, password);
    navigate('/home'); // Redirect to home or dashboard
    setOpen(false);
  };

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="DialogOverlay" />
      <Dialog.Content className="DialogContent">
        <Dialog.Title className="DialogTitle">Log In to Your Account</Dialog.Title>
        <form onSubmit={handleLogin}>
        <fieldset className="Fieldset" style={{ marginTop: '20px' }}>
            <label className="Label" htmlFor="username">Username:</label>
            <input
              className="Input"
              id="username"
              type="text"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </fieldset>
          <fieldset className="Fieldset">
            <label className="Label" htmlFor="password">Password:</label>
            <input
              className="Input"
              id="password"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </fieldset>
          <div style={{ display: "flex", marginTop: 25, justifyContent: "flex-end" }}>
              <button type="submit" className="Button green">Log In</button>
            </div>
        </form>
        <Dialog.Close asChild>
          <button className="IconButton">
            <Cross2Icon />
          </button>
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  );
};

export default LoginPage;
