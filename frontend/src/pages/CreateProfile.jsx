import React, { useState } from 'react';
import './CreateProfile.css'

const CreateProfile = () => {
    const [profile, setProfile] = useState({
        name: '',
        email: ''
    });

    const handleChange = (event) => {
        const { name, value } = event.target;
        setProfile(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        console.log('Profile Created:', profile);
        alert('Profile created successfully!');
        setProfile({ name: '', email: '' });
    };

    return (
        <div className="create-profile-container">
            <div className="create-profile-content">
                <h2 className="create-profile-header">Create Profile</h2>
                <form onSubmit={handleSubmit} className="create-profile-form">
                    <label htmlFor="name">Name:</label>
                    <input
                        id="name"
                        type="text"
                        name="name"
                        value={profile.name}
                        onChange={handleChange}
                        required
                    />

                    <label htmlFor="email">Email:</label>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        value={profile.email}
                        onChange={handleChange}
                        required
                    />

                    <button type="submit">Create Profile</button>
                </form>
            </div>
        </div>
    );
};

export default CreateProfile;
