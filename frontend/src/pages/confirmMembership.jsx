import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ConfirmGroupMembershipPage = () => {
  const navigate = useNavigate();
  const {user_email, group_id} = useParams()
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(async () => {

    await axios.put(`https://group-grade-backend-5f919d63857a.herokuapp.com/api/user/confirmMembership/${user_email}/${group_id}`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    })
    .then(response => {
      setMessage("You have succesfully joined the group! Redirecting to the home page...");
      setTimeout(() => navigate('/'), 3000); // Redirect to home after a delay
    })
    .catch(error => {
      setMessage("Failed to join group. The link may be expired or invalid.");
      console.error("Verification failed:", error.response ? error.response.data : error.message);
    });
  }, [navigate]);

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Group Membership Confirmation</h1>
      <p>{message}</p>
    </div>
  );
};

export default ConfirmGroupMembershipPage;
