import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import axios from "axios";
import "../App.css";

const API_URI = "/api/group/";

const createProject = async (projectData) => {
  try {
    const res = await axios.post(API_URI + "create", projectData, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return res.data;
  } catch (err) {
    console.error("Error creating project:", err.response?.data || err.message);
    throw err;
  }
};

const CreateNewProjectPop = ({ onSuccess }) => {
  const [projectName, setProjectName] = React.useState("");
  const [members, setMembers] = React.useState("");
  const [userEmail, setUserEmail] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    const getUserEmail = () => {
      const user = JSON.parse(localStorage.getItem("user"));
      if (user && user.email) {
        setUserEmail(user.email);
        setMembers(user.email); // auto-add the user's email
      } else {
        setError("Failed to load user profile. No user data found.");
      }
      setLoading(false);
    };
    getUserEmail();
  }, []);

  const handleCreateProject = async (event) => {
    event.preventDefault();

    const membersArray = members
      ? members.split(",").map((email) => email.trim())
      : [];
    if (!membersArray.includes(userEmail)) {
      membersArray.unshift(userEmail);
    }

    const projectData = {
      creator_email: userEmail,
      group_name: projectName,
      members: membersArray,
    };

    try {
      const createdProject = await createProject(projectData);
      console.log("Project Created:", createdProject);

      // Extract the project ID from the response
      const projectId =
        createdProject._id ||
        createdProject.id ||
        (createdProject.data && (createdProject.data._id || createdProject.data.id));

      if (!projectId) {
        throw new Error("Project ID is missing in the response");
      }

      // Optionally save the new project in localStorage
      localStorage.setItem("selectedProject", JSON.stringify(createdProject));

      // Close the dialog immediately
      if (onSuccess) {
        onSuccess();
      }
      // Force a full page refresh after a short delay so the sidebar updates
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err) {
      setError("Failed to create project. Please try again.");
    }
  };

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="DialogOverlay" />
      <Dialog.Content className="DialogContent">
        <Dialog.Title className="DialogTitle">Create New Project</Dialog.Title>
        <Dialog.Description className="DialogDescription">
          Enter project details and click "Create Project".
        </Dialog.Description>

        {loading ? (
          <p>Loading profile...</p>
        ) : (
          <form onSubmit={handleCreateProject}>
            <fieldset className="Fieldset">
              <label className="Label" htmlFor="projectname">
                Project Name
              </label>
              <input
                className="Input"
                id="projectname"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
              />
            </fieldset>
            <fieldset className="Fieldset">
              <label className="Label" htmlFor="emails">
                Team Member Emails
              </label>
              <input
                className="Input"
                id="emails"
                value={members}
                onChange={(e) => setMembers(e.target.value)}
                placeholder="Enter comma-separated emails (Your email is auto-added)"
              />
            </fieldset>
            <div style={{ display: "flex", marginTop: 25, justifyContent: "flex-end" }}>
              <button type="submit" className="Button green">
                Create Project
              </button>
            </div>
          </form>
        )}

        {error && <p className="ErrorMessage">{error}</p>}

        <Dialog.Close asChild>
          <button className="IconButton" aria-label="Close">
            <Cross2Icon />
          </button>
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  );
};

export default CreateNewProjectPop;
