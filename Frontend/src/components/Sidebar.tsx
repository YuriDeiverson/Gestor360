import React from "react";
import { ICONS } from "../constants";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  logout: () => void;
  activePage: string;
  setActivePage: (page: string) => void;
}

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
        className={`flex items-center w-full p-3 sm:p-4 rounded-lg transition-all duration-200 cursor-pointer touch-manipulation active:scale-95 ${
          isActive
            ? "bg-emerald-50 text-emerald-700 font-semibold shadow-sm"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}
        aria-current={isActive ? "page" : undefined}
      >
        <span className="w-6 h-6 flex items-center justify-center flex-shrink-0">
          {icon}
        </span>
        <span className="ml-3 truncate text-sm sm:text-base">{label}</span>
      </button>
    </li>
  );
};

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  setIsOpen,
  logout,
  activePage,
  setActivePage,
}) => {
  const handleNavigation = (page: string) => {
    setActivePage(page);
    if (typeof window !== "undefined" && window.innerWidth < 1024)
      setIsOpen(false);
  };

  return (
    <>
      {/* Overlay Mobile */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
        aria-hidden
      />

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative inset-y-0 left-0 w-72 sm:w-80 lg:w-64 bg-white shadow-xl lg:shadow-none border-r border-gray-200 p-4 sm:p-6 flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
        aria-label="Barra lateral"
      >
        {/* Header do Sidebar */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
            Finanças
          </h1>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation active:scale-95"
            aria-label="Fechar menu"
          >
            {ICONS.close}
          </button>
        </div>

        {/* Navegação Principal */}
        <nav className="flex-1">
          <ul className="space-y-1 sm:space-y-2">
            <NavLink
              icon={ICONS.home}
              label="Dashboard"
              pageName="dashboard"
              activePage={activePage}
              onClick={handleNavigation}
            />
            <NavLink
              icon={ICONS.transactions}
              label="Transações"
              pageName="transactions"
              activePage={activePage}
              onClick={handleNavigation}
            />
            <NavLink
              icon={ICONS.goals}
              label="Metas"
              pageName="goals"
              activePage={activePage}
              onClick={handleNavigation}
            />
            <NavLink
              icon={ICONS.budgets}
              label="Orçamentos"
              pageName="budgets"
              activePage={activePage}
              onClick={handleNavigation}
            />
            <NavLink
              icon={ICONS.categories}
              label="Categorias"
              pageName="categories"
              activePage={activePage}
              onClick={handleNavigation}
            />
          </ul>
        </nav>

        {/* Footer do Sidebar */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={logout}
            className="flex items-center w-full p-3 sm:p-4 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 touch-manipulation active:scale-95"
          >
            <span className="w-6 h-6 flex items-center justify-center flex-shrink-0">
              {ICONS.logout}
            </span>
            <span className="ml-3 text-sm sm:text-base">Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
