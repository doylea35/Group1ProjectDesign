import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import "./styles.css";

const CreateNewProjectPop = () => (
	<Dialog.Root>
		<Dialog.Trigger asChild>
			<button className="Button violet">Create New Project</button>
		</Dialog.Trigger>
		<Dialog.Portal>
			<Dialog.Overlay className="DialogOverlay" />
			<Dialog.Content className="DialogContent">
				<Dialog.Title className="DialogTitle">Create New Project</Dialog.Title>
				<Dialog.Description className="DialogDescription">
					Create a new project. Click create project to create a new project.
				</Dialog.Description>
				<fieldset className="Fieldset">
					<label className="Label" htmlFor="name">
						Project Name
					</label>
					<input className="Input" id="projectname" defaultValue="" />
				</fieldset>
				<fieldset className="Fieldset">
					<label className="Label" htmlFor="emails">
						Team Member Emails
					</label>
					<input className="Input" id="emails" defaultValue="ogaracl@tcd.ie" /> {/* default should show the users' own email */}
				</fieldset>
				<div
					style={{ display: "flex", marginTop: 25, justifyContent: "flex-end" }}
				>
					<Dialog.Close asChild>
						<button className="Button green">Create Project</button>
					</Dialog.Close>
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

export default CreateNewProjectPop;
