import React, { useState } from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const [prevHovered, setPrevHovered] = useState(false);
  const [nextHovered, setNextHovered] = useState(false);

  const handlePrevious = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };
  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  return (
    <div
      className="flex items-center justify-between mt-4 sm:mt-6 pt-4"
      style={{ borderTop: "1px solid var(--border)" }}
    >
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        onMouseEnter={() => setPrevHovered(true)}
        onMouseLeave={() => setPrevHovered(false)}
        className="px-3 sm:px-4 py-2 text-sm font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[44px] sm:min-h-[36px] transition-colors"
        style={{
          color: "var(--text)",
          backgroundColor: prevHovered ? "var(--bg-secondary)" : "var(--card)",
          border: "1px solid var(--border)",
        }}
        aria-label="Página anterior"
      >
        <span className="hidden sm:inline">Anterior</span>
        <span className="sm:hidden">‹</span>
      </button>

      <span
        className="text-xs sm:text-sm px-2"
        style={{ color: "var(--text-secondary)" }}
      >
        <span className="hidden sm:inline">
          Página{" "}
          <strong style={{ color: "var(--text)" }}>{currentPage}</strong> de{" "}
          {totalPages}
        </span>
        <span className="sm:hidden">
          <strong style={{ color: "var(--text)" }}>{currentPage}</strong>/
          {totalPages}
        </span>
      </span>

      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        onMouseEnter={() => setNextHovered(true)}
        onMouseLeave={() => setNextHovered(false)}
        className="px-3 sm:px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[44px] sm:min-h-[36px] transition-colors"
        style={{
          backgroundColor: "var(--primary)",
          border: "1px solid var(--primary)",
          filter: nextHovered ? "brightness(0.9)" : "none",
        }}
        aria-label="Próxima página"
      >
        <span className="hidden sm:inline">Próxima</span>
        <span className="sm:hidden">›</span>
      </button>
    </div>
  );
};

export default Pagination;
