import React, { useState, useEffect } from "react";
import axios from "axios";
import AddTime from "../components/AddTime";
import FindTime from "../components/FindTime";
import "../App.css";

const API_URI = "/api/calendar/getUserFreeTime"; // Endpoint to fetch user's free times

const SchedulingPage = () => {
  const [freeTimes, setFreeTimes] = useState({}); // Start with an empty state
  const [errorMessage, setErrorMessage] = useState("");

  const user = {
    email: "nzhang@tcd.ie", // Hardcoded user email
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3YmJhMzkxZjBiYzhhOGYzN2YzYWNjOCIsImVtYWlsIjoibnpoYW5nQHRjZC5pZSJ9.1hbzE78aogZ5Qqyb2SqMBz2N0Wlx10X72XgSnbFV3yU" // Hardcoded user token
  };

  useEffect(() => {
    fetchFreeTimes();
  }, []); // Run once when the component mounts

  const fetchFreeTimes = async () => {
    try {
      const response = await axios.get(
        API_URI,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json"
          }
        }
      );

      console.log("Fetched free times:", response.data);
      setFreeTimes(response.data.data); // Update state with fetched data
    } catch (error) {
      console.error("Error fetching free times:", error.response?.data || error);
      setErrorMessage("Failed to load schedule.");
    }
  };

  const renderSchedule = () => {
    const daysOfWeek = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday"
    ];

    return (
      <div className="show-free-times">
        <h2>User's Schedule</h2>
        {errorMessage && <p className="ErrorMessage">{errorMessage}</p>}

        {/* Check if freeTimes is not empty */}
        {Object.keys(freeTimes).length > 0 ? (
          <div className="schedule-grid">
            {daysOfWeek.map((day) => {
              const times = freeTimes.free_time[day] || []; // Access free time for the day
              return (
                <div className="day-column" key={day}>
                  <div className="day-box">{day}</div>
                  {times.length > 0 ? (
                    times.map((slot, index) => (
                      <div key={index} className="free-time-box">
                        <span className="name">{user.email}</span>
                        <span className="time">
                          {slot.start} - {slot.end}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="free-time-box no-availability">No Free Time</div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p>No schedules available yet.</p>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="button-section">
        <AddTime freeTimes={freeTimes} setFreeTimes={setFreeTimes} />
        <FindTime freeTimes={freeTimes} />
      </div>

      {renderSchedule()}
    </div>
  );
};

export default SchedulingPage;
