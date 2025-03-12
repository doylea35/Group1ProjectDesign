import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import { Cross2Icon, CheckIcon, ChevronDownIcon } from "@radix-ui/react-icons";
import axios from "axios"; // For sending HTTP requests
import "../App.css";

const API_URI = "/api/calendar/getOverlappingTime"; // Correct API endpoint

const FindTime = ({ freeTimes, raw_free_time_data, projectId }) => {
  const [selectedDay, setSelectedDay] = useState("");
  const [duration, setDuration] = useState(30); // Default duration is 30 minutes
  const [overlappingTimes, setOverlappingTimes] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasClickedFindTime, setHasClickedFindTime] = useState(false); // Track if the user clicked the "Find Overlapping Time" button inside the dialog

  // 🔹 Fetch User & Token from localStorage
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user || !user.token) {
    console.error("❌ User not logged in.");
    setErrorMessage(
      "User not logged in. Please log in to find overlapping time."
    );
  }

  // Helper function to check if two time slots overlap
  const checkOverlap = (slot1, slot2) => {
    const [start1, end1] = [
      new Date(`1970-01-01T${slot1.start}`),
      new Date(`1970-01-01T${slot1.end}`),
    ];
    const [start2, end2] = [
      new Date(`1970-01-01T${slot2.start}`),
      new Date(`1970-01-01T${slot2.end}`),
    ];
    return start1 < end2 && start2 < end1; // If times overlap
  };

  const findOverlappingTimes = async () => {
    setOverlappingTimes([]); // Clear previous results
    setErrorMessage(""); // Clear error message
    setHasClickedFindTime(true); // Mark that the button was clicked inside the dialog

    if (!selectedDay) {
      setErrorMessage("Please select a day.");
      return;
    }

    try {
      console.log("📡 Fetching Overlapping Free Times...");

      console.log("freeTimes", JSON.stringify(freeTimes));
      console.log("raw_free_time_data", JSON.stringify(freeTimes));

      // For now, we're using hardcoded times instead of sending a request to the API
      // Hardcoded overlapping slots
      const hardcodedOverlappingSlots = {
        Tuesday: [{ start: "13:00", end: "17:00" }],
        Thursday: [{ start: "11:00", end: "16:00" }],
      };

      // Simulate the overlapping times for the selected day
      if (hardcodedOverlappingSlots[selectedDay]) {
        setOverlappingTimes(hardcodedOverlappingSlots[selectedDay]);
        setErrorMessage("");
      } else {
        setOverlappingTimes([]); // Clear previous results
        setErrorMessage("No overlapping slots found.");
      }
      ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
      // Uncomment the following code when API call is enabled
      // Get free times for the selected day
      // console.log(
      //   `\n\ raw_free_time in findTime.jxs: ${JSON.stringify(
      //     raw_free_time_data
      //   )}\n\n`
      // );

      // const dayFreeTimes = freeTimes[selectedDay] || [];

      // if (dayFreeTimes.length === 0) {
      //   setOverlappingTimes([]); // Clear previous results
      //   setErrorMessage("No available slots for the selected day.");
      //   return;
      // }

      // Build the request body to send all free times for the selected day
      // const freeTimeRequest = {
      //   free_time_slots: raw_free_time_data,
      //   group_id: projectId,
      // };

      // // Send the accumulated free times for the selected day
      // const response = await axios.post(API_URI, freeTimeRequest, {
      //   headers: {
      //     Authorization: `Bearer ${user.token}`,
      //     "Content-Type": "application/json",
      //   },
      // });

      // console.log("API Response:", response);

      // // Process the response as necessary
      // if (response.data && response.data.overlapping_times) {
      //   const overlapping = response.data.overlapping_times;
      //   if (overlapping.length > 0) {
      //     setOverlappingTimes(overlapping);
      //     setErrorMessage("");
      //   } else {
      //     setOverlappingTimes([]); // Clear previous results
      //     setErrorMessage("No overlapping slots found.");
      //   }
      // } else {
      //   setErrorMessage("No overlapping slots found.");
      // }
    } catch (error) {
      console.error(
        "❌ Error fetching overlapping times:",
        error.response?.data || error
      );
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
          {/* Find Button */}
          <button className="Button violet" onClick={findOverlappingTimes}>
            Find Overlapping Time
          </button>
          {/* Error Messages */}
          {hasClickedFindTime && errorMessage && (
            <p className="ErrorMessage">{errorMessage}</p>
          )}{" "}
          {/* Show error after button click */}
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
