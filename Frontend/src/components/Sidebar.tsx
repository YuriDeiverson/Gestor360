import React from "react";
import { ICONS } from "../constants";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
  logout: () => void;
  activePage: string;
  setActivePage: (page: string) => void;
}

/* =======================
   NAV LINK
======================= */
const NavLink: React.FC<{
  icon: React.ReactNode;
  label: string;
  pageName: string;
  activePage: string;
  onClick: (pageName: string) => void;
}> = ({ icon, label, pageName, activePage, onClick }) => {
  const isActive = activePage === pageName;

  return (
    <li>
      <button
        onClick={() => onClick(pageName)}
        className={`flex items-center w-full p-3 sm:p-4 rounded-lg transition-all duration-200 cursor-pointer active:scale-95 ${
          isActive
            ? "bg-emerald-50 text-emerald-700 font-semibold shadow-sm"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}
      >
        <span className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">{icon}</span>
        <span className="ml-2 sm:ml-3 truncate text-sm sm:text-base">{label}</span>
      </button>
    </li>
  );
};

/* =======================
   SIDEBAR
======================= */
const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  setIsOpen,
  isCollapsed,
  setIsCollapsed,
  logout,
  activePage,
  setActivePage,
}) => {
  const handleNavigation = (page: string) => {
    setActivePage(page);
    
    // Fecha automaticamente o sidebar em qualquer tela
    setIsOpen(false);
  };

  return (
    <>
      {/* OVERLAY (todas as telas quando sidebar está aberto) */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 shadow-xl
        transform transition-all duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        ${isCollapsed ? "w-16 sm:w-20" : "w-72 sm:w-80"}
        max-w-[85vw]`}
        aria-label="Barra lateral"
      >
        {/* HEADER */}
        <div
          className={`flex items-center ${
            isCollapsed ? "justify-center" : "justify-between"
          } mb-6 px-3 sm:px-4 pt-4`}
        >
          {!isCollapsed && (
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">Finanças</h1>
          )}

          {/* Botão fechar (desktop e mobile) */}
          {!isCollapsed && (
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
              aria-label="Fechar sidebar"
            >
              {ICONS.close}
            </button>
          )}
        </div>

        {/* NAVEGAÇÃO */}
        <nav className={`flex-1 ${isCollapsed ? "px-2" : "px-3 sm:px-4"}`}>
          <ul className="space-y-1 sm:space-y-2">
            <NavLink
              icon={ICONS.home}
              label={isCollapsed ? "" : "Dashboard"}
              pageName="dashboard"
              activePage={activePage}
              onClick={handleNavigation}
            />
            <NavLink
              icon={ICONS.transactions}
              label={isCollapsed ? "" : "Transações"}
              pageName="transactions"
              activePage={activePage}
              onClick={handleNavigation}
            />
            <NavLink
              icon={ICONS.goals}
              label={isCollapsed ? "" : "Metas"}
              pageName="goals"
              activePage={activePage}
              onClick={handleNavigation}
            />
            <NavLink
              icon={ICONS.creditCard}
              label={isCollapsed ? "" : "Cartões"}
              pageName="cards"
              activePage={activePage}
              onClick={handleNavigation}
            />
            <NavLink
              icon={ICONS.budgets}
              label={isCollapsed ? "" : "Orçamentos"}
              pageName="budgets"
              activePage={activePage}
              onClick={handleNavigation}
            />
          </ul>
        </nav>

        {/* FOOTER */}
        <div
          className={`mt-6 border-t border-gray-200 ${
            isCollapsed ? "px-2 pt-4 pb-6" : "px-3 sm:px-4 pt-4 pb-6"
          }`}
        >
          <button
            onClick={logout}
            className={`flex items-center ${
              isCollapsed ? "justify-center" : "w-full"
            } p-3 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition`}
            title={isCollapsed ? "Sair" : ""}
          >
            <span className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
              {ICONS.logout}
            </span>
            {!isCollapsed && (
              <span className="ml-2 sm:ml-3 text-sm sm:text-base">Sair</span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
