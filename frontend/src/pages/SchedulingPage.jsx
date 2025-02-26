import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom"; // Get projectId from URL
import AddTime from "../components/AddTime";
import FindTime from "../components/FindTime";
import "../App.css";

const API_URI = "/api/calendar/getGroupFreeTime"; // API to get project-based free times

const SchedulingPage = () => {
  console.log("🔍 SchedulingPage Loaded"); // LOG COMPONENT LOAD

  const { projectId } = useParams(); // ✅ Get projectId from the URL
  const navigate = useNavigate(); // To handle redirection
  const [freeTimes, setFreeTimes] = useState({}); // Holds the free times organized by day
  const [errorMessage, setErrorMessage] = useState("");

  const user = JSON.parse(localStorage.getItem("user")); // ✅ Get user info from localStorage
  console.log("👤 User:", user); // LOG USER INFO

  useEffect(() => {
    if (!user || !user.token) {
      setErrorMessage("User is not logged in.");
      return;
    }

    if (!projectId) {
      console.error("❌ No projectId found! Redirecting...");
      navigate("/"); // Redirect user to home if no projectId
      return;
    }

    fetchFreeTimes();
  }, [projectId]); // Re-run when projectId changes

  const fetchFreeTimes = async () => {
    console.log("🔄 API Call to Fetch Free Times...");
    console.log("🆔 Project ID (Group ID):", projectId);
  
    if (!user || !user.token) {
      console.error("❌ User is not logged in.");
      setErrorMessage("User is not logged in.");
      return;
    }
  
    try {
      // Make the PUT request to fetch free times
      const response = await axios.put(
        "https://group-grade-backend-5f919d63857a.herokuapp.com/api/calendar/getGroupFreeTime",
        {
          group_id: projectId, // Send the group/project ID in the body
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
        }
      );
  
      console.log("✅ Full API Response:", response);
  
      // Check if response contains the free times and format them
      if (response.data?.data) {
        const formattedFreeTimes = formatFreeTimes(response.data.data); 
        setFreeTimes(formattedFreeTimes);
        console.log("🟢 Free Times Set in State:", formattedFreeTimes);
      } else {
        console.warn("⚠️ No free times found.");
        setErrorMessage("No free times available.");
      }
    } catch (error) {
      console.error("❌ Error Fetching Free Times:", error);
  
      if (error.response) {
        console.error("🚨 Server Response Data:", error.response.data);
        console.error("🚨 HTTP Status Code:", error.response.status);
  
        if (error.response.data && error.response.data.detail) {
          console.error("🚨 Detailed Error Info:", JSON.stringify(error.response.data.detail, null, 2));
        }
      }
  
      setErrorMessage("Failed to load schedule.");
    }
  };
  
  const formatFreeTimes = (data) => {
    // Format the response data to group free times by days
    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    let formattedData = { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [] };

    data.forEach((user) => {
      const userName = user.name || "User"; // Default to "User" if name is missing
      const freeTimes = user.free_time.free_time;

      daysOfWeek.forEach((day) => {
        if (freeTimes[day]) {
          freeTimes[day].forEach((slot) => {
            formattedData[day].push({
              name: userName,
              start: slot.start,
              end: slot.end,
            });
          });
        }
      });
    });

    return formattedData;
  };

  const renderSchedule = () => {
    console.log("🛠 Rendering Schedule...");

    const daysOfWeek = [
      "Monday", "Tuesday", "Wednesday", "Thursday",
      "Friday", "Saturday", "Sunday",
    ];

    return (
      <div className="show-free-times">
        <h2>Project Schedule</h2>
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
                      <span className="name">{slot.name}</span>
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

  console.log("🔘 Rendering Buttons...");
  return (
    <div>
      {/* Back Button - Positioned at the top left */}
      <div
        className="back-button"
        style={{
          position: "absolute",
          top: "20px", // Positioning it a little down from the top
          left: "300px", // Positioning it to the left
          zIndex: "10", // Ensures the button stays above other elements
        }}
      >
        <button onClick={() => navigate(`/projects/${projectId}`)} className="Button violet">
          Back to Project
        </button>
      </div>

      <div className="button-section" style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
        {projectId && user?.token ? (
          <>
            <AddTime freeTimes={freeTimes} setFreeTimes={setFreeTimes} projectId={projectId} />
            <FindTime freeTimes={freeTimes} projectId={projectId} />
          </>
        ) : (
          <p className="ErrorMessage">{errorMessage}</p>
        )}
      </div>

      {renderSchedule()} {/* ✅ Now actually rendering the schedule */}
    </div>
  );
};

export default SchedulingPage;
