import React from "react";
import { Modal } from "./index";
import Button from "@/components/ui/button/Button";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = false,
  isLoading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[400px] p-6">
      <div className="flex flex-col items-center text-center mt-2">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${isDestructive ? 'bg-error-50 dark:bg-error-500/10 text-error-500' : 'bg-brand-50 dark:bg-brand-500/10 text-brand-500'}`}>
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {isDestructive ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            )}
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{message}</p>
        <div className="flex w-full gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button 
            variant="primary" 
            className={`flex-1 ${isDestructive ? 'bg-error-500 hover:bg-error-600 text-white border-transparent' : ''}`} 
            onClick={onConfirm} 
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
