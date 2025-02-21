import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import CreateNewProjectPop from "../pages/CreateProjectPop";

test("renders Create Project button", () => {
  render(<CreateNewProjectPop />);
  const buttonElement = screen.getByText(/Create New Project/i);
  expect(buttonElement).toBeInTheDocument();
});
