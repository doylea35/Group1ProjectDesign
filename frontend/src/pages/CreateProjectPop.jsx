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
  console.log("fetchUserProfile function called"); // Debugging log
  const user = { email: "nzhang@tcd.ie", token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3YmJhMzkxZjBiYzhhOGYzN2YzYWNjOCIsImVtYWlsIjoibnpoYW5nQHRjZC5pZSJ9.1hbzE78aogZ5Qqyb2SqMBz2N0Wlx10X72XgSnbFV3yU" };

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
  
  console.log("Returning user data:", user); // Debugging log
  return user;
};

/**
 * @desc POST request to create a new project
 * @route POST /api/projects/create
 * @access private
 */
const createProject = async (projectData) => {
  console.log("createProject function called"); // Debugging log
  console.log("Sending project data:", projectData); // Debugging log

  try {
    // Send the project data in JSON format
    const res = await axios.post(API_URI + "create", projectData, {
      headers: {
        "Content-Type": "application/json", // Make sure the correct content type is set
      },
    });
    console.log("Project created successfully:", res.data); // Debugging response
    return res.data;
  } catch (err) {
    console.error("Error creating project:", err.response?.data || err.message);
    // Enhanced error details
    if (err.response) {
      console.error("Error response status:", err.response.status);
      console.error("Error response data:", err.response.data);
    }
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
    console.log("useEffect called - fetching user profile"); // Debugging log
    const getUserEmail = async () => {
      try {
        console.log("Fetching user data...");
        const userData = await fetchUserProfile();
        console.log("User data fetched:", userData); // Debugging log
        setUserEmail(userData.email);
        setMembers(userData.email); 
      } catch (err) {
        console.error("Error fetching user:", err.response?.data || err.message);
        setError("Failed to load user profile.");
      } finally {
        setLoading(false);
        console.log("useEffect finished"); // Debugging log
      }
    };

    getUserEmail();
  }, []);

  const handleCreateProject = async (event) => {
    console.log("handleCreateProject function was called");
  
    event.preventDefault();  // Prevent form default behavior
  
    // Check if the event.preventDefault() works properly by logging
    console.log("Form submission prevented");
  
    const membersArray = members
      ? members.split(",").map((email) => email.trim())
      : [];
  
    // Ensure the user email is added to the members list
    if (!membersArray.includes(userEmail)) {
      membersArray.unshift(userEmail);
    }
  
    const projectData = {
      creator_email: userEmail,
      group_name: projectName,
      members: membersArray,
    };
  
    console.log("Project data to send:", projectData);  // Log project data before sending
  
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
          <form onSubmit={(e) => { 
            console.log("Form submitted", e);
            handleCreateProject(e); // Calling your existing handler
          }}>
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
