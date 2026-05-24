"use client";

import React, { useMemo, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { useTheme } from "@/context/ThemeContext";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface StaffLoadChartProps {
  data: {
    staffName: string;
    load: number;
    max: number;
  }[];
}

const StaffLoadChart: React.FC<StaffLoadChartProps> = ({ data }) => {
  const { theme } = useTheme();
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { series, categories } = useMemo(() => {
    // Sort by load descending so highest load is at the top
    const sortedData = [...data].sort((a, b) => b.load - a.load);
    const cat = sortedData.map(d => d.staffName);
    
    // Series 1: Normal Load (up to Max)
    const normalLoad = sortedData.map(d => Math.min(d.load, d.max));
    // Series 2: Remaining Capacity (Max - Load, if load < max)
    const remaining = sortedData.map(d => d.max > d.load ? d.max - d.load : 0);
    // Series 3: Overload (Load - Max, if load > max)
    const overload = sortedData.map(d => d.load > d.max ? d.load - d.max : 0);

    return {
      categories: cat,
      series: [
        {
          name: "Assigned Load",
          data: normalLoad
        },
        {
          name: "Remaining Capacity",
          data: remaining
        },
        {
          name: "Overload",
          data: overload
        }
      ]
    };
  }, [data]);

  if (!mounted || data.length === 0) return null;

  const isDark = theme === "dark";

  const options: ApexOptions = {
    chart: {
      type: "bar",
      stacked: true,
      toolbar: {
        show: false
      },
      fontFamily: "inherit",
      background: "transparent",
    },
    theme: {
      mode: isDark ? "dark" : "light",
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: "50%",
        borderRadius: 4,
        borderRadiusApplication: "end", // Round the end of the stack
      },
    },
    colors: ["#F97316", isDark ? "#1E40AF" : "#BFDBFE", "#EF4444"], // Orange, Blue (Remaining), Red
    stroke: {
      width: 1,
      colors: [isDark ? "#1F2937" : "#fff"] // Matches bg to act as gap between stacked bars
    },
    xaxis: {
      categories: categories,
      labels: {
        style: {
          colors: isDark ? "#9CA3AF" : "#6B7280"
        },
        formatter: (val) => {
          const num = Number(val);
          return isNaN(num) ? val : num.toFixed(0);
        }
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      title: {
         text: "Number of Orders",
         style: {
           color: isDark ? "#6B7280" : "#9CA3AF",
           fontWeight: 500,
           fontSize: "12px"
         }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: isDark ? "#E5E7EB" : "#374151",
          fontWeight: 600,
          fontSize: "13px"
        }
      }
    },
    dataLabels: {
      enabled: true,
      formatter: function (val) {
        return val ? val : ""; // Only show label if value > 0
      },
      style: {
        fontSize: '12px',
        fontWeight: 'bold',
        colors: ['#fff']
      },
      dropShadow: {
        enabled: true,
        top: 1,
        left: 1,
        blur: 1,
        color: '#000',
        opacity: 0.45
      }
    },
    tooltip: {
      theme: isDark ? "dark" : "light",
      y: {
        formatter: function (val) {
          return val + " orders";
        }
      }
    },
    fill: {
      opacity: 1
    },
    legend: {
      position: "top",
      horizontalAlign: "center",
      markers: {
        size: 6, // controls marker size (optional)
        shape: "circle", // makes legend markers perfectly circular
      },
      labels: {
        colors: isDark ? "#D1D5DB" : "#4B5563"
      }
    },
    grid: {
      borderColor: isDark ? "#374151" : "#F3F4F6",
      strokeDashArray: 4,
      xaxis: {
        lines: {
          show: true
        }
      },
      yaxis: {
        lines: {
          show: false
        }
      }
    }
  };

  // Adjust height based on number of staff members to prevent squishing
  const chartHeight = Math.max(280, data.length * 60 + 120);

  return (
    <div className="w-full">
      <ReactApexChart 
        options={options} 
        series={series} 
        type="bar" 
        height={chartHeight} 
      />
    </div>
  );
};

export default StaffLoadChart;
