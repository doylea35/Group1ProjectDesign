import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import "../App.css";
import axios from 'axios';

axios.defaults.baseURL = 'https://group-grade-backend-5f919d63857a.herokuapp.com';

const CreateProfilePopup = ({ open, setOpen }) => {
  const [profile, setProfile] = React.useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [errors, setErrors] = React.useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    general: ""
  });

  const [successMessage, setSuccessMessage] = React.useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setProfile((prevState) => ({
      ...prevState,
      [name]: value,
    }));
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: value.trim() ? "" : `${name} is required`,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log("Form submission attempted"); // Debugging log

    let newErrors = {};
    if (!profile.name.trim()) newErrors.name = "Name is required.";
    if (!profile.email.trim()) newErrors.email = "Email is required.";
    if (!profile.password.trim()) newErrors.password = "Password is required.";
    if (profile.password !== profile.confirmPassword) newErrors.confirmPassword = "Passwords do not match.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      console.error("Validation errors:", newErrors); // Debugging log
      return;
    }

    const userData = {
      name: profile.name,
      email: profile.email,
      password: profile.password,
      groups: []  // Empty group lists for now
    };

    console.log("Sending user data to backend:", userData); // Debugging log

    try {
      const response = await axios.post('/api/user/register', userData);
      console.log("Profile Created:", response.data); // Debugging log
      if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token); // Store the token in localStorage
      console.log("Token stored");
    }
      setSuccessMessage("Profile created! Please check your email to verify your account.");
      setTimeout(() => {
        setOpen(false); // Close the popup after a delay
      }, 3000);
    } catch (error) {
      console.error("Error creating profile:", error.response ? error.response.data : error);
      const errorMessage = error.response && error.response.data.detail
        ? error.response.data.detail
        : "Failed to create profile. Please try again.";
      setErrors(prevErrors => ({ ...prevErrors, general: errorMessage }));
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="DialogOverlay" />
        <Dialog.Content className="DialogContent">
          <Dialog.Title className="DialogTitle">Create Profile</Dialog.Title>
          <Dialog.Description className="DialogDescription">
            Enter your details and click "Create Profile".
          </Dialog.Description>
          <form onSubmit={handleSubmit}>
            {errors.general && <p className="error-message">{errors.general}</p>}
            {successMessage && <p className="success-message">{successMessage}</p>}
            <fieldset className="Fieldset">
              <label className="Label" htmlFor="name">Name:</label>
              <input
                className="Input"
                id="name"
                type="text"
                name="name"
                value={profile.name}
                onChange={handleChange}
                required
              />
              {errors.name && <p className="error-message">{errors.name}</p>}
            </fieldset>
            <fieldset className="Fieldset">
              <label className="Label" htmlFor="email">Email:</label>
              <input
                className="Input"
                id="email"
                type="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
                placeholder="Please use your college email address"
                required
              />
              {errors.email && <p className="error-message">{errors.email}</p>}
            </fieldset>
            <fieldset className="Fieldset">
              <label className="Label" htmlFor="password">Password:</label>
              <input
                className="Input"
                id="password"
                type="password"
                name="password"
                value={profile.password}
                onChange={handleChange}
                required
              />
              {errors.password && <p className="error-message">{errors.password}</p>}
            </fieldset>
            <fieldset className="Fieldset">
              <label className="Label" htmlFor="confirmPassword">Confirm Password:</label>
              <input
                className="Input"
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={profile.confirmPassword}
                onChange={handleChange}
                required
              />
              {errors.confirmPassword && <p className="error-message">{errors.confirmPassword}</p>}
            </fieldset>
            <div style={{ display: "flex", marginTop: 25, justifyContent: "flex-end" }}>
              <button type="submit" className="Button green">Create Profile</button>
            </div>
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

export default CreateProfilePopup;

