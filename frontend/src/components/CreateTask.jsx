import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import axios from "axios";
import "../App.css";

const CreateTask = ({ projectName, projectId, onCreate }) => {
    const [taskName, setTaskName] = useState("");
    const [taskDescription, setTaskDescription] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [selectedSubteams, setSelectedSubteams] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [errors, setErrors] = useState({});
    const [members, setMembers] = useState([]); // Members will be fetched from backend

    const subteams = ["Frontend Subteam", "Backend Subteam"];

    useEffect(() => {
        console.log("CreateTask component mounted. Checking projectId:", projectId);
    
        const fetchMembers = async () => {
            try {
                const user = JSON.parse(localStorage.getItem("user"));
                if (!user || !user.token) {
                    console.error("User not authenticated.");
                    return;
                }
        
                console.log("Fetching all groups for the user...");
        
                // Fetch all groups
                const response = await axios.get("/api/group/", {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
        
                console.log("API Response:", response.data);
        
                if (response.data?.data) {
                    // Find the project with matching projectId
                    const project = response.data.data.find(p => p._id === projectId);
        
                    if (project) {
                        setMembers(project.members || []);
                        console.log("Members set:", project.members);
                    } else {
                        console.error("Project not found in response.");
                    }
                } else {
                    console.error("Invalid response format:", response.data);
                }
            } catch (error) {
                console.error("Error fetching members:", error);
            }
        };
        
        
    
        if (projectId) {
            fetchMembers();
        } else {
            console.warn("Project ID is missing, not fetching members.");
        }
    }, [projectId]); // Runs when projectId changes
    

    const toggleSubteam = (subteam) => {
        setSelectedSubteams((prev) =>
            prev.includes(subteam) ? prev.filter((s) => s !== subteam) : [...prev, subteam]
        );
    };

    const toggleMember = (member) => {
        setSelectedMembers((prev) =>
            prev.includes(member) ? prev.filter((m) => m !== member) : [...prev, member]
        );
    };

    const handleCreateTask = async (event) => {
        event.preventDefault();
    
        let newErrors = {};
        if (!taskName.trim()) newErrors.taskName = "Task name is required.";
        if (!taskDescription.trim()) newErrors.taskDescription = "Task description is required.";
        if (!dueDate) newErrors.dueDate = "Due date is required.";
    
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
    
        const taskData = {
            name: taskName,
            description: taskDescription,
            due_date: dueDate,
            assigned_to: selectedMembers[0] || "", // Assign to the first selected member (if any)
            group: projectId,
            subteams: selectedSubteams, // ✅ Ensure this is included
            status: "To Do",
            priority: "Medium"
        };
    
        try {
            const user = JSON.parse(localStorage.getItem("user"));
            if (!user || !user.token) {
                console.error("User not authenticated.");
                return;
            }
    
            console.log("Creating task with data:", taskData);
    
            const response = await axios.post("/tasks/", taskData, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
    
            console.log("Task Created:", response.data);
    
            // Reset form fields
            setTaskName("");
            setTaskDescription("");
            setDueDate("");
            setSelectedSubteams([]);  // ✅ Reset selected subteams
            setSelectedMembers([]);
            setErrors({});
    
            onCreate(); // Refresh the task list in the parent component
        } catch (error) {
            console.error("Error creating task:", error.response?.data || error);
            setErrors({ general: "Failed to create task. Please try again." });
        }
    };
    
    

    return (
        <Dialog.Root>
            <Dialog.Trigger asChild>
                <button className="Button violet">Create Task</button>
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Overlay className="DialogOverlay" />
                <Dialog.Content className="DialogContent">
                    <Dialog.Title className="DialogTitle">Create Task</Dialog.Title>
                    <Dialog.Description className="DialogDescription">
                        Add a new task for <b>{projectName}</b>.
                    </Dialog.Description>
                    <form onSubmit={handleCreateTask}>
                        {/* Task Name */}
                        <fieldset className="Fieldset">
                            <label className="Label" htmlFor="task-name">Task Name:</label>
                            <input
                                className="Input"
                                id="task-name"
                                type="text"
                                value={taskName}
                                onChange={(e) => setTaskName(e.target.value)}
                            />
                            {errors.taskName && <p className="error-message">{errors.taskName}</p>}
                        </fieldset>

                        {/* Task Description */}
                        <fieldset className="Fieldset">
                            <label className="Label" htmlFor="task-desc">Task Description:</label>
                            <textarea
                                className="Input"
                                id="task-desc"
                                value={taskDescription}
                                onChange={(e) => setTaskDescription(e.target.value)}
                            ></textarea>
                            {errors.taskDescription && <p className="error-message">{errors.taskDescription}</p>}
                        </fieldset>

                        {/* Due Date */}
                        <fieldset className="Fieldset">
                            <label className="Label" htmlFor="due-date">Due Date:</label>
                            <input
                                className="Input"
                                id="due-date"
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                            {errors.dueDate && <p className="error-message">{errors.dueDate}</p>}
                        </fieldset>

                        {/* Subteam Selection */}
                        <div className="selection-container">
                            <p className="selection-title">Assign to Subteams:</p>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {subteams.map((subteam) => (
                                    <button
                                        type="button"
                                        key={subteam}
                                        className={`task-toggle-button ${selectedSubteams.includes(subteam) ? "selected" : ""}`}
                                        onClick={() => toggleSubteam(subteam)}
                                    >
                                        {subteam}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Member Selection (Now Dynamic) */}
                        <div className="selection-container">
                            <p className="selection-title">Assign to Members:</p>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {members.map((member) => (
                                    <button
                                        type="button"
                                        key={member}
                                        className={`task-toggle-button ${selectedMembers.includes(member) ? "selected" : ""}`}
                                        onClick={() => toggleMember(member)}
                                    >
                                        {member}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Buttons */}
                        <div style={{ display: "flex", marginTop: 25, justifyContent: "space-between" }}>
                            <button type="submit" className="Button green">Create Task</button>
                            <Dialog.Close asChild>
                                <button className="Button red">Cancel</button>
                            </Dialog.Close>
                        </div>
                    </form>

                    {/* Close Button (X) */}
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

export default CreateTask;
