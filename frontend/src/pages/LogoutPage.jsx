import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../App.css';

const LogoutPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/');
    }, 3000); 

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="logout-container">
      <h1 className="logout-title">You have been logged out</h1>
      <p className="logout-message">
        Thank you for using GroupGrade. You will be redirected shortly.
      </p>
    </div>
  );
};

export default LogoutPage;
