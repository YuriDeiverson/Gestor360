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
        className="dropdown-filters rounded-xl max-h-56 overflow-y-auto z-50"
        style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow)',
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
              className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
              style={{
                backgroundColor:
                  value === option.value ? 'var(--primary-bg)' : 'transparent',
                color:
                  value === option.value ? 'var(--primary)' : 'var(--text)',
                fontWeight: value === option.value ? 500 : 400,
              }}
              onMouseEnter={(e) => {
                if (value !== option.value) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                }
              }}
              onMouseLeave={(e) => {
                if (value !== option.value) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
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
        className="w-full rounded-lg px-3 py-2 text-sm flex items-center justify-between focus:ring-2"
        style={{
          backgroundColor: 'var(--input-bg)',
          border: '1px solid var(--input-border)',
          color: 'var(--text)',
          '--tw-ring-color': 'var(--primary-light)',
        } as React.CSSProperties}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--input-bg)';
        }}
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
        className="dropdown-filters rounded-xl max-h-64 overflow-y-auto z-50"
        style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow)',
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
            <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
              Selecionar todos
            </span>
          </label>

          <hr className="my-2" style={{ borderColor: 'var(--border)' }} />

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
              <span className="text-sm" style={{ color: 'var(--text)' }}>
                {option}
              </span>
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
        className="w-full rounded-lg px-3 py-2 text-sm flex justify-between"
        style={{
          backgroundColor: 'var(--input-bg)',
          border: '1px solid var(--input-border)',
          color: 'var(--text)',
        }}
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
  const { filters, setFilters, resetFilters } = useFilters();
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
      <div
        className="flex items-center justify-between rounded-2xl px-6 py-4"
        style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
            Dashboard
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Bem-vindo, aqui estão suas finanças
          </p>
        </div>

        <button
          onClick={() => setIsFiltersVisible(!isFiltersVisible)}
          className="p-3 rounded-xl transition-colors"
          style={{
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
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
        <div
          className="mt-4 rounded-2xl p-6"
          style={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
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

          <div className="mt-4 flex justify-end">
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-sm rounded-lg transition-colors"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--border)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
              }}
            >
              Mês Atual
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
