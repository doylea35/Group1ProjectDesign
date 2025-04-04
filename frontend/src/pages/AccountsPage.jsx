import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import PageHeader from "../components/PageHeader";
import '../App.css';

const AccountPage = () => {
    const [userDetails, setUserDetails] = useState({
        email: '',
        skills: [],
        token: '',
    });
    const [editMode, setEditMode] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (userData) {
            setUserDetails({
                email: userData.email,
                skills: userData.skills || [],
                token: userData.token,
            });
            setNewEmail(userData.email);
        }
    }, []);

    const syncSkillsToBackend = async (skillsToAdd, skillsToRemove) => {
        try {
            await axios.put('/api/user/updateUser', {
                email: userDetails.email,
                add_skills: skillsToAdd,
                remove_skills: skillsToRemove
            }, {
                headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('user')).token}` }
            });

            const newUserDetails = {
                ...userDetails,
                skills: userDetails.skills.filter(skill => !skillsToRemove.includes(skill)).concat(skillsToAdd)
            };
            localStorage.setItem('user', JSON.stringify(newUserDetails));
            setUserDetails(newUserDetails);
        } catch (error) {
            console.error("Failed to sync skills:", error);
        }
    };

    const handleDeleteSkill = (skillToDelete) => {
        syncSkillsToBackend([], [skillToDelete]);
    };

    const handleAdditionSkill = (e) => {
        if (e.key === 'Enter' && e.target.value) {
            const newSkill = e.target.value.trim();
            if (!userDetails.skills.includes(newSkill)) {
                syncSkillsToBackend([newSkill], []);
            }
            e.target.value = '';
        }
    };

    const handleSave = async () => {
        try {
            await axios.put('/api/user/updateUser', {
                email: userDetails.email,
                new_email: newEmail,
            }, {
                headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('user')).token}` }
            });

            setUserDetails(prev => ({
                ...prev,
                email: newEmail
            }));
            setEditMode(false);
        } catch (error) {
            console.error("Error updating profile:", error);
        }
    };

    const handleDeleteAccount = async () => {
        try {
            await axios.delete('/api/user/deleteUser', {
                data: { email: userDetails.email },
                headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('user')).token}` }
            });
            localStorage.removeItem("user");
            window.location.href = "/login";
        } catch (error) {
            console.error("Failed to delete account:", error);
        }
    };

    const handleClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append("file", file);
        const user = JSON.parse(localStorage.getItem("user"));
        console.log("Loaded user from localStorage:", user);
        console.log("Token:", user?.token);
        console.log("Group ID:", user?.group_id);
        if (!user || !user.token) {
            console.error("User not authenticated. Please log in first.");
            return;
        }
        try {
            const response = await axios.post(
                `https://group-grade-backend-5f919d63857a.herokuapp.com/api/files/upload?group_id=${user.group_id}`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            console.log("File uploaded successfully:", response.data);
        } catch (err) {
            console.error("Error uploading file:", err.response ? err.response.data : err.message);
        }
    };

    return (
        <div className="page-container accounts-page">
            <PageHeader title="Account Management" />
            <div className="card">
                {!editMode && !previewMode && (
                    <>
                        <p className="violet-text"><strong>Email:</strong> {userDetails.email}</p>
                        <p className="violet-text"><strong>Skills:</strong></p>
                        <div className="skills-container">
                            {userDetails.skills.map((skill, index) => (
                                <div key={index} className="skill-tag">
                                    {skill}
                                </div>
                            ))}
                        </div>

                        <div className="ButtonContainer">
                            <button className="Button violet" onClick={() => setEditMode(true)}>Edit Profile</button>
                            <button className="Button violet" onClick={() => setPreviewMode(true)}>Preview Public Profile</button>
                            <button className="Button red" onClick={handleDeleteAccount}>Delete Account</button>
                        </div>
                    </>
                )}

                {editMode && (
                    <>
                        <label className="Label">New Email:</label>
                        <input
                            className="Input"
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                        />

                        <label className="Label">Edit Skills:</label>
                        <input
                            type="text"
                            className="skill-input"
                            placeholder="Type new skill and press Enter"
                            onKeyDown={handleAdditionSkill}
                        />
                        <div className="skills-container">
                            {userDetails.skills.map((skill, index) => (
                                <div key={index} className="skill-tag">
                                    {skill}
                                    <button onClick={() => handleDeleteSkill(skill)} className="delete-skill">x</button>
                                </div>
                            ))}
                        </div>

                        <div className="ButtonContainer">
                            <button className="Button violet" onClick={handleClick}>Upload CV</button>
                            <button className="Button violet" onClick={handleSave}>Save Changes</button>
                            <button className="Button violet" onClick={() => setEditMode(false)}>Cancel</button>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            style={{ display: "none" }}
                            onChange={handleFileChange}
                        />
                    </>
                )}

                {previewMode && (
                    <>
                        <h3 className="violet-text"><strong>Profile Preview</strong></h3>
                        <p className="violet-text"><strong>Email:</strong> {userDetails.email}</p>
                        <p className="violet-text"><strong>Skills:</strong></p>
                        <div className="skills-container">
                            {userDetails.skills.map((skill, index) => (
                                <div key={index} className="skill-tag">{skill}</div>
                            ))}
                        </div>
                        <button className="Button violet" onClick={() => setPreviewMode(false)}>Back to Profile</button>
                    </>
                )}
            </div>
        </div>
    );
};

export default AccountPage;
