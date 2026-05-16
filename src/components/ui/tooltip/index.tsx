import React, { ReactNode, useState } from "react";
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
  arrow,
  FloatingArrow,
  Placement
} from "@floating-ui/react";

interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  position?: Placement;
  variant?: "dark" | "white";
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = "top",
  variant = "dark",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const [arrowEl, setArrowEl] = useState<SVGSVGElement | null>(null);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: position,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(10),
      flip({
        fallbackAxisSideDirection: "start",
        padding: 5,
      }),
      shift({ padding: 5 }),
      arrow({
        element: arrowEl,
      }),
    ],
  });

  const hover = useHover(context, { move: false });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "tooltip" });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ]);

  return (
    <>
      <div
        ref={(node) => refs.setReference(node)}
        {...getReferenceProps()}
        className={`inline-block ${className}`}
      >
        {children}
      </div>
      {isOpen && (
        <FloatingPortal>
          <div
            ref={(node) => refs.setFloating(node)}
            style={floatingStyles}
            {...getFloatingProps()}
            className={`z-9999 px-3 py-2 text-sm font-medium rounded-lg shadow-theme-xl transition-opacity duration-200 ${
              variant === "dark"
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                : "bg-white text-gray-800 border border-gray-200 shadow-lg"
            }`}
          >
            {content}
            <FloatingArrow
              // 3. Truyền hàm setArrowEl vào prop ref
              ref={setArrowEl}
              context={context}
              fill={variant === "dark" ? (context.placement.includes('dark') ? 'white' : 'currentColor') : "white"}
              stroke={variant === "white" ? "#E5E7EB" : "none"}
              strokeWidth={variant === "white" ? 1 : 0}
              className={variant === "dark" ? "text-gray-900 dark:text-white" : ""}
            />
          </div>
        </FloatingPortal>
      )}
    </>
  );
};

export default Tooltip;