"use client";

import React from "react";

interface StaffLoadChartProps {
  data: {
    staffName: string;
    load: number;
    max: number;
  }[];
}

const StaffLoadChart: React.FC<StaffLoadChartProps> = ({ data }) => {
  if (data.length === 0) return null;

  const globalMax = Math.max(...data.map((d) => d.max), 1);

  return (
    <div className="space-y-3">
      {data.map((item, i) => {
        const pct = item.max > 0 ? Math.round((item.load / item.max) * 100) : 0;
        const isOverloaded = pct >= 100;
        const isHeavy = pct > 80 && !isOverloaded;

        const barColor = isOverloaded
          ? "bg-error-500"
          : isHeavy
          ? "bg-warning-500"
          : "bg-brand-500";

        const pctColor = isOverloaded
          ? "text-error-600 dark:text-error-400"
          : isHeavy
          ? "text-warning-600 dark:text-warning-400"
          : "text-brand-600 dark:text-brand-400";

        const barWidth = item.max > 0 ? (item.load / globalMax) * 100 : 0;

        return (
          <div key={i} className="group">
            {/* Name + stats row */}
            <div className="flex items-center justify-between mb-1.5 gap-4">
              <div className="flex items-center gap-2 min-w-0">
                {/* Initials avatar */}
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-black text-white ${barColor} shadow-sm`}>
                  {item.staffName?.[0]?.toUpperCase() ?? "?"}
                </div>
                <span className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">
                  {item.staffName}
                </span>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-gray-400 font-medium tabular-nums">
                  {item.load}
                  <span className="text-gray-300 dark:text-gray-600 mx-0.5">/</span>
                  {item.max}
                </span>
                <span className={`text-xs font-black tabular-nums w-10 text-right ${pctColor}`}>
                  {pct}%
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
                style={{ width: `${Math.min(barWidth, 100)}%` }}
              />
            </div>

            {/* Threshold marker at max capacity */}
            {item.load > 0 && item.max > 0 && (
              <div className="flex justify-end mt-0.5">
                <span className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">
                  capacity: {item.max} orders
                </span>
              </div>
            )}
          </div>
        );
      })}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 mt-2 border-t border-gray-100 dark:border-gray-800">
        {[
          { color: "bg-brand-500", label: "Normal (≤80%)" },
          { color: "bg-warning-500", label: "Heavy (81–99%)" },
          { color: "bg-error-500", label: "Overloaded (≥100%)" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className={`inline-block h-2 w-4 rounded-full ${l.color}`} />
            <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StaffLoadChart;
