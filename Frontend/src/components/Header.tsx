import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { TransactionStatus, Category } from "../utils/types";
import { useFilters } from "../hooks/useFilters";
import { availableAccounts } from "../utils/mockData";
import DateRangePicker from "./DateRangePicker";

interface HeaderProps {
  categories: Category[];
}

const CustomSelect: React.FC<{
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  isOpen: boolean;
  onToggle: () => void;
}> = ({ value, onChange, options, isOpen, onToggle }) => {
  const selectedOption = options.find((opt) => opt.value === value);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState<{
    left: number;
    top: number;
    width: number;
  } | null>(null);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        left: rect.left,
        top: rect.bottom + window.scrollY + 4,
        width: rect.width,
      });
    }
  }, [isOpen]);

  const dropdown =
    coords && isOpen ? (
      <div
        className="dropdown-filters bg-white rounded-xl border border-gray-200 shadow-lg max-h-56 overflow-y-auto z-50"
        style={{
          left: Math.max(
            8,
            Math.min(coords.left, window.innerWidth - coords.width - 8),
          ),
          top: coords.top,
          width: Math.min(coords.width, window.innerWidth - 16),
        }}
        data-dropdown="true"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="p-2">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={(e) => {
                e.stopPropagation();
                onChange(option.value);
                onToggle();
              }}
              className={`w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer text-sm touch-manipulation active:bg-gray-100 transition-colors ${
                value === option.value
                  ? "bg-emerald-50 text-emerald-700 font-medium"
                  : "text-gray-700"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    ) : null;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={onToggle}
        className="w-full text-left bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-300 cursor-pointer flex items-center justify-between touch-manipulation min-h-[44px] sm:min-h-[36px]"
      >
        <span className="truncate">
          {selectedOption?.label || "Selecione..."}
        </span>
        <svg
          className={`h-4 w-4 text-gray-500 flex-shrink-0 ml-2 transform transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {dropdown && createPortal(dropdown, document.body)}
    </div>
  );
};

const MultiSelectDropdown: React.FC<{
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  label: string;
  isOpen: boolean;
  onToggle: () => void;
}> = ({ options, selected, onChange, label, isOpen, onToggle }) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState<{
    left: number;
    top: number;
    width: number;
  } | null>(null);
  const isAllSelected = selected.length === options.length;

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        left: rect.left,
        top: rect.bottom + window.scrollY + 4,
        width: rect.width,
      });
    }
  }, [isOpen]);

  const handleToggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((i) => i !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const handleSelectAll = () => {
    onChange(isAllSelected ? [] : options);
  };

  const dropdown =
    coords && isOpen ? (
      <div
        className="dropdown-filters bg-white rounded-xl border border-gray-200 shadow-xl max-h-64 overflow-y-auto z-50"
        style={{
          left: Math.max(
            8,
            Math.min(coords.left, window.innerWidth - coords.width - 8),
          ),
          top: coords.top,
          width: Math.min(coords.width, window.innerWidth - 16),
        }}
        data-dropdown="true"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="p-2">
          <label className="flex items-center px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer touch-manipulation active:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={(e) => {
                e.stopPropagation();
                handleSelectAll();
              }}
              className="h-4 w-4 text-emerald-600 rounded cursor-pointer"
            />
            <span className="ml-3 text-sm text-gray-600 font-medium">
              Selecionar todos
            </span>
          </label>
          <hr className="my-2 border-gray-100" />
          {options.map((option) => (
            <label
              key={option}
              className="flex items-center px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer touch-manipulation active:bg-gray-100 transition-colors"
            >
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={(e) => {
                  e.stopPropagation();
                  handleToggle(option);
                }}
                className="h-4 w-4 text-emerald-600 rounded cursor-pointer"
              />
              <span className="ml-3 text-sm text-gray-700">{option}</span>
            </label>
          ))}
        </div>
      </div>
    ) : null;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={onToggle}
        className="w-full text-left bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-300 cursor-pointer touch-manipulation min-h-[44px] sm:min-h-[36px] flex items-center justify-between"
      >
        <span className="truncate">
          {label} ({selected.length})
        </span>
        <svg
          className={`h-4 w-4 text-gray-500 flex-shrink-0 ml-2 transform transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {dropdown && createPortal(dropdown, document.body)}
    </div>
  );
};

const Header: React.FC<HeaderProps> = ({ categories }) => {
  const { filters, setFilters } = useFilters();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  const labelClass = "text-sm font-medium text-gray-700";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;

      // Verifica se o clique foi no header ou seus filhos
      if (headerRef.current && headerRef.current.contains(target)) {
        return;
      }

      // Verifica se o clique foi em qualquer dropdown (Portal ou normal)
      if (
        target.closest(".dropdown-filters") ||
        target.closest("[data-dropdown]") ||
        target.classList.contains("dropdown-filters")
      ) {
        return;
      }

      // Se chegou até aqui, foi um clique fora - fecha os dropdowns
      setOpenDropdown(null);
      setIsDatePickerOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDropdownToggle = (dropdownName: string) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
    setIsDatePickerOpen(false);
  };

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    setFilters((f) => ({ ...f, startDate, endDate }));
  };

  const handleDatePickerToggle = () => {
    const newIsOpen = !isDatePickerOpen;
    setIsDatePickerOpen(newIsOpen);
    if (newIsOpen) setOpenDropdown(null);
  };

  return (
    <header ref={headerRef} className="mb-4 sm:mb-6">
      {/* Botão de Toggle para Mobile */}
      <button
        onClick={() => setIsFiltersVisible(!isFiltersVisible)}
        className="lg:hidden w-full mb-3 flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:bg-gray-50 transition-colors touch-manipulation"
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          <span className="font-semibold text-gray-900">Filtros</span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
            isFiltersVisible ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Painel de Filtros */}
      <div
        className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 transition-all duration-300 ease-in-out ${
          isFiltersVisible ? "block" : "hidden lg:block"
        }`}
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-6 hidden lg:block">
          Filtros
        </h2>

        {/* Grid de Filtros - Desktop 4 colunas, Mobile responsivo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Período */}
          <div>
            <label className={labelClass}>Período</label>
            <div className="mt-1">
              <DateRangePicker
                startDate={filters.startDate}
                endDate={filters.endDate}
                onChange={handleDateRangeChange}
                isOpen={isDatePickerOpen}
                onToggle={handleDatePickerToggle}
              />
            </div>
          </div>

          {/* Contas */}
          <div>
            <label className={labelClass}>Contas</label>
            <div className="mt-1">
              <MultiSelectDropdown
                options={availableAccounts}
                selected={filters.accounts}
                onChange={(s) => setFilters((f) => ({ ...f, accounts: s }))}
                label="Contas"
                isOpen={openDropdown === "accounts"}
                onToggle={() => handleDropdownToggle("accounts")}
              />
            </div>
          </div>

          {/* Categorias */}
          <div>
            <label className={labelClass}>Categorias</label>
            <div className="mt-1">
              <MultiSelectDropdown
                options={categories.map((cat) => cat.name)}
                selected={filters.industries}
                onChange={(s) => setFilters((f) => ({ ...f, industries: s }))}
                label="Categorias"
                isOpen={openDropdown === "industries"}
                onToggle={() => handleDropdownToggle("industries")}
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className={labelClass}>Status</label>
            <div className="mt-1">
              <CustomSelect
                value={filters.status}
                onChange={(value) =>
                  setFilters((f) => ({
                    ...f,
                    status: value as TransactionStatus | "all",
                  }))
                }
                options={[
                  { value: "all", label: "Todos" },
                  { value: "completed", label: "Completo" },
                  { value: "pending", label: "Pendente" },
                ]}
                isOpen={openDropdown === "status"}
                onToggle={() => handleDropdownToggle("status")}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
