import React, { useState, useEffect } from "react";
import axios from "axios";
import AddTime from "../components/AddTime";
import FindTime from "../components/FindTime";
import "../App.css";

const API_URI = "/api/calendar/getUserFreeTime"; // Endpoint to fetch user's free times

const SchedulingPage = () => {
  console.log("🔍 SchedulingPage Component Loaded"); // LOG COMPONENT LOAD

  const [freeTimes, setFreeTimes] = useState({});
  const [errorMessage, setErrorMessage] = useState("");

  const user = JSON.parse(localStorage.getItem("user")); // Fetch logged-in user
  console.log("👤 User from localStorage:", user); // LOG USER INFO

  useEffect(() => {
    if (user && user.token) {
      console.log("📡 Fetching free times...");
      fetchFreeTimes();
    } else {
      console.error("❌ User not logged in.");
      setErrorMessage("User not logged in.");
    }
  }, []);

  const fetchFreeTimes = async () => {
    console.log("🔄 API Call to Fetch Free Times...");
    try {
      const response = await axios.get(API_URI, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("✅ Fetched Free Times:", response.data);
      if (response.data?.data?.free_time) {
        setFreeTimes(response.data.data.free_time);
        console.log("🟢 Free Times Set in State:", response.data.data.free_time);
      } else {
        console.warn("⚠️ No free times found.");
        setErrorMessage("No free times available.");
      }
    } catch (error) {
      console.error("❌ Error Fetching Free Times:", error.response?.data || error);
      setErrorMessage("Failed to load schedule.");
    }
  };

  const renderSchedule = () => {
    console.log("🛠 Rendering Schedule...");
    
    const daysOfWeek = [
      "Monday", "Tuesday", "Wednesday", "Thursday",
      "Friday", "Saturday", "Sunday",
    ];

    return (
      <div className="show-free-times">
        <h2>User's Schedule</h2>
        {errorMessage && <p className="ErrorMessage">{errorMessage}</p>}

        <div className="schedule-grid">
          {daysOfWeek.map((day) => {
            const times = freeTimes[day] || [];

            return (
              <div className="day-column" key={day}>
                <div className="day-box">{day}</div>
                {times.length > 0 ? (
                  times.map((slot, index) => (
                    <div key={index} className="free-time-box">
                      <span className="name">{user?.email}</span>
                      <span className="time">{slot.start} - {slot.end}</span>
                    </div>
                  ))
                ) : (
                  <div className="free-time-box no-availability">No Free Time</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="button-section" style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
        <div className="button-container">
        <AddTime freeTimes={freeTimes} setFreeTimes={setFreeTimes} onTimeAdded={fetchFreeTimes} />
        </div>
        <div className="button-container">
          <FindTime freeTimes={freeTimes} />
        </div>
      </div>

      {renderSchedule()}
    </div>
  );
};

export default SchedulingPage;
