import React, { useState } from "react";

interface SummaryCardProps {
  title: string;
  value: number;
  subtitle?: string;
  subtitleColor?: string; // CSS color value, e.g. "var(--primary)"
  showBorder?: boolean;
  icon?: React.ReactNode;
  variant?: "positive" | "negative" | "neutral";
}

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  subtitle,
  subtitleColor,
  showBorder,
  icon,
  variant = "neutral",
}) => {
  const [hovered, setHovered] = useState(false);

  const isPositive = variant === "positive";
  const isNegative = variant === "negative";

  const accentColor = isPositive
    ? "var(--success)"
    : isNegative
    ? "var(--danger)"
    : "var(--primary)";

  const iconBg = isPositive
    ? "var(--success-bg)"
    : isNegative
    ? "var(--danger-bg)"
    : "var(--primary-bg)";

  return (
    <div
      className="rounded-2xl p-4 backdrop-blur-md transition touch-manipulation"
      style={{
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        boxShadow: hovered ? 'var(--shadow)' : 'var(--shadow-sm)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {title}
          </p>
          <div className="mt-2 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
            <h3
              className="text-xl sm:text-2xl font-semibold truncate"
              style={{ color: 'var(--text)' }}
            >
              {currency.format(value)}
            </h3>
            <span
              className="text-xs font-medium rounded-full flex-shrink-0"
              style={{ color: accentColor }}
            >
              {isPositive ? "↑ Receita" : isNegative ? "↓ Despesa" : "•"}
            </span>
          </div>
          {subtitle && (
            <div
              className={`mt-2 text-sm font-medium ${showBorder ? 'pb-1' : ''}`}
              style={{
                color: subtitleColor || 'var(--text-secondary)',
                ...(showBorder
                  ? { borderBottom: `2px solid ${subtitleColor || 'var(--border)'}` }
                  : {}),
              }}
            >
              <p className="truncate">{subtitle}</p>
            </div>
          )}
        </div>

        {icon ? (
          <div
            className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: iconBg }}
          >
            {icon}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default SummaryCard;
