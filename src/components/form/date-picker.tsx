import { useEffect, useRef } from 'react';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.css';
import Label from './Label';
import { CalenderIcon, TimeIcon } from '../../icons';
import Hook = flatpickr.Options.Hook;
import DateOption = flatpickr.Options.DateOption;

type PropsType = {
  id: string;
  mode?: "single" | "multiple" | "range" | "time";
  onChange?: Hook | Hook[];
  defaultDate?: DateOption;
  label?: string;
  placeholder?: string;
  enableTime?: boolean;
  dateFormat?: string;
  minDate?: DateOption;
  maxDate?: DateOption;
};

export default function DatePicker({
  id,
  mode,
  onChange,
  label,
  defaultDate,
  placeholder,
  enableTime,
  dateFormat,
  minDate,
  maxDate,
}: PropsType) {
  const fpRef = useRef<flatpickr.Instance | null>(null);

  useEffect(() => {
    const isTimeMode = mode === "time";
    const instance = flatpickr(`#${id}`, {
      mode: isTimeMode ? "single" : (mode || "single"),
      monthSelectorType: "static",
      dateFormat: dateFormat || (isTimeMode ? "H:i" : "Y-m-d"),
      enableTime: enableTime || isTimeMode,
      noCalendar: isTimeMode,
      minDate: minDate,
      maxDate: maxDate,
      defaultDate,
      onChange,
    });
    
    fpRef.current = Array.isArray(instance) ? instance[0] : instance;

    return () => {
      fpRef.current?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, id]); // Initialize once

  useEffect(() => {
    if (!fpRef.current) return;
    if (minDate !== undefined) fpRef.current.set("minDate", minDate);
  }, [minDate]);

  useEffect(() => {
    if (!fpRef.current) return;
    if (maxDate !== undefined) fpRef.current.set("maxDate", maxDate);
  }, [maxDate]);

  useEffect(() => {
    if (fpRef.current) {
      if (defaultDate) {
        fpRef.current.setDate(defaultDate, false);
      } else {
        fpRef.current.clear(false);
      }
    }
  }, [defaultDate]);

  return (
    <div>
      {label && <Label htmlFor={id}>{label}</Label>}

      <div className="relative">
        <input
          id={id}
          placeholder={placeholder}
          className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3  dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30  bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700  dark:focus:border-brand-800"
        />

        <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
          {mode === "time" ? (
            <TimeIcon className="size-5" />
          ) : (
            <CalenderIcon className="size-6" />
          )}
        </span>
      </div>
    </div>
  );
}
