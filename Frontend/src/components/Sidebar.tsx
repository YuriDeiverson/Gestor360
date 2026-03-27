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
        className="flex items-center w-full p-3 sm:p-4 rounded-lg transition-all duration-200 cursor-pointer active:scale-95"
        style={{
          backgroundColor: isActive ? "var(--primary-bg)" : "transparent",
          color: isActive ? "var(--primary)" : "var(--text-secondary)",
          fontWeight: isActive ? 600 : 400,
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = "var(--card-hover)";
            e.currentTarget.style.color = "var(--text)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "var(--text-secondary)";
          }
        }}
      >
        <span className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center shrink-0 [&_svg]:!h-6 [&_svg]:!w-6 [&_svg]:!text-current">
          {icon}
        </span>
        <span className="ml-2 sm:ml-3 truncate text-sm sm:text-base">{label}</span>
      </button>
    </li>
  );
};

const SectionLabel: React.FC<{ children: React.ReactNode; isCollapsed: boolean }> = ({
  children,
  isCollapsed,
}) => {
  if (isCollapsed) return null;
  return (
    <li className="list-none px-3 pt-3 pb-1 first:pt-0">
      <p
        className="text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: "var(--text-muted)" }}
      >
        {children}
      </p>
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
  setIsCollapsed: _setIsCollapsed,
  logout,
  activePage,
  setActivePage,
}) => {
  const handleNavigation = (page: string) => {
    setActivePage(page);
    setIsOpen(false);
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-[50] transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{ backgroundColor: "var(--overlay)" }}
        onClick={() => setIsOpen(false)}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-[60] transform transition-all duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        ${isCollapsed ? "w-16 sm:w-20" : "w-72 sm:w-80"}
        max-w-[85vw]`}
        style={{
          backgroundColor: "var(--card)",
          borderRight: "1px solid var(--border)",
          boxShadow: "var(--shadow)",
        }}
        aria-label="Barra lateral"
      >
        <div
          className={`flex items-center ${
            isCollapsed ? "justify-center" : "justify-between"
          } mb-4 px-3 sm:px-4 pt-4`}
        >
          {!isCollapsed && (
            <h1 className="text-lg sm:text-xl font-semibold truncate" style={{ color: "var(--text)" }}>
              Finanças
            </h1>
          )}
          {!isCollapsed && (
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg transition"
              style={{ color: "var(--text-secondary)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--card-hover)";
                e.currentTarget.style.color = "var(--text)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
              aria-label="Fechar sidebar"
            >
              {ICONS.close}
            </button>
          )}
        </div>

        <nav className={`flex-1 ${isCollapsed ? "px-2" : "px-3 sm:px-4"} pb-4 overflow-y-auto`}>
          <ul className="space-y-1 sm:space-y-2">
            <SectionLabel isCollapsed={isCollapsed}>Visão geral</SectionLabel>
            <NavLink
              icon={ICONS.home}
              label={isCollapsed ? "" : "Dashboard"}
              pageName="dashboard"
              activePage={activePage}
              onClick={handleNavigation}
            />

            <SectionLabel isCollapsed={isCollapsed}>Finanças</SectionLabel>
            <NavLink
              icon={ICONS.income}
              label={isCollapsed ? "" : "Receitas"}
              pageName="income"
              activePage={activePage}
              onClick={handleNavigation}
            />
            <NavLink
              icon={ICONS.expense}
              label={isCollapsed ? "" : "Despesas"}
              pageName="expenses"
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

            <SectionLabel isCollapsed={isCollapsed}>Planejamento</SectionLabel>
            <NavLink
              icon={ICONS.budgets}
              label={isCollapsed ? "" : "Orçamento"}
              pageName="budgets"
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
              icon={ICONS.accounts}
              label={isCollapsed ? "" : "Assinaturas"}
              pageName="subscriptions"
              activePage={activePage}
              onClick={handleNavigation}
            />
          </ul>
        </nav>

        <div
          className={`mt-auto ${isCollapsed ? "px-2 pt-4 pb-6" : "px-3 sm:px-4 pt-4 pb-6"}`}
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <button
            onClick={logout}
            className={`flex items-center ${isCollapsed ? "justify-center" : "w-full"} p-3 rounded-lg transition`}
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--danger-bg)";
              e.currentTarget.style.color = "var(--danger)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
            title={isCollapsed ? "Sair" : ""}
          >
            <span className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">{ICONS.logout}</span>
            {!isCollapsed && <span className="ml-2 sm:ml-3 text-sm sm:text-base">Sair</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
