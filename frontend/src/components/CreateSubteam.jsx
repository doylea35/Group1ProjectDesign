import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import "../App.css";
import axios from "axios";
const CreateSubteam = ({ projectName, onCreate }) => {
  const [subteamName, setSubteamName] = useState("");
  const [members, setMembers] = useState("");
  const [errors, setErrors] = useState({});

  const user = JSON.parse(localStorage.getItem("user"));

  const handleCreateSubteam = async (event) => {
    event.preventDefault();

    let newErrors = {};
    if (!subteamName.trim())
      newErrors.subteamName = "Subteam name is required.";

    const membersArray = members
      .split(",")
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

    if (membersArray.length < 2) {
      newErrors.members = "At least 2 team members are required.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const projectFromStorage = JSON.parse(
      localStorage.getItem("selectedProject")
    );

    console.log(`projectFromStorage: ${JSON.stringify(projectFromStorage)}`);

    console.log(projectFromStorage["id"]);

    const data = {
      team_name: subteamName,
      members: membersArray,
      group: projectFromStorage["id"],
      tasks: [],
    };

    console.log(JSON.stringify(data));

    await axios
      .post("/api/subteams/createSubteam", data)
      .then((response) => {
        console.log(JSON.stringify(response));
      })
      .catch((error) => {
        console.error(error.response ? error.response.data : error.message);
      });

    // alert(
    //   `Subteam "${subteamName}" created for Project ${projectName} with members: ${members.join(
    //     ", "
    //   )}`
    // );
    // };

    // Call parent's onCreate callback with the subteam details
    // onCreate(subteamName, membersArray, projectFromStorage["id"]);

    // Reset form fields and errors
    setSubteamName("");
    setMembers("");
    setErrors({});

    // Force a full page refresh after a short delay to reflect the new subteam
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="Button violet">Create Subteam</button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="DialogOverlay" />
        <Dialog.Content className="DialogContent">
          <Dialog.Title className="DialogTitle">Create Subteam</Dialog.Title>
          <Dialog.Description className="DialogDescription">
            Create a subteam for <b>{projectName}</b>.
          </Dialog.Description>
          <form onSubmit={handleCreateSubteam}>
            <fieldset className="Fieldset">
              <label className="Label" htmlFor="subteam-name">
                Subteam Name:
              </label>
              <input
                className="Input"
                id="subteam-name"
                type="text"
                value={subteamName}
                onChange={(e) => setSubteamName(e.target.value)}
              />
              {errors.subteamName && (
                <p className="error-message">{errors.subteamName}</p>
              )}
            </fieldset>
            <fieldset className="Fieldset">
              <label className="Label" htmlFor="members">
                Members (comma-separated emails):
              </label>
              <input
                className="Input"
                id="members"
                type="text"
                value={members}
                onChange={(e) => setMembers(e.target.value)}
              />
              {errors.members && (
                <p className="error-message">{errors.members}</p>
              )}
            </fieldset>
            <div
              style={{
                display: "flex",
                marginTop: 25,
                justifyContent: "flex-end",
              }}
            >
              <button type="submit" className="Button green">
                Create Subteam
              </button>
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

export default CreateSubteam;
