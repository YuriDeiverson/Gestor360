import React, { useState, useEffect } from "react";

interface InstallmentNotificationProps {
  message: string;
  onClose: () => void;
}

const InstallmentNotification: React.FC<InstallmentNotificationProps> = ({
  message,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [closeHovered, setCloseHovered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-20 right-4 z-50 transform transition-all duration-300 ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <div
        className="text-white px-4 py-3 rounded-lg max-w-sm"
        style={{
          backgroundColor: "var(--primary)",
          boxShadow: "var(--shadow)",
        }}
      >
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Parcela Atualizada</p>
            <p
              className="text-xs"
              style={{ color: "var(--primary-light)" }}
            >
              {message}
            </p>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            onMouseEnter={() => setCloseHovered(true)}
            onMouseLeave={() => setCloseHovered(false)}
            className="flex-shrink-0"
            style={{
              color: closeHovered ? "white" : "rgba(255,255,255,0.7)",
            }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallmentNotification;
