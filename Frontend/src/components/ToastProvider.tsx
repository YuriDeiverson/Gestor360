import React, { useState, useCallback } from "react";
import { ToastData } from "./Toast";
import { ToastContext } from "../contexts/ToastContext";

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = useCallback((toast: Omit<ToastData, "id">) => {
    const id =
      Math.random().toString(36).substring(2) + Date.now().toString(36);
    const newToast: ToastData = { ...toast, id };

    setToasts((prev) => [...prev, newToast]);
  }, []);

  const showSuccess = useCallback(
    (title: string, message: string) => {
      showToast({ type: "success", title, message });
    },
    [showToast],
  );

  const showError = useCallback(
    (title: string, message: string) => {
      showToast({ type: "error", title, message });
    },
    [showToast],
  );

  const showWarning = useCallback(
    (title: string, message: string) => {
      showToast({ type: "warning", title, message });
    },
    [showToast],
  );

  const showInfo = useCallback(
    (title: string, message: string) => {
      showToast({ type: "info", title, message });
    },
    [showToast],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const value = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

// Container para renderizar os toasts
import Toast from "./Toast";

interface ToastContainerProps {
  toasts: ToastData[];
  onRemove: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onRemove,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-3 max-w-sm w-full">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};
