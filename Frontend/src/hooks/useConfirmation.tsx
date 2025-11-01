import { useState, useCallback } from "react";

interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  details?: string[];
}

interface ConfirmationState extends ConfirmationOptions {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const useConfirmation = () => {
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(
    null,
  );

  const showConfirmation = useCallback(
    (options: ConfirmationOptions): Promise<boolean> => {
      return new Promise((resolve) => {
        setConfirmation({
          ...options,
          isOpen: true,
          onConfirm: () => {
            setConfirmation(null);
            resolve(true);
          },
          onCancel: () => {
            setConfirmation(null);
            resolve(false);
          },
        });
      });
    },
    [],
  );

  const hideConfirmation = useCallback(() => {
    setConfirmation(null);
  }, []);

  return {
    confirmation,
    showConfirmation,
    hideConfirmation,
  };
};
