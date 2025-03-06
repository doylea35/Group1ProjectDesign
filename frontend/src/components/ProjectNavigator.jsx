// ProjectNavigator.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import * as NavigationMenu from "@radix-ui/react-navigation-menu"; // if needed
import "../App.css";

function ProjectNavigation({ projectId }) {
  return (
    <NavigationMenu.Root className="NavigationMenuRoot">
      <NavigationMenu.List className="NavigationMenuList">
        <NavLink
          to={`/schedule/${projectId}`}
          className="NavigationMenuLink"
        >
          Find a Time to Meet
        </NavLink>
        <NavLink
          to={`/project/${projectId}/message`}
          className="NavigationMenuLink"
        >
          Message Teammates
        </NavLink>
        <NavLink
          to={`/project/${projectId}/files`}
          className="NavigationMenuLink"
        >
          Group Files
        </NavLink>
        <NavLink
          to={`/project/${projectId}/settings`}
          className="NavigationMenuLink"
        >
          Edit Project
        </NavLink>
      </NavigationMenu.List>
    </NavigationMenu.Root>
  );
}

export default ProjectNavigation;
