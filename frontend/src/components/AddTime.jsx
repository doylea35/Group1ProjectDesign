import React, { useState } from "react";
import axios from "axios";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import { Cross2Icon, CheckIcon, ChevronDownIcon } from "@radix-ui/react-icons";
import "../App.css";

const API_URI = "/api/calendar/getOverlappingTime"; // Make sure the endpoint is correct

const FindTime = ({ freeTimes }) => {
  const [selectedDay, setSelectedDay] = useState("");
  const [duration, setDuration] = useState(30); // Default duration is 30 minutes
  const [overlappingTimes, setOverlappingTimes] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");  // Error state
  const [successMessage, setSuccessMessage] = useState(""); // Success state

  // Hardcoded user info
  const user = {
    email: "nzhang@tcd.ie",
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3YmJhMzkxZjBiYzhhOGYzN2YzYWNjOCIsImVtYWlsIjoibnpoYW5nQHRjZC5pZSJ9.1hbzE78aogZ5Qqyb2SqMBz2N0Wlx10X72XgSnbFV3yU"
  };

  const findOverlappingTimes = async () => {
    if (!selectedDay) {
      setErrorMessage("Please select a day.");
      return;
    }

    const formattedRequest = {
      free_time_slots: [freeTimes],
      group_id: "sample-group-id"  // Assuming a group ID for now
    };

    setErrorMessage("");
    setSuccessMessage("");
    try {
      console.log("Fetching overlapping times with token:", user.token);

      const response = await axios.post(API_URI,
        formattedRequest,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json"
          },
        }
      );

      // Assuming the response structure contains `overlappingTimes`
      setOverlappingTimes(response.data.data[selectedDay] || []);
      setSuccessMessage("✅ Overlapping times fetched successfully!");

    } catch (error) {
      console.error("Error fetching overlapping times:", error.response?.data || error);
      setErrorMessage(error.response?.data?.detail || "Failed to fetch overlapping times.");
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
          <Dialog.Description className="DialogDescription">Select a day and duration to find overlapping free times.</Dialog.Description>

          {errorMessage && <p className="ErrorMessage">{errorMessage}</p>}
          {successMessage && <p className="SuccessMessage">{successMessage}</p>}

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

          {overlappingTimes.length > 0 && (
            <div className="overlap-results">
              <h3>Overlapping Free Times</h3>
              {overlappingTimes.map((time, index) => (
                <div key={index} className="overlap-box">
                  <div>{time.start} - {time.end}</div>
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
