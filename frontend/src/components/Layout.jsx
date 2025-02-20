import { Outlet, Link, useLocation } from "react-router-dom";
import * as Collapsible from "@radix-ui/react-collapsible";
import {useState} from "react";

export default function Layout() {
  const location = useLocation(); 
  const isActive = (path) => location.pathname === path;

  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen">
      {/* Sidebar */}
      <nav className="w-64 bg-white text-gray-500 p-6 flex flex-col shadow-lg z-10 relative">
        {/* Logo + title */}
        <div className="flex items-center space-x-3 mb-6">
          <img src="/hexlogo.png" alt="GroupGrade Logo" className="w-10 h-10" />
          <h1 className="text-2xl font-bold">GroupGrade</h1>
        </div>

        {/* Navigation */}
        <Link
          to="/home"
          className={`
            mb-2 w-full flex justify-between items-center py-2 px-4 rounded-xl transition-all duration-100
            ${isActive("/home") ? "bg-[#5932EA] text-white hover:bg-[#3111B6] shadow-lg" : "hover:bg-[#5932EA] hover:text-white hover:shadow-lg"}
          `}
        >
          <span>Home</span>
        </Link>

        <Collapsible.Root open={open} onOpenChange={setOpen}>
            <Collapsible.Trigger asChild>
                <button
                    className={`
                        w-full flex justify-between items-center py-2 px-4 rounded-xl transition-all relative
                        ${open ? "bg-[#5932EA] text-white hover:bg-[#4121C6] shadow-lg" : "hover:bg-[#5932EA] hover:text-white hover:shadow-lg"}
                      `}>
                    <span>Projects</span>
                    <span className={`transform transition-transform ${open ? "rotate-90" : ""}`}>›</span>
                </button>
            </Collapsible.Trigger>

            <Collapsible.Content className="bg-[#a38fec] text-white mb-2 rounded-xl -mt-5 z-[-1] before:content-[''] before:block before:h-7 shadow-lg">
            <Link
                to="/projects/project1"
                className={`
                    block py-2 px-4 mb-2 mx-1 rounded-xl transition-all duration-100
                    ${isActive("/projects/project1") ? "bg-[#5932EA] text-white hover:bg-[#3111B6] shadow-lg" : "hover:bg-[#5932EA] hover:text-white hover:shadow-lg"}
                `}
                >
                Project 1
                </Link>

                <Link
                to="/projects/project2"
                className={`
                    block py-2 px-4 mb-2 mx-1 rounded-xl transition-all duration-100
                    ${isActive("/projects/project2") ? "bg-[#5932EA] text-white hover:bg-[#3111B6] shadow-lg" : "hover:bg-[#5932EA] hover:text-white hover:shadow-lg"}
                `}
                >
                Project 2
                </Link>

                <Link
                to="/projects/project3"
                className={`
                    block py-2 px-4 mb-2 mx-1 rounded-xl transition-all duration-100
                    ${isActive("/projects/project3") ? "bg-[#5932EA] text-white hover:bg-[#3111B6] shadow-lg" : "hover:bg-[#5932EA] hover:text-white hover:shadow-lg"}
                `}
                >
                Project 3
                </Link>
                <button className="bg-[#5932EA] hover:bg-[#3111B6] w-full rounded-xl py-2 px-4 outline-2 shadow-lg outline-white">Create New Project</button>
            </Collapsible.Content>
        </Collapsible.Root>

        <Link
          to="/settings"
          className={`
            mb-2 w-full flex justify-between items-center py-2 px-4 rounded-xl transition-all duration-100
            ${isActive("/settings") ? "bg-[#5932EA] text-white hover:bg-[#3111B6] shadow:lg" : "hover:bg-[#5932EA] hover:text-white hover:shadow-lg"}
          `}
        >
          <span>Settings</span>
          <span>›</span>
        </Link>

        <Link
          to="/help"
          className={`
            w-full flex justify-between items-center py-2 px-4 rounded-xl transition-all duration-100
            ${isActive("/help") ? "bg-[#5932EA] text-white hover:bg-[#3111B6] shadow:lg" : "hover:bg-[#5932EA] hover:text-white hover:shadow-lg"}
          `}
        >
          <span>Help</span>
          <span>›</span>
        </Link>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex justify-center p-6 bg-gray-100">
        <Outlet /> {/* Renders current page */}
      </div>
    </div>
  );
}
