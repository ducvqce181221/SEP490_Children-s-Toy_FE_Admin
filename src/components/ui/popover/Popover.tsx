"use client";
import React, { useState, useEffect } from "react";
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
  arrow,
  FloatingArrow,
  Placement
} from "@floating-ui/react";

export type PopoverPosition = Placement;

interface PopoverProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  triggerRef: React.RefObject<HTMLElement | null>;
  position?: PopoverPosition;
  className?: string;
}

const GAP = 12;

export const Popover: React.FC<PopoverProps> = ({
  isOpen,
  onClose,
  children,
  triggerRef,
  position = "bottom",
  className = "",
}) => {
  const [arrowEl, setArrowEl] = useState<SVGSVGElement | null>(null);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: (open) => {
      if (!open) onClose();
    },
    placement: position,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(GAP),
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

  // Gán reference thủ công từ triggerRef bên ngoài
  useEffect(() => {
    if (triggerRef.current) {
      refs.setReference(triggerRef.current);
    }
  }, [triggerRef, refs]);

  const dismiss = useDismiss(context);
  const role = useRole(context);

  const { getFloatingProps } = useInteractions([dismiss, role]);

  if (!isOpen) return null;

  return (
    <FloatingPortal>
      <div
        ref={(node) => refs.setFloating(node)}
        style={floatingStyles}
        {...getFloatingProps()}
        className={`z-9999 w-max rounded-lg border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark ${className}`}
      >
        <FloatingArrow
          ref={setArrowEl}
          context={context}
          strokeWidth={1}
          className="fill-white stroke-gray-200 dark:fill-gray-dark dark:stroke-gray-800"
        />
        <div className="relative z-10">{children}</div>
      </div>
    </FloatingPortal>
  );
};