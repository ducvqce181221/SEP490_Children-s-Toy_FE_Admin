import React from "react";
import Button from "@/components/ui/button/Button";
import { PlusIcon } from "@/icons";

interface ShiftToolbarProps {
  onAddClick: () => void;
  isAdmin?: boolean;
}

const ShiftToolbar: React.FC<ShiftToolbarProps> = ({ onAddClick, isAdmin = false }) => {
  return (
    <div className="px-6 py-6 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">
            Shift Templates
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {isAdmin ? "Manage operational work shifts and capacity settings." : "View operational work shifts and default capacity settings."}
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              onClick={onAddClick}
              className="shadow-sm hover:shadow-md transition-shadow"
            >
              +Add New Shift
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShiftToolbar;
