import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom"; 
import AddTime from "../components/AddTime";
import FindTime from "../components/FindTime";
import { TrashIcon } from "@radix-ui/react-icons";
import "../App.css";

function parseTime(str) {
  const [hh, mm] = str.split(":").map(Number);
  return hh * 60 + mm;
}

const API_URI = "/api/calendar/getGroupFreeTime"; 

const SchedulingPage = () => {
  console.log("🔍 SchedulingPage Loaded"); 
  const { projectId } = useParams(); 
  const navigate = useNavigate(); 
  const [freeTimes, setFreeTimes] = useState({}); 
  const [errorMessage, setErrorMessage] = useState("");
  const [rawFreeTimeData, setRawFreeTimeData] = useState([]);

  const user = JSON.parse(localStorage.getItem("user")); 
  console.log("👤 User:", user);

  useEffect(() => {
    if (!user || !user.token) {
      setErrorMessage("User is not logged in.");
      return;
    }
    if (!projectId) {
      console.error("❌ No projectId found! Redirecting...");
      navigate("/"); 
      return;
    }
    fetchFreeTimes();
  }, [projectId]); 

  const fetchFreeTimes = async () => {
    if (!user || !user.token) {
      setErrorMessage("User is not logged in.");
      return;
    }
    try {
      const response = await axios.put(
        API_URI,
        { group_id: projectId },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data?.data) {
        const formattedFreeTimes = formatFreeTimes(response.data.data);
        const rawData = response.data.data.map(
          (person) => person.free_time.free_time
        );
        setRawFreeTimeData(rawData);
        setFreeTimes(formattedFreeTimes);
      } else {
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
    const daysOfWeek = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    let formattedData = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: [],
    };
    console.log("inside schedule.page" + JSON.stringify(data));
    data.forEach((userData) => {
      const userName = userData.name || "User"; 
      const userEmail = userData.email || "";
      if (userData.free_time.free_time !== undefined) {
        daysOfWeek.forEach((day) => {
          if (userData.free_time.free_time[day]) {
            userData.free_time.free_time[day].forEach((slot) => {
              formattedData[day].push({
                name: userName,
                email: userEmail,
                start: slot.start,
                end: slot.end,
              });
            });
          }
        });
      }
    });
    return formattedData;
  };

  const handleDeleteSlot = async (day, slot) => {
    try {
      await axios.put(
        "/api/calendar/updateFreeTime",
        { 
          added: {}, 
          removed: { [day]: [{ start: slot.start, end: slot.end }] } 
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
        }
      );
      fetchFreeTimes();
    } catch (error) {
      console.error("Error deleting free time slot:", error);
      setErrorMessage("Failed to delete free time slot.");
    }
  };

  const renderSchedule = () => {
    console.log("🛠 Rendering Schedule...");
    const daysOfWeek = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    return (
      <div className="show-free-times">
        <h2>Project Schedule</h2>
        {errorMessage && <p className="ErrorMessage">{errorMessage}</p>}
        <div className="schedule-grid">
          {daysOfWeek.map((day) => {
            const times = freeTimes[day] || [];
            const sortedTimes = times.slice().sort((a, b) => parseTime(a.start) - parseTime(b.start));
            return (
              <div className="day-column" key={day}>
                <div className="day-box">{day}</div>
                {sortedTimes.length > 0 ? (
                  sortedTimes.map((slot, index) => (
                    <div 
                      key={index} 
                      className="free-time-box" 
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "5px 10px",
                        border: "1px solid #ccc",
                        marginBottom: "5px",
                        borderRadius: "4px",
                      }}
                    >
                      <div>
                        <span className="name">{slot.name}</span>{" "}
                        <span className="time">
                          {slot.start} - {slot.end}
                        </span>
                      </div>
                      {slot.email === user.email && (
                        <button
                          className="delete-button"
                          onClick={() => handleDeleteSlot(day, slot)}
                          style={{
                            marginLeft: "auto",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          <TrashIcon style={{ width: "28px", height: "28px" }} />
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="free-time-box no-availability">
                    No Free Time
                  </div>
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
      <div
        className="back-button"
        style={{
          position: "absolute",
          top: "20px", 
          left: "300px", 
          zIndex: "10", 
        }}
      >
      <div className="top-row">
        <button onClick={() => navigate(`/projects/${projectId}`)} className="back-project-btn">
          Back to Project Page
        </button>
      </div>
      </div>
      <div
        className="button-section"
        style={{ display: "flex", justifyContent: "center", gap: "20px" }}
      >
        {projectId && user?.token ? (
          <>
            <AddTime
              freeTimes={freeTimes}
              setFreeTimes={setFreeTimes}
              projectId={projectId}
              refreshFreeTimes={fetchFreeTimes}
            />
            <FindTime
              freeTimes={freeTimes}
              raw_free_time_data={rawFreeTimeData}
              projectId={projectId}
            />
          </>
        ) : (
          <p className="ErrorMessage">{errorMessage}</p>
        )}
      </div>
      {renderSchedule()} 
    </div>
  );
};

export default SchedulingPage;
