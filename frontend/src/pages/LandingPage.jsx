import React from 'react';
import { Link } from 'react-router-dom';
import '../App.css'; 

export default function LandingPage() {
  return (
    <div className="landing-container">
      <div className="landing-card">
        <img src="/hexlogo.png" alt="GroupGrade Logo" className="logo" />
        <h1 className="heading-main">GroupGrade</h1>
        <h2 className="heading-sub">Teamwork Made Easy</h2>
        <Link to="/login">
          <button className="button login-button">
            Log In
          </button>
        </Link>
        <Link to="/create-profile">
        <button className="button create-account-button">
          Create a Profile
        </button>
        </Link>
      </div>
    </div>
  );
}
