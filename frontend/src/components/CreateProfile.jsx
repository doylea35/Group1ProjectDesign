import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import "../App.css";

const CreateProfilePopup = ({ open, setOpen }) => {
  const [profile, setProfile] = React.useState({
    name: "",
    email: "",
  });

  const [errors, setErrors] = React.useState({ name: "", email: "" });
  const [submitted, setSubmitted] = React.useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setProfile((prevState) => ({
      ...prevState,
      [name]: value,
    }));
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: value.trim() ? "" : prevErrors[name],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    let newErrors = {};

    if (!profile.name.trim()) {
      newErrors.name = "Name is required.";
    }

    if (!profile.email.trim()) {
      newErrors.email = "Email is required.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    console.log("Profile Created:", profile);
    alert("Profile created successfully!");

    setProfile({ name: "", email: "" });
    setErrors({ name: "", email: "" });
    setSubmitted(true);
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
