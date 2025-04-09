import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const ConfirmGroupMembershipPage = () => {
  const navigate = useNavigate();
  const { user_email, group_id } = useParams();
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    axios
      .get(`/api/group/confirmMembership/${user_email}/${group_id}`)
      .then((response) => {
        if (response.data.detail.emailNotRegistered) {
          localStorage.setItem(
            "confirmGroupMemebershipDetails",
            JSON.stringify({ group_id, user_email })
          );
          setMessage(
            "You've been invited to a GroupGrade Project. Create an account to join."
          );
          setTimeout(() => navigate("/"), 3000);
        } else {
          setMessage(
            "You have succesfully joined the group! Redirecting to the home page..."
          );
          setTimeout(() => navigate("/"), 3000); // Redirect to home after a delay
        }
      })
      .catch((error) => {
        setMessage("");
        console.error(
          "Verification failed:",
          error.response ? error.response.data : error.message
        );
      });
  }, [navigate]);

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>Group Membership Confirmation</h1>
      <p>{message}</p>
    </div>
  );
};

export default ConfirmGroupMembershipPage;
