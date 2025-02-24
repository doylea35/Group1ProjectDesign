import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import { Cross2Icon, CheckIcon, ChevronDownIcon } from "@radix-ui/react-icons";
import "../App.css";

const FindTime = ({ freeTimes }) => {
  const [selectedDay, setSelectedDay] = useState("");
  const [duration, setDuration] = useState(30); // Default duration is 30 minutes
  const [overlappingTimes, setOverlappingTimes] = useState([]);

  const findOverlappingTimes = () => {
    const selectedDayTimes = freeTimes[selectedDay] || [];
    const overlapping = [];

    selectedDayTimes.forEach((slot1, index) => {
      const slot1Start = new Date(`1970-01-01T${slot1.startTime}:00`);
      const slot1End = new Date(`1970-01-01T${slot1.endTime}:00`);
      const slot1Duration = (slot1End - slot1Start) / 60000;

      if (slot1Duration >= duration) {
        overlapping.push(slot1);
      }

      selectedDayTimes.forEach((slot2, i) => {
        if (index !== i) {
          const slot2Start = new Date(`1970-01-01T${slot2.startTime}:00`);
          const slot2End = new Date(`1970-01-01T${slot2.endTime}:00`);

          if (
            (slot1Start < slot2End && slot1End > slot2Start) ||
            slot1Start.getTime() === slot2Start.getTime()
          ) {
            overlapping.push({ slot1, slot2 });
          }
        }
      });
    });

    setOverlappingTimes(overlapping);
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
              {overlappingTimes.map((overlap, index) => (
                <div key={index} className="overlap-box">
                  <div>
                    <strong>{overlap.slot1.startTime} - {overlap.slot1.endTime}</strong>
                  </div>
                  <div>
                    <strong>{overlap.slot2.startTime} - {overlap.slot2.endTime}</strong>
                  </div>
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

