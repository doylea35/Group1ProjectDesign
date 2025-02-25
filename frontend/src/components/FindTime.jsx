import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import { Cross2Icon, CheckIcon, ChevronDownIcon } from "@radix-ui/react-icons";
import axios from "axios"; // For sending HTTP requests
import "../App.css";

const FindTime = ({ freeTimes }) => {
  const [selectedDay, setSelectedDay] = useState("");
  const [duration, setDuration] = useState(30); // Default duration is 30 minutes
  const [overlappingTimes, setOverlappingTimes] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch the token (you need to replace with your actual token logic)
  const token = localStorage.getItem("token") || "";  // Assumes you're storing token in localStorage

  const findOverlappingTimes = async () => {
    try {
      // Hardcoded values for the user and group
      const group_id = "67bdf8aa2642dc845b82fc19"; // Replace with actual group ID if needed
      const hardcodedUserFreeTimes = {
        "Monday": [{ start: "09:00", end: "10:00" }],
        "Tuesday": [{ start: "10:00", end: "14:00" }],
        "Thursday": [{ start: "12:00", end: "16:00" }],
      };

      // Construct the free time slots for the group members
      const freeTimeSlots = [
        { free_time: hardcodedUserFreeTimes }, // Add more users if needed
      ];

      // Send the request to the backend with Authorization header
      const response = await axios.post(
        "/api/calendar/getOverlappingTime",
        {
          free_time_slots: freeTimeSlots,
          group_id: group_id, // Using the hardcoded group ID
        },
        {
          headers: {
            Authorization: `Bearer ${token}`, // Add the token here for authentication
          },
        }
      );

      // Handle response from the backend
      const overlapping = response.data.data[selectedDay] || [];

      if (overlapping.length === 0) {
        setOverlappingTimes([]); // No overlapping slots, set empty
        setErrorMessage("Available slots: None");
      } else {
        setOverlappingTimes(overlapping); // Update with overlapping times for the selected day
        setErrorMessage(""); // Clear any error message
      }
    } catch (error) {
      console.error("Error fetching overlapping times:", error);
      if (error.response && error.response.status === 401) {
        setErrorMessage("Unauthorized. Please log in again.");
      } else {
        setErrorMessage("Failed to find overlapping times.");
      }
      setOverlappingTimes([]); // Clear any existing overlapping times
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

          <fieldset className="Fieldset">
            <label className="Label">Select a Day</label>
            <Select.Root value={selectedDay} onValueChange={setSelectedDay}>
              <Select.Trigger className="CustomSelectTrigger">
                <Select.Value placeholder="-" />
                <ChevronDownIcon className="DropdownIcon" />
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="CustomDropdownContent" sideOffset={5}>
                  <Select.Viewport className="CustomDropdownViewport">
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                      <Select.Item key={day} value={day} className="CustomDropdownItem">
                        <Select.ItemText>{day}</Select.ItemText>
                        <Select.ItemIndicator><CheckIcon className="CheckIcon" /></Select.ItemIndicator>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </fieldset>

          <fieldset className="Fieldset">
            <label className="Label">Select Duration (minutes)</label>
            <Select.Root value={duration.toString()} onValueChange={(value) => setDuration(Number(value))}>
              <Select.Trigger className="CustomSelectTrigger">
                <Select.Value placeholder="-" />
                <ChevronDownIcon className="DropdownIcon" />
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="CustomDropdownContent" sideOffset={5}>
                  <Select.Viewport className="CustomDropdownViewport">
                    {[15, 30, 45, 60, 90].map((durationOption) => (
                      <Select.Item key={durationOption} value={durationOption.toString()} className="CustomDropdownItem">
                        <Select.ItemText>{durationOption} minutes</Select.ItemText>
                        <Select.ItemIndicator><CheckIcon className="CheckIcon" /></Select.ItemIndicator>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </fieldset>

          <button className="Button violet" onClick={findOverlappingTimes}>
            Find Overlapping Time
          </button>

          {errorMessage && <p className="ErrorMessage">{errorMessage}</p>}

          {overlappingTimes.length > 0 ? (
            <div className="overlap-results">
              <h3>Overlapping Free Times</h3>
              {overlappingTimes.map((overlap, index) => (
                <div key={index} className="overlap-box">
                  <div>
                    <strong>{overlap.start} - {overlap.end}</strong>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !errorMessage && <p className="ErrorMessage">Available slots: None</p> // Display when no overlapping slots are found
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
