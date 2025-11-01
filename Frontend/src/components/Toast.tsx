import React, { useEffect, useState, useCallback } from "react";

export interface ToastData {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastData;
  onRemove: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleRemove = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300);
  }, [onRemove, toast.id]);

  useEffect(() => {
    // Animação de entrada
    setTimeout(() => setIsVisible(true), 50);

    // Auto-remove após duração especificada
    const timer = setTimeout(() => {
      handleRemove();
    }, toast.duration || 4000);

    return () => clearTimeout(timer);
  }, [handleRemove, toast.duration]);

  const getToastStyles = () => {
    const baseStyles =
      "flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-300 transform";

    let typeStyles = "";
    let iconColor = "";

    switch (toast.type) {
      case "success":
        typeStyles = "bg-green-50/90 border-green-200 text-green-800";
        iconColor = "text-green-600";
        break;
      case "error":
        typeStyles = "bg-red-50/90 border-red-200 text-red-800";
        iconColor = "text-red-600";
        break;
      case "warning":
        typeStyles = "bg-yellow-50/90 border-yellow-200 text-yellow-800";
        iconColor = "text-yellow-600";
        break;
      case "info":
        typeStyles = "bg-blue-50/90 border-blue-200 text-blue-800";
        iconColor = "text-blue-600";
        break;
    }

    const animationStyles = isLeaving
      ? "opacity-0 translate-x-full scale-95"
      : isVisible
      ? "opacity-100 translate-x-0 scale-100"
      : "opacity-0 translate-x-full scale-95";

    return {
      baseStyles: `${baseStyles} ${typeStyles} ${animationStyles}`,
      iconColor,
    };
  };

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return (
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "error":
        return (
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "warning":
        return (
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "info":
        return (
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  const { baseStyles, iconColor } = getToastStyles();

  return (
    <div className={baseStyles}>
      <div className={iconColor}>{getIcon()}</div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-5">{toast.title}</p>
        <p className="text-sm leading-5 opacity-90 mt-1">{toast.message}</p>
      </div>

      <button
        onClick={handleRemove}
        className="flex-shrink-0 ml-2 p-1 rounded-md hover:bg-black/10 transition-colors duration-200"
        aria-label="Fechar notificação"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
};

export default Toast;
