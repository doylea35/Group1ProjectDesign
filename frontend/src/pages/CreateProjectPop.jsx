import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import axios from "axios";
import "../App.css";

const API_URI = "/api/group/"; 

/**
 * @desc Simulated GET request to fetch user profile for testing
 * @route GET /api/users/profile
 * @access private
 */
const fetchUserProfile = async () => {
  // For testing, always use this default user
  const user = { email: "nzhang@tcd.ie", token: null }; 

  /*
  // Original Code (Uncomment after testing)
  let user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    user = { email: "nzhang@tcd.ie", token: null };
  }
  const token = user?.token;
  const config = { headers: { Authorization: token ? `Bearer ${token}` : "" } };
  try {
    const res = await axios.get("/api/users/profile", config);
    return res.data;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
  */
  
  return user;
};

/**
 * @desc POST request to create a new project
 * @route POST /api/projects/create
 * @access private
 */
const createProject = async (projectData) => {
  console.log("Sending project data:", projectData); // Debugging log

  const config = {
    headers: {
      "Content-Type": "application/json", // Ensure correct format
      Authorization: "", // No token needed in test mode
    },
  };

  try {
    const res = await axios.post(API_URI + "create", projectData, config);
    return res.data;
  } catch (err) {
    console.error("Error creating project:", err.response?.data || err.message);
    throw err;
  }
};

const CreateNewProjectPop = () => {
  const [projectName, setProjectName] = React.useState("");
  const [members, setMembers] = React.useState("");
  const [userEmail, setUserEmail] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    const getUserEmail = async () => {
      try {
        const userData = await fetchUserProfile();
        setUserEmail(userData.email);
        setMembers(userData.email); 
      } catch (err) {
        console.error("Error fetching user:", err.response?.data || err.message);
        setError("Failed to load user profile.");
      } finally {
        setLoading(false);
      }
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

      // Reset form
      setProjectName("");
      setMembers(userEmail);
    } catch (err) {
      setError("Failed to create project. Try again.");
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
            {error && <p className="error">{error}</p>}
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
              <Dialog.Close asChild>
                <button type="submit" className="Button green">Create Project</button>
              </Dialog.Close>
            </div>
          </form>
        )}

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
