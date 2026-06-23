import Button from "@/components/ui/button/Button";
import DatePicker from "@/components/form/date-picker";
import { PlusIcon, CalenderIcon, CopyIcon } from "@/icons";

interface WorkScheduleToolbarProps {
  dateFilter: string;
  onDateChange: (date: Date[]) => void;
  onTodayClick: () => void;
  onAssignClick: () => void;
  onCloneWeekClick: () => void;
  isCloningWeek?: boolean;
  isAdmin?: boolean;
}

const WorkScheduleToolbar: React.FC<WorkScheduleToolbarProps> = ({
  dateFilter,
  onDateChange,
  onTodayClick,
  onAssignClick,
  onCloneWeekClick,
  isCloningWeek = false,
  isAdmin = false,
}) => {
  return (
    <div className="px-5 py-5 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Daily Work Schedule
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {isAdmin ? "Manage staff assignments and track shift performance." : "View staff assignments and shift schedules."}
          </p>
        </div>
        {isAdmin && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              variant="outline"
              startIcon={<CopyIcon className="w-5 h-5" />}
              onClick={onCloneWeekClick}
              disabled={isCloningWeek}
            >
              {isCloningWeek ? "Copying..." : "Copy Last Week"}
            </Button>
            <Button
              variant="primary"
              onClick={onAssignClick}
            >
              +{" "}Assign Staff
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-xs">
          <DatePicker
            id="work-date-filter"
            defaultDate={dateFilter || undefined}
            onChange={onDateChange}
            placeholder="Select Date"
          />
        </div>

        <Button
          variant="outline"
          startIcon={<CalenderIcon className="w-6.5 h-6.5" />}
          onClick={onTodayClick}
          className="w-full sm:w-auto"
        >
          Jump to Today
        </Button>
      </div>
    </div>
  );
};

export default WorkScheduleToolbar;
