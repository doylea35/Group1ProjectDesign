import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const ConfirmGroupMembershipPage = () => {
    const navigate = useNavigate();
    const { user_email, group_id } = useParams();
    const [message, setMessage] = useState("Verifying your email...");

    useEffect(() => {
        if (user_email === 'notRegistered') {
            setMessage("You've been invited to a GroupGrade Project. Create an account to join.");
            setTimeout(() => navigate('/'), 3000);
        }
        else {
            axios
                .get(
                    `/api/group/confirmMembership/${user_email}/${group_id}`
                )
                .then((response) => {
                    setMessage(
                        "You have succesfully joined the group! Redirecting to the home page..."
                    );
                    setTimeout(() => navigate("/"), 3000); // Redirect to home after a delay
                })
                .catch((error) => {
                    setMessage("Failed to join group. The link may be expired or invalid.");
                    console.error(
                        "Verification failed:",
                        error.response ? error.response.data : error.message
                    );
                });
        }

    }, [navigate]);

    return (
        <div style={{ padding: "20px", textAlign: "center" }}>
            <h1>Group Membership Confirmation</h1>
            <p>{message}</p>
        </div>
    );
};

export default ConfirmGroupMembershipPage;
