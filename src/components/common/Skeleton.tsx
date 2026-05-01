import React from "react";
import { twMerge } from "tailwind-merge";

interface SkeletonProps {
  className?: string;
  variant?: "rectangle" | "circle" | "text";
}

const Skeleton: React.FC<SkeletonProps> = ({ className, variant = "rectangle" }) => {
  const baseClasses = "animate-pulse bg-gray-200 dark:bg-white/10";
  
  const variantClasses = {
    rectangle: "rounded-md",
    circle: "rounded-full",
    text: "rounded h-4 w-full",
  };

  return (
    <div 
      className={twMerge(baseClasses, variantClasses[variant], className)} 
    />
  );
};

export default Skeleton;
