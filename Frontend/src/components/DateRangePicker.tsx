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

  // Inicializar currentMonth com a data de início dos dados
  const getInitialMonth = () => {
    try {
      // Se as datas estão resetadas (dados totais), usar data atual
      if (startDate === "1900-01-01" || !startDate) {
        return new Date();
      }
      // Caso contrário, usar a data de início dos dados
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

  // Atualizar currentMonth quando startDate mudar (ex: novos dados carregados)
  useEffect(() => {
    try {
      if (startDate !== "1900-01-01" && startDate) {
        setCurrentMonth(new Date(startDate));
      }
    } catch {
      // Se houver erro na data, manter o currentMonth atual
    }
  }, [startDate]);

  useEffect(() => {
    if (!isOpen) return;

    const onDocClick = (ev: MouseEvent) => {
      const target = ev.target as Element;

      // Se clicou no botão, deixar o botão lidar com isso
      if (buttonRef.current && buttonRef.current.contains(target)) return;

      // Se clicou dentro do dropdown (incluindo elementos portalizados)
      if (dropdownRef.current) {
        if (dropdownRef.current.contains(target)) return;
        // Verifica se é um elemento filho do dropdown via data attribute
        if (target.closest && target.closest("[data-calendar-dropdown]"))
          return;
      }

      // Se chegou até aqui, clicou fora - fechar
      onToggle();
    };

    // Usar mousedown em vez de click para capturar antes
    document.addEventListener("mousedown", onDocClick, false);

    return () => {
      document.removeEventListener("mousedown", onDocClick, false);
    };
  }, [isOpen, onToggle]);

  const formatDisplayDate = (date: string) => {
    // Se a data está resetada (datas muito amplas), mostrar texto especial
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

    // Dias vazios no início
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Dias do mês
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
      // Se a data de início for posterior à de fim, ajusta a data de fim
      if (new Date(dateStr) > new Date(tempEndDate)) {
        setTempEndDate(dateStr);
      }
    } else {
      // Se a data de fim for anterior à de início, ajusta a data de início
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
    // Limpar completamente os filtros de data - sem restrições
    // Usar datas muito amplas para mostrar todos os dados
    const startDate = "1900-01-01"; // Data muito antiga
    const endDate = "2099-12-31"; // Data muito futura

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
              className="p-1 hover:bg-gray-100 rounded"
            >
              ←
            </button>
          )}
          <h3 className="font-semibold text-sm">
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
              className="p-1 hover:bg-gray-100 rounded"
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
              className="text-xs font-medium text-gray-500 text-center p-2"
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
                  className={`
                    w-full h-full text-xs rounded-md transition-all
                    ${
                      isDateSelected(date)
                        ? "bg-emerald-500 text-white font-semibold"
                        : isDateInRange(date)
                        ? "bg-emerald-100 text-emerald-700"
                        : "hover:bg-gray-100 text-gray-700"
                    }
                  `}
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
      className="dropdown-filters bg-white rounded-xl border border-gray-200 shadow-lg"
      style={{
        left: coords?.left ?? 0,
        top: coords?.top ?? 0,
        width: "auto",
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-3 sm:p-4 border-b border-gray-100">
        <div className="text-xs sm:text-sm text-gray-600 mb-2">
          {selectingStart
            ? "Selecione a data de início"
            : "Selecione a data de fim"}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs sm:text-sm">
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
        <div className="border-l-0 sm:border-l border-t sm:border-t-0 border-gray-200"></div>
        {renderCalendar(1)}
      </div>

      <div className="flex flex-col sm:flex-row justify-between p-3 sm:p-4 border-t border-gray-100 gap-3 sm:gap-0">
        <button
          type="button"
          onClick={handleCancel}
          className="w-full sm:w-auto px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation min-h-[44px] sm:min-h-[36px] order-2 sm:order-1"
        >
          Cancelar
        </button>
        <div className="flex gap-2 order-1 sm:order-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 sm:flex-none px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 border border-orange-200 rounded-lg transition-colors touch-manipulation min-h-[44px] sm:min-h-[36px]"
          >
            Resetar
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 sm:flex-none px-4 py-2 text-sm bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors touch-manipulation min-h-[44px] sm:min-h-[36px]"
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
        className="w-full text-left bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-300 cursor-pointer flex items-center justify-between touch-manipulation min-h-[44px] sm:min-h-[36px]"
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
