import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import { Cross2Icon, CheckIcon, ChevronDownIcon } from "@radix-ui/react-icons";
import axios from "axios"; // If you eventually want to call an API
import "../App.css";

function parseTime(str) {
  const [hh, mm] = str.split(":").map(Number);
  return hh * 60 + mm;
}

function formatTime(totalMinutes) {
  const hh = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const mm = String(totalMinutes % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function intersectIntervals(A, B) {
  const sortedA = [...A].sort((a, b) => parseTime(a.start) - parseTime(b.start));
  const sortedB = [...B].sort((a, b) => parseTime(a.start) - parseTime(b.start));

  let i = 0;
  let j = 0;
  const result = [];

  while (i < sortedA.length && j < sortedB.length) {
    const startA = parseTime(sortedA[i].start);
    const endA = parseTime(sortedA[i].end);
    const startB = parseTime(sortedB[j].start);
    const endB = parseTime(sortedB[j].end);

    const overlapStart = Math.max(startA, startB);
    const overlapEnd = Math.min(endA, endB);

    if (overlapStart < overlapEnd) {
      result.push({
        start: formatTime(overlapStart),
        end: formatTime(overlapEnd),
      });
    }
    if (endA < endB) {
      i++;
    } else {
      j++;
    }
  }
  return result;
}

function intersectAllUsers(dayDataArray) {
  if (dayDataArray.length === 0) return [];

  let intersection = dayDataArray[0];

  for (let i = 1; i < dayDataArray.length; i++) {
    intersection = intersectIntervals(intersection, dayDataArray[i]);
    if (intersection.length === 0) {
      break; 
    }
  }
  return intersection;
}

function filterByDuration(intervals, duration) {
  return intervals.filter((slot) => {
    const start = parseTime(slot.start);
    const end = parseTime(slot.end);
    return end - start >= duration;
  });
}

const API_URI = "/api/calendar/getOverlappingTime";
const FindTime = ({ freeTimes, raw_free_time_data, projectId }) => {
  const [selectedDay, setSelectedDay] = useState("");
  const [duration, setDuration] = useState(30); 
  const [overlappingTimes, setOverlappingTimes] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasClickedFindTime, setHasClickedFindTime] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || !user.token) {
    console.error("❌ User not logged in.");
    setErrorMessage("User not logged in. Please log in to find overlapping time.");
  }

  const findOverlappingTimes = async () => {
    setOverlappingTimes([]); 
    setErrorMessage("");
    setHasClickedFindTime(true);

    if (!selectedDay) {
      setErrorMessage("Please select a day.");
      return;
    }

    try {
      const dayDataArray = raw_free_time_data.map((userObj) => {
        return userObj[selectedDay] || []; 
      });

      let intersection = intersectAllUsers(dayDataArray);
      intersection = filterByDuration(intersection, duration);

      if (intersection.length > 0) {
        setOverlappingTimes(intersection);
        setErrorMessage("");
      } else {
        setOverlappingTimes([]);
        setErrorMessage("No overlapping slots found.");
      }
    } catch (error) {
      console.error("❌ Error finding overlapping times:", error);
      if (error.response && error.response.status === 401) {
        setErrorMessage("Unauthorized. Please log in again.");
      } else {
        setErrorMessage("Failed to find overlapping times.");
      }
      setOverlappingTimes([]);
    }
  };

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="Button violet">Find Overlapping Time</button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="DialogOverlay" />
        <Dialog.Content className="DialogContent">
          <Dialog.Title className="DialogTitle">
            Find Overlapping Free Times
          </Dialog.Title>
          <Dialog.Description className="DialogDescription">
            Select a day and duration to find overlapping free times.
          </Dialog.Description>

          {/* Day Selection */}
          <fieldset className="Fieldset">
            <label className="Label">Select a Day</label>
            <Select.Root value={selectedDay} onValueChange={setSelectedDay}>
              <Select.Trigger className="CustomSelectTrigger">
                <Select.Value placeholder="-" />
                <ChevronDownIcon className="DropdownIcon" />
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="CustomDropdownContent">
                  <Select.Viewport>
                    {[
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                      "Sunday",
                    ].map((day) => (
                      <Select.Item
                        key={day}
                        value={day}
                        className="CustomDropdownItem"
                      >
                        <Select.ItemText>{day}</Select.ItemText>
                        <Select.ItemIndicator>
                          <CheckIcon className="CheckIcon" />
                        </Select.ItemIndicator>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </fieldset>

          {/* Duration Selection */}
          <fieldset className="Fieldset">
            <label className="Label">Select Duration (minutes)</label>
            <Select.Root
              value={duration.toString()}
              onValueChange={(value) => setDuration(Number(value))}
            >
              <Select.Trigger className="CustomSelectTrigger">
                <Select.Value placeholder="-" />
                <ChevronDownIcon className="DropdownIcon" />
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="CustomDropdownContent">
                  <Select.Viewport>
                    {[15, 30, 45, 60, 90].map((durationOption) => (
                      <Select.Item
                        key={durationOption}
                        value={durationOption.toString()}
                        className="CustomDropdownItem"
                      >
                        <Select.ItemText>
                          {durationOption} minutes
                        </Select.ItemText>
                        <Select.ItemIndicator>
                          <CheckIcon className="CheckIcon" />
                        </Select.ItemIndicator>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </fieldset>

          {/* Button to find overlaps */}
          <button className="Button violet" onClick={findOverlappingTimes}>
            Find Overlapping Time
          </button>

          {/* Error Message */}
          {hasClickedFindTime && errorMessage && (
            <p className="ErrorMessage">{errorMessage}</p>
          )}

          {/* Display Overlapping Times */}
          {overlappingTimes.length > 0 && (
            <div className="overlap-results">
              <h3>Overlapping Free Times</h3>
              {overlappingTimes.map((overlap, index) => (
                <div key={index} className="overlap-box">
                  <strong>
                    {overlap.start} - {overlap.end}
                  </strong>
                </div>
              ))}
            </div>
          )}

          <Dialog.Close asChild>
            <button className="IconButton" aria-label="Close">
              <Cross2Icon />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default FindTime;
