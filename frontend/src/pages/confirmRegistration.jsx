import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const RegistrationPage = () => {
  const navigate = useNavigate();
  const {confirmationCode} = useParams(confirmationCode)
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {

    axios.get(`https://group-grade-backend-5f919d63857a.herokuapp.com/api/user/confirm/${confirmationCode}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    })
    .then(response => {
      setMessage("Your email has been successfully verified! Redirecting to the home page...");
      setTimeout(() => navigate('/home'), 3000); // Redirect to home after a delay
    })
    .catch(error => {
      setMessage("Failed to verify email. The link may be expired or invalid.");
      console.error("Verification failed:", error.response ? error.response.data : error.message);
    });
  }, [navigate]);

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Email Verification</h1>
      <p>{message}</p>
    </div>
  );
};

export default RegistrationPage;
