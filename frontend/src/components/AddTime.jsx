import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import { Cross2Icon, CheckIcon, ChevronDownIcon, PlusIcon, TrashIcon } from "@radix-ui/react-icons";
import "../App.css";

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const AddTime = ({ freeTimes, setFreeTimes }) => {
  const [selectedDay, setSelectedDay] = useState("");
  const [timeSlots, setTimeSlots] = useState([{ id: 1, startTime: "", endTime: "" }]);
  const [errorMessage, setErrorMessage] = useState("");

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
    setErrorMessage(""); 

    const newFreeTimes = { ...freeTimes, [selectedDay]: timeSlots };
    setFreeTimes(newFreeTimes);

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
    <Dialog.Root onOpenChange={(open) => open && resetForm()}>
      <Dialog.Trigger asChild>
        <button className="Button violet">Enter Free Time</button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="DialogOverlay" />
        <Dialog.Content className="DialogContent">
          <Dialog.Title className="DialogTitle">Enter Your Free Time</Dialog.Title>
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

          <div className="TimeSelectionWrapper">
            {timeSlots.map((slot) => (
              <div className="TimeSelectionContainer" key={slot.id}>
                <fieldset className="TimeFieldset">
                  <label>Start Time</label>
                  <input
                    type="time"
                    className="Input"
                    value={slot.startTime}
                    onChange={(e) => updateTimeSlot(slot.id, "startTime", e.target.value)}
                  />
                </fieldset>

                <fieldset className="TimeFieldset">
                  <label>End Time</label>
                  <input
                    type="time"
                    className="Input"
                    value={slot.endTime}
                    onChange={(e) => updateTimeSlot(slot.id, "endTime", e.target.value)}
                  />
                </fieldset>

                {/* Show delete button only if there's more than one slot */}
                {timeSlots.length > 1 && (
                  <button className="DeleteButton" onClick={() => removeTimeSlot(slot.id)}>
                    🗑️
                  </button>
                )}
              </div>
            ))}
          </div>


          <div className="ButtonContainer">
            <button className="plusButton" onClick={addTimeSlot}>
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
  );
};

export default AddTime;
