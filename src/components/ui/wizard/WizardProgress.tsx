import React from "react";

interface WizardProgressProps {
  steps: string[];
  currentStep: number;
}

export const WizardProgress: React.FC<WizardProgressProps> = ({ steps, currentStep }) => (
  // Thêm max-w-md và mx-auto để giới hạn độ dài của 2 bước, kéo chúng sát lại giữa
  <div className="flex items-center gap-0 mb-8 max-w-md mx-auto">
    {steps.map((label, i) => {
      const step = i + 1;
      const active = step === currentStep;
      const done = step < currentStep;
      return (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center shrink-0">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all ${
                done
                  ? "bg-brand-500 border-brand-500 text-white"
                  : active
                  ? "bg-white border-brand-500 text-brand-500 shadow-md"
                  : "bg-white border-gray-300 text-gray-400"
              }`}
            >
              {done ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                step
              )}
            </div>
            <span
              className={`text-xs mt-1.5 font-medium whitespace-nowrap ${
                active ? "text-brand-600" : done ? "text-brand-500" : "text-gray-400"
              }`}
            >
              {label}
            </span>
          </div>
          
          {i < steps.length - 1 && (
            <div
              // Thêm max-w-[100px] (hoặc thay đổi số px tùy ý) để giới hạn độ dài tối đa của đường nối
              className={`flex-1 h-0.5 mx-3 mb-5 rounded-full transition-all max-w-[150px] ${
                done ? "bg-brand-500" : "bg-gray-200"
              }`}
            />
          )}
        </React.Fragment>
      );
    })}
  </div>
);