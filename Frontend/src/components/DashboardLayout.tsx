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
    <div className="layout-responsive">
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

      {/* HEADER RESPONSIVO */}
      <header className="header-responsive">
        <Navbar
          user={{
            name: "Usuário",
            email: "usuario@email.com",
          }}
          toggleSidebar={handleToggleSidebar}
        />
      </header>

      {/* MAIN CONTENT */}
      <main className="main-responsive">
        <div className="container">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
