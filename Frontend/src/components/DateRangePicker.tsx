import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ICONS } from "../constants";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (startDate: string, endDate: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onChange,
  isOpen,
  onToggle,
}) => {
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);
  const [hoveredEl, setHoveredEl] = useState<string | null>(null);

  const getInitialMonth = () => {
    try {
      if (startDate === "1900-01-01" || !startDate) {
        return new Date();
      }
      return new Date(startDate);
    } catch {
      return new Date();
    }
  };

  const [currentMonth, setCurrentMonth] = useState(getInitialMonth());
  const [selectingStart, setSelectingStart] = useState(true);

  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [coords, setCoords] = useState<{
    left: number;
    top: number;
    width: number;
  } | null>(null);

  const hoverProps = (id: string) => ({
    onMouseEnter: () => setHoveredEl(id),
    onMouseLeave: () => setHoveredEl(null),
  });

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        left: rect.left,
        top: rect.bottom + window.scrollY,
        width: rect.width,
      });
    }

    const onResize = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setCoords({
          left: rect.left,
          top: rect.bottom + window.scrollY,
          width: rect.width,
        });
      }
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [isOpen]);

  useEffect(() => {
    try {
      if (startDate !== "1900-01-01" && startDate) {
        setCurrentMonth(new Date(startDate));
      }
    } catch {
      // keep current
    }
  }, [startDate]);

  useEffect(() => {
    if (!isOpen) return;

    const onDocClick = (ev: MouseEvent) => {
      const target = ev.target as Element;

      if (buttonRef.current && buttonRef.current.contains(target)) return;

      if (dropdownRef.current) {
        if (dropdownRef.current.contains(target)) return;
        if (target.closest && target.closest("[data-calendar-dropdown]"))
          return;
      }

      onToggle();
    };

    document.addEventListener("mousedown", onDocClick, false);

    return () => {
      document.removeEventListener("mousedown", onDocClick, false);
    };
  }, [isOpen, onToggle]);

  const formatDisplayDate = (date: string) => {
    if (date === "1900-01-01") return "Início";
    if (date === "2099-12-31") return "Fim";

    try {
      return new Date(date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return date;
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const handleDateClick = (date: Date, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const dateStr = date.toISOString().split("T")[0];

    if (selectingStart) {
      setTempStartDate(dateStr);
      setSelectingStart(false);
      if (new Date(dateStr) > new Date(tempEndDate)) {
        setTempEndDate(dateStr);
      }
    } else {
      if (new Date(dateStr) < new Date(tempStartDate)) {
        setTempStartDate(dateStr);
        setTempEndDate(dateStr);
      } else {
        setTempEndDate(dateStr);
      }
      setSelectingStart(true);
    }
  };

  const handleApply = () => {
    onChange(tempStartDate, tempEndDate);
    onToggle();
  };

  const handleCancel = () => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setSelectingStart(true);
    onToggle();
  };

  const handleReset = () => {
    const startDate = "1900-01-01";
    const endDate = "2099-12-31";

    setTempStartDate(startDate);
    setTempEndDate(endDate);
    onChange(startDate, endDate);
    onToggle();
  };

  const isDateInRange = (date: Date) => {
    const start = new Date(tempStartDate);
    const end = new Date(tempEndDate);
    return date >= start && date <= end;
  };

  const isDateSelected = (date: Date) => {
    return (
      date.toISOString().split("T")[0] === tempStartDate ||
      date.toISOString().split("T")[0] === tempEndDate
    );
  };

  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const getDayStyle = (
    date: Date,
    monthOffset: number,
    index: number,
  ): React.CSSProperties => {
    if (isDateSelected(date)) {
      return {
        backgroundColor: "var(--primary)",
        color: "white",
        fontWeight: 600,
      };
    }
    if (isDateInRange(date)) {
      return {
        backgroundColor: "var(--primary-bg)",
        color: "var(--primary)",
      };
    }
    const dayKey = `day-${monthOffset}-${index}`;
    return {
      backgroundColor:
        hoveredEl === dayKey ? "var(--bg-secondary)" : "transparent",
      color: "var(--text)",
    };
  };

  const renderCalendar = (monthOffset: number = 0) => {
    const displayMonth = new Date(currentMonth);
    displayMonth.setMonth(displayMonth.getMonth() + monthOffset);
    const days = getDaysInMonth(displayMonth);

    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          {monthOffset === 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const prev = new Date(currentMonth);
                prev.setMonth(prev.getMonth() - 1);
                setCurrentMonth(prev);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              {...hoverProps("nav-prev")}
              className="p-1 rounded transition-colors"
              style={{
                backgroundColor:
                  hoveredEl === "nav-prev"
                    ? "var(--bg-secondary)"
                    : "transparent",
                color: "var(--text)",
              }}
            >
              ←
            </button>
          )}
          <h3
            className="font-semibold text-sm"
            style={{ color: "var(--text)" }}
          >
            {monthNames[displayMonth.getMonth()]} {displayMonth.getFullYear()}
          </h3>
          {monthOffset === 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const next = new Date(currentMonth);
                next.setMonth(next.getMonth() + 1);
                setCurrentMonth(next);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              {...hoverProps("nav-next")}
              className="p-1 rounded transition-colors"
              style={{
                backgroundColor:
                  hoveredEl === "nav-next"
                    ? "var(--bg-secondary)"
                    : "transparent",
                color: "var(--text)",
              }}
            >
              →
            </button>
          )}
          {monthOffset === 0 && <div className="w-6"></div>}
          {monthOffset === 1 && <div className="w-6"></div>}
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-xs font-medium text-center p-2"
              style={{ color: "var(--text-secondary)" }}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => (
            <div key={index} className="aspect-square">
              {date && (
                <button
                  type="button"
                  onClick={(e) => handleDateClick(date, e)}
                  onMouseDown={(e) => e.stopPropagation()}
                  {...hoverProps(`day-${monthOffset}-${index}`)}
                  className="w-full h-full text-xs rounded-md transition-all"
                  style={getDayStyle(date, monthOffset, index)}
                >
                  {date.getDate()}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const dropdown = (
    <div
      ref={dropdownRef}
      data-calendar-dropdown="true"
      className="dropdown-filters rounded-xl"
      style={{
        left: coords?.left ?? 0,
        top: coords?.top ?? 0,
        width: "auto",
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow)",
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="p-3 sm:p-4"
        style={{ borderBottom: "1px solid var(--border-light)" }}
      >
        <div
          className="text-xs sm:text-sm mb-2"
          style={{ color: "var(--text-secondary)" }}
        >
          {selectingStart
            ? "Selecione a data de início"
            : "Selecione a data de fim"}
        </div>
        <div
          className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs sm:text-sm"
          style={{ color: "var(--text)" }}
        >
          <div>
            <span className="font-medium">Início:</span>{" "}
            {formatDisplayDate(tempStartDate)}
          </div>
          <div>
            <span className="font-medium">Fim:</span>{" "}
            {formatDisplayDate(tempEndDate)}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row">
        {renderCalendar(0)}
        <div
          className="border-l-0 sm:border-l border-t sm:border-t-0"
          style={{ borderColor: "var(--border)" }}
        ></div>
        {renderCalendar(1)}
      </div>

      <div
        className="flex flex-col sm:flex-row justify-between p-3 sm:p-4 gap-3 sm:gap-0"
        style={{ borderTop: "1px solid var(--border-light)" }}
      >
        <button
          type="button"
          onClick={handleCancel}
          {...hoverProps("cancel-btn")}
          className="w-full sm:w-auto px-4 py-2 text-sm rounded-lg transition-colors touch-manipulation min-h-[44px] sm:min-h-[36px] order-2 sm:order-1"
          style={{
            color: "var(--text-secondary)",
            backgroundColor:
              hoveredEl === "cancel-btn"
                ? "var(--bg-secondary)"
                : "transparent",
          }}
        >
          Cancelar
        </button>
        <div className="flex gap-2 order-1 sm:order-2">
          <button
            type="button"
            onClick={handleReset}
            {...hoverProps("reset-btn")}
            className="flex-1 sm:flex-none px-4 py-2 text-sm rounded-lg transition-colors touch-manipulation min-h-[44px] sm:min-h-[36px]"
            style={{
              color: "var(--warning)",
              border: "1px solid var(--warning)",
              backgroundColor:
                hoveredEl === "reset-btn"
                  ? "var(--warning-bg)"
                  : "transparent",
            }}
          >
            Resetar
          </button>
          <button
            type="button"
            onClick={handleApply}
            {...hoverProps("apply-btn")}
            className="flex-1 sm:flex-none px-4 py-2 text-sm text-white rounded-lg transition-colors touch-manipulation min-h-[44px] sm:min-h-[36px]"
            style={{
              backgroundColor: "var(--primary)",
              filter:
                hoveredEl === "apply-btn" ? "brightness(0.9)" : "none",
            }}
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={onToggle}
        {...hoverProps("trigger-btn")}
        className="w-full text-left rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 cursor-pointer flex items-center justify-between touch-manipulation min-h-[44px] sm:min-h-[36px] transition-colors"
        style={{
          backgroundColor:
            hoveredEl === "trigger-btn"
              ? "var(--card)"
              : "var(--bg-secondary)",
          border: "1px solid var(--border)",
          color: "var(--text)",
        }}
      >
        <span className="truncate pr-2">
          {startDate === "1900-01-01" && endDate === "2099-12-31"
            ? "Todos os dados"
            : `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`}
        </span>
        <div
          className={`transform transition-transform duration-200 flex-shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          {ICONS.chevronDown}
        </div>
      </button>
      {isOpen && coords && createPortal(dropdown, document.body)}
    </div>
  );
};

export default DateRangePicker;
