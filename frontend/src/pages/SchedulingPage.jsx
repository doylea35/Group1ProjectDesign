import React, { useState } from "react";
import AddTime from "../components/AddTime";
import FindTime from "../components/FindTime";
import "../App.css";

const SchedulingPage = () => {
  const [freeTimes, setFreeTimes] = useState({
    Monday: [
      { name: "Claire", startTime: "09:00", endTime: "10:00" },
      { name: "Amy", startTime: "13:00", endTime: "14:00" },
    ],
    Tuesday: [
      { name: "Hugh", startTime: "11:00", endTime: "12:00" },
      { name: "Claire", startTime: "15:00", endTime: "16:00" },
    ],
    Wednesday: [
      { name: "Luke", startTime: "08:00", endTime: "09:00" },
    ],
    // UPDATE with real database connection for actual times
  });

  const renderSchedule = () => {
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
        <h2>Team's Schedule</h2>
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
                      <span className="time">{slot.startTime} - {slot.endTime}</span>
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
      <div className="button-section">
        <AddTime freeTimes={freeTimes} setFreeTimes={setFreeTimes} />
        <FindTime freeTimes={freeTimes} />
      </div>
      
      {renderSchedule()}
    </div>
  );
};

export default SchedulingPage;
