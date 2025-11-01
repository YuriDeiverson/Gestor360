import React, { useState } from "react";
import Portal from "./Portal";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  details?: string[];
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  type = "danger",
  details = [],
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("Erro na confirmação:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case "danger":
        return {
          iconBg: "bg-red-100",
          iconColor: "text-red-600",
          confirmButton: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
          icon: (
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          ),
        };
      case "warning":
        return {
          iconBg: "bg-yellow-100",
          iconColor: "text-yellow-600",
          confirmButton:
            "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500",
          icon: (
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          ),
        };
      case "info":
        return {
          iconBg: "bg-blue-100",
          iconColor: "text-blue-600",
          confirmButton: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
          icon: (
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
              />
            </svg>
          ),
        };
    }
  };

  const typeStyles = getTypeStyles();

  return (
    <Portal>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9998] p-4">
        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-200 transform transition-all duration-300 scale-100">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            <div
              className={`flex-shrink-0 w-12 h-12 rounded-full ${typeStyles.iconBg} ${typeStyles.iconColor} flex items-center justify-center`}
            >
              {typeStyles.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
            </div>
          </div>

          {/* Details */}
          {details.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
              <div className="space-y-2">
                {details.map((detail, index) => (
                  <div
                    key={index}
                    className="text-sm text-gray-700 flex items-start gap-2"
                  >
                    <span className="text-gray-400 flex-shrink-0">•</span>
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading}
              className={`px-4 py-2.5 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 ${typeStyles.confirmButton} min-w-[80px] flex items-center justify-center`}
            >
              {isLoading ? (
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : null}
              {isLoading ? "Processando..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default ConfirmModal;
