import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import { useNavigate } from "react-router-dom";
import "../App.css";
import axios from "axios";

// axios.defaults.baseURL = 'https://group-grade-backend-5f919d63857a.herokuapp.com';

const LoginPage = ({ setOpen }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    console.log("Login Submitted:", username, password);

    try {
      const response = await axios.post("/api/user/login", {
        email: username, //'username' field is used for email
        password: password,
      });
      console.log("Login successful:", response.data); // Debugging log

      const { email, token, name, groups, _id} = response.data;
      

      // Retrieve existing user details from local storage to keep the skills
      const existingUserData = JSON.parse(localStorage.getItem("user"));
      const skills =
        existingUserData && existingUserData.skills
          ? existingUserData.skills
          : [];

      // Store user data in localStorage with the existing or empty skills array
      localStorage.setItem(
        "user",
        JSON.stringify({ email, token, skills, name, groups, _id})
      );

      // Navigate to home page
      navigate("/home");
      setOpen(false);
    } catch (error) {
      console.error(
        "Login error:",
        error.response ? error.response.data : error
      );
      const errorMsg =
        error.response && error.response.data.detail
          ? error.response.data.detail
          : "An unexpected error occurred. Please try again.";
      setError(errorMsg);
    }
  };

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="DialogOverlay" />
      <Dialog.Content className="DialogContent">
        <Dialog.Title className="DialogTitle">
          Log In to Your Account
        </Dialog.Title>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleLogin}>
          <fieldset className="Fieldset" style={{ marginTop: "20px" }}>
            <label className="Label" htmlFor="username">
              Email:
            </label>
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
            <label className="Label" htmlFor="password">
              Password:
            </label>
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
          <div
            style={{
              display: "flex",
              marginTop: 25,
              justifyContent: "flex-end",
            }}
          >
            <button type="submit" className="Button green">
              Log In
            </button>
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
