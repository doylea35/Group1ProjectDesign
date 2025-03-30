import React, { useState } from "react";
import axios from "axios";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import { Cross2Icon, CheckIcon, ChevronDownIcon, PlusIcon, TrashIcon } from "@radix-ui/react-icons";
import "../App.css";

const API_URI = "/api/calendar/updateFreeTime"; // Updated endpoint

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const AddTime = ({ freeTimes, setFreeTimes, projectId }) => { // Accept projectId
  const [timeSlots, setTimeSlots] = useState([{ id: 1, day: "", startTime: "", endTime: "" }]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false); // Track modal state

  const user = JSON.parse(localStorage.getItem("user")); // Get user from storage

  const resetForm = () => {
    setTimeSlots([{ id: 1, day: "", startTime: "", endTime: "" }]);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleSave = async () => {
    if (!projectId) {
      setErrorMessage("❌ No project selected.");
      return;
    }
  
    if (timeSlots.some(slot => !slot.day || !slot.startTime || !slot.endTime)) {
      setErrorMessage("❌ Please fill out all fields before saving.");
      return;
    }
  
    setErrorMessage("");
    setSuccessMessage("");
  
    const formattedFreeTime = {};
    timeSlots.forEach(slot => {
      if (!formattedFreeTime[slot.day]) formattedFreeTime[slot.day] = [];
      formattedFreeTime[slot.day].push({ start: slot.startTime, end: slot.endTime });
    });
  
  
    try {
      const response = await axios.put(
        API_URI,
        { 
          added: formattedFreeTime,
          removed: {} 
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      setSuccessMessage("Free time saved successfully!");
  
      setTimeout(() => {
        setIsOpen(false);
        window.location.reload();
      }, 500);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.detail || "Failed to save free time."
      );
    }
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
          {successMessage && <p className="SuccessMessage">{successMessage}</p>}

          <div className="TimeSelectionWrapper">
            {timeSlots.map((slot, index) => (
              <div className="TimeSelectionContainer" key={slot.id} style={{ display: "flex", alignItems: "center" }}>
                <fieldset className="Fieldset">
                  <label className="Label">Select a Day</label>
                  <Select.Root value={slot.day} onValueChange={(value) => {
                    const updatedSlots = [...timeSlots];
                    updatedSlots[index].day = value;
                    setTimeSlots(updatedSlots);
                  }}>
                    <Select.Trigger className="CustomSelectTrigger">
                      <Select.Value placeholder="-" />
                      <ChevronDownIcon className="DropdownIcon" />
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Content className="CustomDropdownContent" sideOffset={5}>
                        <Select.Viewport className="CustomDropdownViewport">
                          {daysOfWeek.map(day => (
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

                <fieldset className="TimeFieldset">
                  <label>Start Time</label>
                  <input
                    type="time"
                    className="Input"
                    value={slot.startTime}
                    onChange={(e) => {
                      const updatedSlots = [...timeSlots];
                      updatedSlots[index].startTime = e.target.value;
                      setTimeSlots(updatedSlots);
                    }}
                  />
                </fieldset>

                <fieldset className="TimeFieldset">
                  <label>End Time</label>
                  <input
                    type="time"
                    className="Input"
                    value={slot.endTime}
                    onChange={(e) => {
                      const updatedSlots = [...timeSlots];
                      updatedSlots[index].endTime = e.target.value;
                      setTimeSlots(updatedSlots);
                    }}
                  />
                </fieldset>

                {timeSlots.length > 1 && (
                  <button 
                    className="DeleteButton" 
                    onClick={() => setTimeSlots(timeSlots.filter(s => s.id !== slot.id))}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      marginLeft: "auto"
                    }}
                  >
                    <TrashIcon style={{ width: "28px", height: "28px" }} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="ButtonContainer">
            <button className="plusButton" onClick={() => setTimeSlots([...timeSlots, { id: Date.now(), day: "", startTime: "", endTime: "" }])}>
              <PlusIcon /> Add Another Time Slot
            </button>
          </div>

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
