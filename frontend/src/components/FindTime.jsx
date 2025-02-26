import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import { Cross2Icon, CheckIcon, ChevronDownIcon } from "@radix-ui/react-icons";
import axios from "axios"; // For sending HTTP requests
import "../App.css";

const API_URI = "/api/calendar/getOverlappingTime"; // Correct API endpoint

const FindTime = ({ freeTimes }) => {
  const [selectedDay, setSelectedDay] = useState("");
  const [duration, setDuration] = useState(30); // Default duration is 30 minutes
  const [overlappingTimes, setOverlappingTimes] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  // 🔹 Fetch User & Token from localStorage
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user || !user.token) {
    console.error("❌ User not logged in.");
    setErrorMessage("User not logged in. Please log in to find overlapping time.");
  }

  const findOverlappingTimes = async () => {
    if (!selectedDay) {
      setErrorMessage("Please select a day.");
      return;
    }

    try {
      console.log("📡 Fetching Overlapping Free Times...");
      const group_id = "67bdf8aa2642dc845b82fc19"; // Hardcoded group ID for now

      const response = await axios.post(
        API_URI,
        { group_id }, // Only sending group_id as per API structure
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Overlapping Times Fetched:", response.data);
      const overlapping = response.data.data[selectedDay] || [];

      if (overlapping.length === 0) {
        setOverlappingTimes([]); // No overlapping slots
        setErrorMessage("Available slots: None");
      } else {
        setOverlappingTimes(overlapping);
        setErrorMessage(""); // Clear errors
      }
    } catch (error) {
      console.error("❌ Error fetching overlapping times:", error.response?.data || error);
      if (error.response && error.response.status === 401) {
        setErrorMessage("Unauthorized. Please log in again.");
      } else {
        setErrorMessage("Failed to find overlapping times.");
      }
      setOverlappingTimes([]); // Clear previous results
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
          <Dialog.Title className="DialogTitle">Find Overlapping Free Times</Dialog.Title>
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
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                      <Select.Item key={day} value={day} className="CustomDropdownItem">
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
            <Select.Root value={duration.toString()} onValueChange={(value) => setDuration(Number(value))}>
              <Select.Trigger className="CustomSelectTrigger">
                <Select.Value placeholder="-" />
                <ChevronDownIcon className="DropdownIcon" />
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="CustomDropdownContent">
                  <Select.Viewport>
                    {[15, 30, 45, 60, 90].map((durationOption) => (
                      <Select.Item key={durationOption} value={durationOption.toString()} className="CustomDropdownItem">
                        <Select.ItemText>{durationOption} minutes</Select.ItemText>
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

          {/* Find Button */}
          <button className="Button violet" onClick={findOverlappingTimes}>
            Find Overlapping Time
          </button>

          {/* Error Messages */}
          {errorMessage && <p className="ErrorMessage">{errorMessage}</p>}

          {/* Display Overlapping Times */}
          {overlappingTimes.length > 0 ? (
            <div className="overlap-results">
              <h3>Overlapping Free Times</h3>
              {overlappingTimes.map((overlap, index) => (
                <div key={index} className="overlap-box">
                  <strong>{overlap.start} - {overlap.end}</strong>
                </div>
              ))}
            </div>
          ) : (
            !errorMessage && <p className="ErrorMessage">Available slots: None</p>
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
