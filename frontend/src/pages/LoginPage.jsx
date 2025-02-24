import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Cross2Icon } from '@radix-ui/react-icons';
import '../App.css';

const LoginPage = () => {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [open, setOpen] = React.useState(false);

  const handleLogin = (event) => {
    event.preventDefault();
    console.log("Login Submitted:", username, password);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="Button violet">Log In</button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="DialogOverlay" />
        <Dialog.Content className="DialogContent">
          <Dialog.Title className="DialogTitle">Login to GroupGrade</Dialog.Title>
          <Dialog.Description className="DialogDescription">
            Enter your username and password below.
          </Dialog.Description>
          <form onSubmit={handleLogin} className="login-form">
            <label htmlFor="username" className="form-label">Username:</label>
            <input
              type="text"
              id="username"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <label htmlFor="password" className="form-label">Password:</label>
            <input
              type="password"
              id="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" className="Button green">Log In</button>
          </form>
          <Dialog.Close asChild>
            <button className="IconButton" aria-label="Close">
              <Cross2Icon />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default LoginPage;
