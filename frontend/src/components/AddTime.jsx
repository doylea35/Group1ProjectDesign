import React, { useState } from "react";
import axios from "axios";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import { Cross2Icon, CheckIcon, ChevronDownIcon, PlusIcon, TrashIcon } from "@radix-ui/react-icons";
import "../App.css";

const API_URI = "/api/calendar/updateFreeTime";

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const AddTime = ({ freeTimes, setFreeTimes, onTimeAdded }) => {
  const [timeSlots, setTimeSlots] = useState([{ id: 1, day: "", startTime: "", endTime: "" }]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false); // Control dialog state

  const resetForm = () => {
    setTimeSlots([{ id: 1, day: "", startTime: "", endTime: "" }]);
    setErrorMessage("");
  };

  const handleSave = async () => {
    if (timeSlots.some(slot => !slot.day || !slot.startTime || !slot.endTime)) {
      setErrorMessage("Please fill out all fields before saving.");
      return;
    }

    setErrorMessage("");

    const formattedFreeTime = {};
    timeSlots.forEach(slot => {
      if (!formattedFreeTime[slot.day]) formattedFreeTime[slot.day] = [];
      formattedFreeTime[slot.day].push({ start: slot.startTime, end: slot.endTime });
    });

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.token) {
      setErrorMessage("User is not logged in.");
      return;
    }

    try {
      const response = await axios.put(API_URI,
        { free_time: formattedFreeTime },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json"
          },
        }
      );

      setFreeTimes(response.data.data);

      // Close dialog and trigger parent component to refresh schedule
      setTimeout(() => {
        setIsOpen(false);
        if (onTimeAdded) onTimeAdded(); // Notify SchedulingPage to refresh
      }, 1000);

    } catch (error) {
      console.error("Error saving free time:", error.response?.data || error);
      setErrorMessage(error.response?.data?.detail || "Failed to save free time.");
    }
  };

  const addTimeSlot = () => {
    setTimeSlots([...timeSlots, { id: Date.now(), day: "", startTime: "", endTime: "" }]);
  };

  const removeTimeSlot = (id) => {
    setTimeSlots(timeSlots.filter(slot => slot.id !== id));
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <button className="Button violet">Enter Free Time</button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="DialogOverlay" />
        <Dialog.Content className="DialogContent">
          <Dialog.Title className="DialogTitle">Enter Your Free Time</Dialog.Title>
          <Dialog.Description className="DialogDescription">
            Select multiple days and time slots.
          </Dialog.Description>

          {errorMessage && <p className="ErrorMessage">{errorMessage}</p>}

          <div className="TimeSelectionWrapper">
            {timeSlots.map((slot, index) => (
              <div className="TimeSelectionContainer" key={slot.id}>
                <fieldset className="Fieldset">
                  <label className="Label">Select a Day</label>
                  <Select.Root value={slot.day} onValueChange={(value) => setTimeSlots(timeSlots.map(s => s.id === slot.id ? { ...s, day: value } : s))}>
                    <Select.Trigger className="CustomSelectTrigger">
                      <Select.Value placeholder="-" />
                      <ChevronDownIcon className="DropdownIcon" />
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Content className="CustomDropdownContent">
                        <Select.Viewport>
                          {daysOfWeek.map(day => (
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

                <fieldset className="TimeFieldset">
                  <label>Start Time</label>
                  <input type="time" className="Input" value={slot.startTime} onChange={(e) => setTimeSlots(timeSlots.map(s => s.id === slot.id ? { ...s, startTime: e.target.value } : s))} />
                </fieldset>

                <fieldset className="TimeFieldset">
                  <label>End Time</label>
                  <input type="time" className="Input" value={slot.endTime} onChange={(e) => setTimeSlots(timeSlots.map(s => s.id === slot.id ? { ...s, endTime: e.target.value } : s))} />
                </fieldset>

                {timeSlots.length > 1 && (
                  <button className="DeleteButton" onClick={() => removeTimeSlot(slot.id)}>
                    <TrashIcon />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button className="plusButton" onClick={addTimeSlot}>
            <PlusIcon /> Add Another Time Slot
          </button>

          <div style={{ display: "flex", marginTop: 25, justifyContent: "flex-end" }}>
            <button className="Button green" onClick={handleSave}>Save</button>
          </div>

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

export default AddTime;
