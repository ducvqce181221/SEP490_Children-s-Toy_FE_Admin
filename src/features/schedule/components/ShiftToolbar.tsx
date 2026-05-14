import React from "react";
import Button from "@/components/ui/button/Button";
import { PlusIcon } from "@/icons";

interface ShiftToolbarProps {
  onAddClick: () => void;
}

const ShiftToolbar: React.FC<ShiftToolbarProps> = ({ onAddClick }) => {
  return (
    <div className="px-6 py-6 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">
            Shift Templates
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage operational work shifts and capacity settings.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="primary" 
            startIcon={<PlusIcon className="w-5 h-5" />} 
            onClick={onAddClick}
            className="shadow-sm hover:shadow-md transition-shadow"
          >
            Add New Shift
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ShiftToolbar;
