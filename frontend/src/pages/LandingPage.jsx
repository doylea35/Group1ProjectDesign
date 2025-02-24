import React, { useState } from "react";
import '../App.css';
import CreateProfilePopup from '../components/CreateProfile';
import LoginPage from "../components/LoginPage";
import * as Dialog from '@radix-ui/react-dialog';

export default function LandingPage() {
  const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false);
  const [isLoginPopupOpen, setIsLoginPopupOpen] = useState(false);  

  const handleLoginClick = () => {
    setIsLoginPopupOpen(true);
    console.log("Opening Login Popup");
  };

  const handleCreateProfileClick = () => {
    setIsProfilePopupOpen(true);
    console.log("Opening Create Profile Popup");
  };

  return (
    <div className="landing-container">
      <div className="landing-card">
        <img src="/hexlogo.png" alt="GroupGrade Logo" className="logo" />
        <h1 className="heading-main">GroupGrade</h1>
        <h2 className="heading-sub">Teamwork Made Easy</h2>
         <button className="button login-button" onClick={handleLoginClick}>
          Log In
        </button>
        <button className="button create-account-button" onClick={handleCreateProfileClick}>
          Create a Profile
        </button>

        <Dialog.Root open={isLoginPopupOpen} onOpenChange={setIsLoginPopupOpen}>
          <LoginPage setOpen={setIsLoginPopupOpen} />
        </Dialog.Root>
        <Dialog.Root open={isProfilePopupOpen} onOpenChange={setIsProfilePopupOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="DialogOverlay" />
            <Dialog.Content className="DialogContent">
              <CreateProfilePopup open={isProfilePopupOpen} setOpen={setIsProfilePopupOpen} />
              <Dialog.Close asChild>
                <button className="close-btn">Close</button>
              </Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </div>
  );
}

