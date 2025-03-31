import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as Dialog from '@radix-ui/react-dialog';
import PageHeader from "../components/PageHeader";
import '../App.css';

const AccountPage = () => {
  const [userDetails, setUserDetails] = useState({
    email: '',
    skills: ''
  });

  const [newDetails, setNewDetails] = useState({
    newEmail: '',
    addSkills: '',
    removeSkills: '' 
  });

  const [editMode, setEditMode] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData) {
      setUserDetails({
        email: userData.email,
        skills: userData.skills ? userData.skills.join(', ') : ''
      });
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();  // Stop the form from submitting normally
  
    const body = {
      email: userDetails.email,
      new_email: newDetails.newEmail.trim(),
      add_skills: newDetails.addSkills.split(',').map(s => s.trim()).filter(Boolean),
      remove_skills: newDetails.removeSkills.split(',').map(s => s.trim()).filter(Boolean)
    };
  
    try {
      await axios.put('/api/user/updateUser', body, {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem('user')).token}`,
          'Content-Type': 'application/json'
        }
      });
  
      // Assuming your backend returns the updated data or handle it appropriately if not
      setUserDetails(prev => ({
        ...prev,
        email: body.new_email || prev.email,
        skills: updateSkillsList(prev.skills, body.add_skills, body.remove_skills)
      }));
  
      setEditMode(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };  


  const handleDelete = async () => {
    try {
      await axios.delete('/api/user/deleteUser', {
        data: { email: userDetails.email },
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem('user')).token}`
        }
      });

      localStorage.removeItem('user');
      window.location = '/login';
    } catch (error) {
      console.error('Failed to delete account:', error);
    }
    setDialogOpen(false);
  };

  return (
    <>
       <div className="page-container accounts-page"> 
        <PageHeader title="Account Management" />
  
        <div className="card">
          <p><strong>Email:</strong> {userDetails.email}</p>
          <p><strong>Skills:</strong> {userDetails.skills || '—'}</p>
  
          {!editMode ? (
            <>
              <button className="Button violet" onClick={() => setEditMode(true)}>Edit Profile</button>
              <button className="Button red" onClick={() => setDialogOpen(true)}>Delete Account</button>
            </>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); handleUpdate(e); }}>
              <label className="Label">New Email:</label>
              <input
                className="Input"
                type="email"
                name="newEmail"
                value={newDetails.newEmail}
                onChange={handleChange}
              />
              <label className="Label">Edit Skills:</label>
              <small>Type in skills separated by commas to add skill shown on your profile.</small>
              <input
                className="Input"
                type="text"
                name="addSkills"
                value={newDetails.addSkills}
                onChange={handleChange}
              />
               <label className="Label">Remove Skills:</label>
               <small>Type in skills separated by commas to remove skill shown on your profile.</small>
               <input className="Input" 
               type="text" 
               name="removeSkills" 
               value={newDetails.removeSkills} 
               onChange={handleChange} />



              <div className="ButtonContainer">
                <button className="Button violet" type="submit">Save Changes</button>
                <button className="Button green" type="button" onClick={() => setEditMode(false)}>Cancel</button>
              </div>
            </form>
          )}
        </div>
      </div>
  
      {/* Delete Confirmation Dialog */}
      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="DialogOverlay" />
          <Dialog.Content className="DialogContent">
            <Dialog.Title>Delete Account</Dialog.Title>
            <Dialog.Description>
              Are you sure you want to delete your account? This action cannot be undone.
            </Dialog.Description>
            <div className="ButtonContainer">
              <button onClick={handleDelete} className="Button red">Delete</button>
              <button onClick={() => setDialogOpen(false)} className="Button violet">Cancel</button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

function updateSkillsList(currentSkills, added, removed) {
    const skillSet = new Set(currentSkills.split(',').map(skill => skill.trim()));
    added.forEach(skill => skillSet.add(skill));
    removed.forEach(skill => skillSet.delete(skill));
    return Array.from(skillSet).join(', ');
  }

export default AccountPage;