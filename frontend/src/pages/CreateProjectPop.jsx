import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import "./styles.css";

const CreateNewProjectPop = () => {
  const [projectName, setProjectName] = React.useState("");
  const [members, setMembers] = React.useState(""); 
  const [userEmail, setUserEmail] = React.useState(""); 
  const [loading, setLoading] = React.useState(true); 

  // Use the email from the logged in profile as autofilled for the group
  React.useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch("/users/profile"); 
        if (!response.ok) {
          throw new Error("User profile not found");
        }

        const userData = await response.json();
        setUserEmail(userData.email); 
        setMembers(userData.email); 
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleCreateProject = async (event) => {
    event.preventDefault();
  
    const membersArray = members
      ? members.split(",").map((email) => email.trim())
      : [];
  
    if (!membersArray.includes(userEmail)) {
      membersArray.unshift(userEmail);
    }
  
    await fetch("/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creator_email: userEmail,
        group_name: projectName,
        members: membersArray,
      }),
    });
  
    setProjectName("");
    setMembers(userEmail);
  };
  

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="Button violet">Create New Project</button>
      </Dialog.Trigger>
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
    </Dialog.Root>
  );
};

export default CreateNewProjectPop;



