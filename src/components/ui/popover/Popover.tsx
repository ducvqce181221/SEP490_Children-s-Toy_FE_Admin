"use client";
import React, { useEffect, useRef, useState, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";

export type PopoverPosition = "top" | "top-end" | "bottom" | "bottom-end" | "left" | "right";

interface PopoverProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  triggerRef: React.RefObject<HTMLElement | null>; // NEW: cần ref của trigger button
  position?: PopoverPosition;
  className?: string;
}

const ARROW_SIZE = 6;
const GAP = 8; // khoảng cách giữa trigger và popover

function getFixedPosition(
  triggerRect: DOMRect,
  popoverEl: HTMLElement,
  preferredPosition: PopoverPosition
): { top: number; left: number; actualPosition: PopoverPosition; arrowStyle: React.CSSProperties } {
  const popW = popoverEl.offsetWidth;
  const popH = popoverEl.offsetHeight;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Thử các vị trí theo thứ tự ưu tiên fallback
  const positionOrder: PopoverPosition[] = [
    preferredPosition,
    // fallback chain
    preferredPosition.startsWith("top") ? (preferredPosition === "top" ? "bottom" : "bottom-end") :
      preferredPosition.startsWith("bottom") ? (preferredPosition === "bottom" ? "top" : "top-end") :
        preferredPosition === "left" ? "right" : "left",
    "bottom",
    "top",
    "bottom-end",
    "top-end",
  ];

  const dedupedOrder = [...new Set(positionOrder)];

  for (const pos of dedupedOrder) {
    const coords = calcCoords(triggerRect, popW, popH, pos);
    if (
      coords.top >= GAP &&
      coords.left >= GAP &&
      coords.top + popH <= vh - GAP &&
      coords.left + popW <= vw - GAP
    ) {
      return { ...coords, actualPosition: pos, arrowStyle: calcArrow(triggerRect, coords, pos) };
    }
  }

  // Fallback: clamp vào viewport
  const coords = calcCoords(triggerRect, popW, popH, "bottom");
  const clampedTop = Math.min(Math.max(coords.top, GAP), vh - popH - GAP);
  const clampedLeft = Math.min(Math.max(coords.left, GAP), vw - popW - GAP);
  return {
    top: clampedTop,
    left: clampedLeft,
    actualPosition: "bottom",
    arrowStyle: calcArrow(triggerRect, { top: clampedTop, left: clampedLeft }, "bottom"),
  };
}

function calcCoords(
  triggerRect: DOMRect,
  popW: number,
  popH: number,
  pos: PopoverPosition
): { top: number; left: number } {
  const { top, left, right, bottom, width, height } = triggerRect;

  switch (pos) {
    case "top":
      return {
        top: top - popH - GAP,
        left: left + width / 2 - popW / 2,
      };
    case "top-end":
      return {
        top: top - popH - GAP,
        left: right - popW,
      };
    case "bottom":
      return {
        top: bottom + GAP,
        left: left + width / 2 - popW / 2,
      };
    case "bottom-end":
      return {
        top: bottom + GAP,
        left: right - popW,
      };
    case "left":
      return {
        top: top + height / 2 - popH / 2,
        left: left - popW - GAP,
      };
    case "right":
      return {
        top: top + height / 2 - popH / 2,
        left: right + GAP,
      };
  }
}

function calcArrow(
  triggerRect: DOMRect,
  popCoords: { top: number; left: number },
  pos: PopoverPosition
): React.CSSProperties {
  // Arrow luôn trỏ về phía trigger
  const triggerCenterX = triggerRect.left + triggerRect.width / 2;
  const triggerCenterY = triggerRect.top + triggerRect.height / 2;

  if (pos === "top" || pos === "top-end") {
    // Arrow ở bottom của popover, trỏ xuống
    return {
      bottom: -ARROW_SIZE,
      left: triggerCenterX - popCoords.left - ARROW_SIZE,
    };
  }
  if (pos === "bottom" || pos === "bottom-end") {
    // Arrow ở top của popover, trỏ lên
    return {
      top: -ARROW_SIZE,
      left: triggerCenterX - popCoords.left - ARROW_SIZE,
    };
  }
  if (pos === "left") {
    // Arrow ở right của popover
    return {
      right: -ARROW_SIZE,
      top: triggerCenterY - popCoords.top - ARROW_SIZE,
    };
  }
  if (pos === "right") {
    // Arrow ở left của popover
    return {
      left: -ARROW_SIZE,
      top: triggerCenterY - popCoords.top - ARROW_SIZE,
    };
  }
  return {};
}

function getArrowBorders(pos: PopoverPosition): string {
  // Border sides để tạo hình tam giác đúng chiều
  switch (pos) {
    case "top":
    case "top-end":
      return "border-b border-r"; // arrow pointing down
    case "bottom":
    case "bottom-end":
      return "border-t border-l"; // arrow pointing up
    case "left":
      return "border-t border-r"; // arrow pointing right
    case "right":
      return "border-b border-l"; // arrow pointing left
  }
}

export const Popover: React.FC<PopoverProps> = ({
  isOpen,
  onClose,
  children,
  triggerRef,
  position = "bottom",
  className = "",
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const [actualPosition, setActualPosition] = useState<PopoverPosition>(position);
  const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({});

  const reposition = useCallback(() => {
    if (!isOpen || !triggerRef.current || !popoverRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const result = getFixedPosition(triggerRect, popoverRef.current, position);

    setCoords({ top: result.top, left: result.left });
    setActualPosition(result.actualPosition);
    setArrowStyle(result.arrowStyle);
  }, [isOpen, position, triggerRef]);

  // Reposition sau khi popover render (để biết kích thước)
  useLayoutEffect(() => {
    if (isOpen) {
      // Chạy sau 1 frame để popover đã có kích thước
      const id = requestAnimationFrame(reposition);
      return () => cancelAnimationFrame(id);
    }
  }, [isOpen, reposition]);

  useEffect(() => {
    if (!isOpen || !popoverRef.current) return;

    const observer = new ResizeObserver(() => {
      reposition();
    });

    observer.observe(popoverRef.current);

    return () => observer.disconnect();
  }, [isOpen, reposition]);

  // Reposition khi scroll hoặc resize
  useEffect(() => {
    if (!isOpen) return;

    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [isOpen, reposition]);

  // Click outside để close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        onClose();
      }
    };

    // Delay để tránh trigger ngay lúc click mở
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  const arrowBorders = getArrowBorders(actualPosition);

  const popoverContent = (
    <div
      ref={popoverRef}
      style={{
        position: "fixed",
        top: coords?.top ?? -9999,
        left: coords?.left ?? -9999,
        // Ẩn cho đến khi tính được tọa độ
        visibility: coords ? "visible" : "hidden",
        zIndex: 9999,
      }}
      className={`w-max rounded-lg border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark ${className}`}
    >
      {/* Arrow */}
      <div
        className={`absolute w-3 h-3 rotate-45 border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-dark ${arrowBorders}`}
        style={arrowStyle}
      />
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );

  return createPortal(popoverContent, document.body);
};