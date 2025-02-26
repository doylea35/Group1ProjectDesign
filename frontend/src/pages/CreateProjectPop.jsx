import * as React from "react";
import { useNavigate } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import axios from "axios";
import "../App.css";

const API_URI = "/api/group/"; 

/**
 * @desc POST request to create a new project
 * @route POST /api/projects/create
 * @access private
 */
const createProject = async (projectData) => {
  try {
    const res = await axios.post(API_URI + "create", projectData, {
      headers: {
        "Content-Type": "application/json", // Ensure proper content type
      },
    });
    return res.data;
  } catch (err) {
    console.error("Error creating project:", err.response?.data || err.message);
    if (err.response) {
      console.error("Error response status:", err.response.status);
      console.error("Error response data:", err.response.data);
    }
    throw err; // Re-throw the error
  }
};

const CreateNewProjectPop = () => {
  const [projectName, setProjectName] = React.useState("");
  const [members, setMembers] = React.useState("");
  const [userEmail, setUserEmail] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const navigate = useNavigate(); // Hook to navigate programmatically

  React.useEffect(() => {
    const getUserEmail = () => {
      const user = JSON.parse(localStorage.getItem("user")); // Retrieve the user from localStorage
      console.log("User from localStorage:", user); // Debugging log
      if (user && user.email) {
        setUserEmail(user.email); // Set the email if it's available
        setMembers(user.email);   // Automatically add the user's email to the members list
      } else {
        setError("Failed to load user profile. No user data found.");
      }
      setLoading(false); // Set loading to false once data is fetched
    };

    getUserEmail(); // Get user email
  }, []);

  const handleCreateProject = async (event) => {
    event.preventDefault();

    const membersArray = members
      ? members.split(",").map((email) => email.trim())
      : [];

    // Ensure the user's email is added to the list of members
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

      // Redirect to the newly created project page
      navigate(`/projects/${createdProject._id}`);

      // Reset form fields after creation
      setProjectName("");
      setMembers(userEmail); // Reset the members input after creation
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
              <label className="Label" htmlFor="projectname">Project Name</label>
              <input
                className="Input"
                id="projectname"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
              />
            </fieldset>
            <fieldset className="Fieldset">
              <label className="Label" htmlFor="emails">Team Member Emails</label>
              <input
                className="Input"
                id="emails"
                value={members}
                onChange={(e) => setMembers(e.target.value)}
                placeholder="Enter comma-separated emails (Your email is auto-added)"
              />
            </fieldset>
            <div style={{ display: "flex", marginTop: 25, justifyContent: "flex-end" }}>
              <button type="submit" className="Button green">Create Project</button>
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
