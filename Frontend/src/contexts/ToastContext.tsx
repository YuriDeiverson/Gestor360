import { createContext } from "react";
import { ToastData } from "../components/Toast";

export interface ToastContextData {
  showToast: (toast: Omit<ToastData, "id">) => void;
  showSuccess: (title: string, message: string) => void;
  showError: (title: string, message: string) => void;
  showWarning: (title: string, message: string) => void;
  showInfo: (title: string, message: string) => void;
}

export const ToastContext = createContext<ToastContextData | undefined>(
  undefined,
);
