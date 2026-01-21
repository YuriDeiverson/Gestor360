import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { TransactionStatus, Category } from "../utils/types";
import { useFilters } from "../hooks/useFilters";
import { availableAccounts } from "../utils/mockData";
import DateRangePicker from "./DateRangePicker";

/* =======================
   TYPES
======================= */
interface HeaderProps {
  categories: Category[];
}

/* =======================
   CUSTOM SELECT
======================= */
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
            Math.min(coords.left, window.innerWidth - coords.width - 8)
          ),
          top: coords.top,
          width: Math.min(coords.width, window.innerWidth - 16),
        }}
        data-dropdown
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
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                value === option.value
                  ? "bg-emerald-50 text-emerald-700 font-medium"
                  : "text-gray-700 hover:bg-gray-50"
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
        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm flex items-center justify-between hover:bg-gray-100 focus:ring-2 focus:ring-emerald-300"
      >
        <span className="truncate">{selectedOption?.label}</span>
        <svg
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {dropdown && createPortal(dropdown, document.body)}
    </div>
  );
};

/* =======================
   MULTI SELECT
======================= */
const MultiSelectDropdown: React.FC<{
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  label: string;
  isOpen: boolean;
  onToggle: () => void;
}> = ({ options, selected, onChange, label, isOpen, onToggle }) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState<any>(null);
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

  const dropdown =
    coords && isOpen ? (
      <div
        className="dropdown-filters bg-white rounded-xl border border-gray-200 shadow-xl max-h-64 overflow-y-auto z-50"
        style={{
          left: coords.left,
          top: coords.top,
          width: coords.width,
        }}
        data-dropdown
      >
        <div className="p-2">
          <label className="flex items-center gap-2 px-3 py-2">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={() =>
                onChange(isAllSelected ? [] : options)
              }
            />
            <span className="text-sm font-medium">Selecionar todos</span>
          </label>

          <hr className="my-2" />

          {options.map((option) => (
            <label key={option} className="flex items-center gap-2 px-3 py-2">
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() =>
                  onChange(
                    selected.includes(option)
                      ? selected.filter((i) => i !== option)
                      : [...selected, option]
                  )
                }
              />
              <span className="text-sm">{option}</span>
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
        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm flex justify-between"
      >
        {label} ({selected.length})
        <svg
          className={`w-4 h-4 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {dropdown && createPortal(dropdown, document.body)}
    </div>
  );
};

/* =======================
   HEADER
======================= */
const Header: React.FC<HeaderProps> = ({ categories }) => {
  const { filters, setFilters } = useFilters();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (
        headerRef.current?.contains(target) ||
        target.closest(".dropdown-filters")
      ) {
        return;
      }
      setOpenDropdown(null);
      setIsDatePickerOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header ref={headerRef} className="mb-6">
      {/* HEADER TOP */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-200 px-6 py-4 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-gray-500">
            Bem-vindo, aqui estão suas finanças
          </p>
        </div>

        <button
          onClick={() => setIsFiltersVisible(!isFiltersVisible)}
          className="p-3 rounded-xl border border-gray-200 hover:bg-gray-50"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4h18l-7 8v6l-4 2v-8L3 4z"
            />
          </svg>
        </button>
      </div>

      {/* FILTERS */}
      {isFiltersVisible && (
        <div className="mt-4 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <DateRangePicker
              startDate={filters.startDate}
              endDate={filters.endDate}
              onChange={(startDate, endDate) =>
                setFilters((f) => ({ ...f, startDate, endDate }))
              }
              isOpen={isDatePickerOpen}
              onToggle={() => {
                setIsDatePickerOpen(!isDatePickerOpen);
                setOpenDropdown(null);
              }}
            />

            <MultiSelectDropdown
              options={availableAccounts}
              selected={filters.accounts}
              onChange={(s) =>
                setFilters((f) => ({ ...f, accounts: s }))
              }
              label="Contas"
              isOpen={openDropdown === "accounts"}
              onToggle={() => setOpenDropdown("accounts")}
            />

            {/* Filtro de categorias desabilitado temporariamente */}

            <CustomSelect
              value={filters.status}
              onChange={(status) =>
                setFilters((f) => ({
                  ...f,
                  status: status as TransactionStatus | "all",
                }))
              }
              options={[
                { value: "all", label: "Todos" },
                { value: "completed", label: "Completo" },
                { value: "pending", label: "Pendente" },
              ]}
              isOpen={openDropdown === "status"}
              onToggle={() => setOpenDropdown("status")}
            />
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
