import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import "../App.css";

const CreateTask = ({ projectName, onCreate }) => {
    const [taskName, setTaskName] = useState("");
    const [taskDescription, setTaskDescription] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [selectedSubteams, setSelectedSubteams] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [errors, setErrors] = useState({});

    // hordcoded values
    const subteams = ["Frontend Subteam", "Backend Subteam"];
    const members = ["Member1", "Member2", "Member3", "Member4"];

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

    const handleCreateTask = (event) => {
        event.preventDefault();

        let newErrors = {};
        if (!taskName.trim()) newErrors.taskName = "Task name is required.";
        if (!taskDescription.trim()) newErrors.taskDescription = "Task description is required.";
        if (!dueDate) newErrors.dueDate = "Due date is required.";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        onCreate(taskName, taskDescription, dueDate, selectedSubteams, selectedMembers);


        setTaskName("");
        setTaskDescription("");
        setDueDate("");
        setSelectedSubteams([]);
        setSelectedMembers([]);
        setErrors({});
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

                        {/* Member Selection */}
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
