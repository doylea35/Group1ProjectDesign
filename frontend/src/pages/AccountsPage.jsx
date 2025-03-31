import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PageHeader from "../components/PageHeader";
import '../App.css';

const AccountPage = () => {
    const [userDetails, setUserDetails] = useState({
        email: '',
        skills: []
    });

    const [editMode, setEditMode] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const [newEmail, setNewEmail] = useState('');

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (userData) {
            console.log("Loaded user from localStorage:", userData);
            setUserDetails({
                email: userData.email,
                skills: userData.skills || []
            });
            setNewEmail(userData.email);
        }
    }, []);

    const syncSkillsToBackend = async (skillsToSend) => {
        try {
            console.log("Syncing skills to backend:", skillsToSend);
            await axios.put('/api/user/updateUser', {
                email: userDetails.email,
                add_skills: skillsToSend,
            }, {
                headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('user')).token}` }
            });
            console.log("Skills updated successfully.");
        } catch (error) {
            console.error("Failed to sync skills:", error);
        }
    };

    const handleDeleteSkill = (skillToDelete) => {
        const updatedSkills = userDetails.skills.filter(skill => skill !== skillToDelete);
        setUserDetails(prev => ({ ...prev, skills: updatedSkills }));
        syncSkillsToBackend(updatedSkills);
        console.log("Deleted skill:", skillToDelete);
    };

    const handleAdditionSkill = (e) => {
        if (e.key === 'Enter' && e.target.value) {
            const newSkill = e.target.value.trim();
            if (!userDetails.skills.includes(newSkill)) {
                const updatedSkills = [...userDetails.skills, newSkill];
                setUserDetails(prev => ({ ...prev, skills: updatedSkills }));
                syncSkillsToBackend(updatedSkills);
                console.log("Added new skill:", newSkill);
            }
            e.target.value = '';
        }
    };

    const handleSave = async () => {
        try {
            console.log("Updating email to:", newEmail);
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

            console.log("Email updated successfully.");
            setEditMode(false);
        } catch (error) {
            console.error("Error updating profile:", error);
        }
    };

    const handleDeleteAccount = async () => {
        try {
            console.log("Sending request to delete account...");
            await axios.delete('/api/user/deleteUser', {
                data: { email: userDetails.email },
                headers: {
                    Authorization: `Bearer ${JSON.parse(localStorage.getItem('user')).token}`
                }
            });
            console.log("Account deleted. Redirecting to login...");
            localStorage.removeItem("user");
            window.location.href = "/login";
        } catch (error) {
            console.error("Failed to delete account:", error);
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
                                <div key={index} className="skill-tag">{skill}</div>
                            ))}
                        </div>

                        <div className="ButtonContainer">
                            <button className="Button violet" onClick={() => setEditMode(true)}>Edit Profile</button>
                            <button className="Button violet" onClick={() => setPreviewMode(true)}>Preview Public Profile</button>
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

                        <div className="account-actions">
                            <div className="delete-section">
                                <button className="Button red" onClick={handleDeleteAccount}>Delete Account</button>
                            </div>
                        </div>

                        <div className="ButtonContainer">
                            <button className="Button violet" onClick={handleSave}>Save Changes</button>
                            <button className="Button violet" onClick={() => setEditMode(false)}>Cancel</button>
                        </div>
                    </>
                )}

                {previewMode && (
                    <>
                        <h3>Profile Preview</h3>
                        <p><strong>Email:</strong> {userDetails.email}</p>
                        <p><strong>Skills:</strong></p>
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
