import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import { Cross2Icon, CheckIcon, ChevronDownIcon, PlusIcon, TrashIcon } from "@radix-ui/react-icons";
import "../App.css";

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const SchedulingPage = () => {
  const [selectedDay, setSelectedDay] = useState("");
  const [timeSlots, setTimeSlots] = useState([{ id: 1, startTime: "", endTime: "" }]);
  const [errorMessage, setErrorMessage] = useState("");

  // Function to reset the form every time modal opens
  const resetForm = () => {
    setSelectedDay("");
    setTimeSlots([{ id: 1, startTime: "", endTime: "" }]);
    setErrorMessage("");
  };

  const handleSave = () => {
    if (!selectedDay || timeSlots.some(slot => !slot.startTime || !slot.endTime)) {
      setErrorMessage("Please fill out all fields before saving.");
      return;
    }
    setErrorMessage(""); // Clear error if successful
    alert(`Saved: ${selectedDay} with ${timeSlots.length} time slots`);
  };

  const addTimeSlot = () => {
    setTimeSlots([...timeSlots, { id: Date.now(), startTime: "", endTime: "" }]);
  };

  const removeTimeSlot = (id) => {
    setTimeSlots(timeSlots.filter(slot => slot.id !== id));
  };

  const updateTimeSlot = (id, field, value) => {
    setTimeSlots(timeSlots.map(slot =>
      slot.id === id ? { ...slot, [field]: value } : slot
    ));
  };

  return (
    <div>
      <h1>Scheduling Page</h1>

      <Dialog.Root onOpenChange={(open) => open && resetForm()}>
        <Dialog.Trigger asChild>
          <button className="Button violet">Enter Free Time</button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="DialogOverlay" />
          <Dialog.Content className="DialogContent">
            <Dialog.Title className="DialogTitle">Enter Your Free Time To Meet With Your Team</Dialog.Title>
            <Dialog.Description className="DialogDescription">Choose a day and your available time.</Dialog.Description>

            {errorMessage && <p className="ErrorMessage">{errorMessage}</p>}

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

            {timeSlots.map(({ id, startTime, endTime }) => (
              <div key={id} className="TimeSelectionWrapper">
                <div className="TimeSelectionContainer">
                  <fieldset className="TimeFieldset">
                    <label className="Label">Start Time</label>
                    <input
                      type="time"
                      className="Input"
                      value={startTime}
                      onChange={(e) => updateTimeSlot(id, "startTime", e.target.value)}
                    />
                  </fieldset>

                  <fieldset className="TimeFieldset">
                    <label className="Label">End Time</label>
                    <input
                      type="time"
                      className="Input"
                      value={endTime}
                      onChange={(e) => updateTimeSlot(id, "endTime", e.target.value)}
                    />
                  </fieldset>

                  {timeSlots.length > 1 && (
                    <button className="DeleteButton" onClick={() => removeTimeSlot(id)}>
                      <TrashIcon />
                    </button>
                  )}
                </div>
              </div>
            ))}

            <div className="ButtonContainer">
              <button className="Button plusButton" onClick={addTimeSlot}>
                <PlusIcon /> Add Another Time
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
    </div>
  );
};

export default SchedulingPage;
