import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const RegistrationPage = () => {
  const { confirmationCode } = useParams(); // Get the confirmation code from the URL
  const navigate = useNavigate();
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    axios.get(`/api/user/confirm/${confirmationCode}`)
      .then(response => {
        setMessage("Your email has been successfully verified! Redirecting to the home page...");
        setTimeout(() => navigate('/home'), 3000); // Redirect to home after a delay
      })
      .catch(error => {
        setMessage("Failed to verify email. The link may be expired or invalid.");
      });
  }, [confirmationCode, navigate]);

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Email Verification</h1>
      <p>{message}</p>
    </div>
  );
};

export default RegistrationPage;
