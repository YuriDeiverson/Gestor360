import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

interface LayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* SIDEBAR */}
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        activePage={activePage}
        setActivePage={setActivePage}
        logout={() => console.log("logout")}
      />

      {/* MAIN */}
      <div
        className={`flex flex-col flex-1 transition-all duration-300
          ${isSidebarCollapsed ? "lg:ml-20" : "lg:ml-72"}`}
      >
        {/* NAVBAR */}
        <Navbar
          user={{
            name: "Usuário",
            email: "usuario@email.com",
          }}
          toggleSidebar={handleToggleSidebar}
        />

        {/* CONTEÚDO */}
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
