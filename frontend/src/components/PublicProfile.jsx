import React from 'react';
import '../App.css';

const PublicProfile = ({ email, skills }) => {
  return (
    <div className="public-profile">
      <p className="violet-text"><strong>Email:</strong> {email}</p>
      <p className="violet-text"><strong>Skills:</strong></p>
      <div className="skills-container">
        {skills && skills.length > 0 ? (
          skills.map((skill, index) => (
            <div key={index} className="skill-tag">{skill}</div>
          ))
        ) : (
          <p>No skills listed</p>
        )}
      </div>
    </div>
  );
};

export default PublicProfile;
