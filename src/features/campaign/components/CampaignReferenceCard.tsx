"use client";

import React from "react";
import type { Campaign, ResolvedFlashProductLine, ResolvedReference } from "../types/campaign";
import { mapReferenceDefaultActionToAdminUrl } from "../utils/map-reference-admin-url";
import {
  formatFlashSlotRangeVi,
  formatPlaceholderValueDisplay,
  getFlashSlotPhase,
  humanizePlaceholderLabel,
  isFlashSalePromotionType,
  shouldHighlightScheduleRow,
  type FlashSlotPhase,
} from "../utils/reference-placeholder-labels";

const REFERENCE_META: Record<
  string,
  { label: string; icon: React.ReactNode }
> = {
  VOUCHER: {
    label: "Voucher / Discount Code",
    icon: (
      <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185zM9.75 9h.008v.008H9.75V9zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 4.5h.008v.008h-.008V13.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
  },
  PRODUCT: {
    label: "Product",
    icon: (
      <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
      </svg>
    ),
  },
  BLOG: {
    label: "Article / Blog",
    icon: (
      <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  SALE: {
    label: "Sale Program",
    icon: (
      <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
      </svg>
    ),
  },
  OTHER: {
    label: "Other",
    icon: (
      <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      </svg>
    ),
  },
};

function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function flashLineRemaining(line: ResolvedFlashProductLine): number {
  return Math.max(0, line.saleQuantity - line.soldQuantity - line.reservedQuantity);
}

export interface CampaignReferenceCardProps {
  campaignName: string;
  referenceType: string | null | undefined;
  referenceId: number | null | undefined;
  resolvedReference?: ResolvedReference | null;
  /** Khi true: nhấn Start/End Date cho màn đặt lịch */
  scheduleContextNote?: boolean;
  className?: string;
  imageUrl?: string | null;
}

export const CampaignReferenceCard: React.FC<CampaignReferenceCardProps> = ({
  campaignName,
  referenceType,
  referenceId,
  resolvedReference,
  scheduleContextNote = false,
  className = "",
  imageUrl,
}) => {
  const [isSlotsExpanded, setIsSlotsExpanded] = React.useState(true);

  if (!referenceType) {
    return (
      <div
        className={`rounded-2xl border border-gray-200 dark:border-white/[0.05] bg-white dark:bg-white/[0.03] p-5 shadow-sm ${className}`}
      >
        <div className="flex items-center gap-3 mb-3">
          <span className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
            {REFERENCE_META.OTHER.icon}
          </span>
          <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            General notification
          </h3>
        </div>
        <p className="text-base font-semibold text-gray-800 dark:text-white/90">{campaignName}</p>
      </div>
    );
  }

  const meta = REFERENCE_META[referenceType] ?? REFERENCE_META.OTHER;
  const placeholders = resolvedReference?.placeholders ?? {};
  const flashSaleTypeMatch = isFlashSalePromotionType(resolvedReference?.promotionType);
  const rawFlashSlots = resolvedReference?.flashTimeSlots;
  const flashSlotsList = Array.isArray(rawFlashSlots) ? rawFlashSlots : [];

  function flashPhaseRank(p: FlashSlotPhase): number {
    if (p === "live") return 0;
    if (p === "upcoming") return 1;
    return 2;
  }

  const orderedFlashSlots =
    flashSlotsList.length > 0
      ? (() => {
        const now = new Date();
        return [...flashSlotsList].sort((a, b) => {
          const sa = new Date(a.startAtUtc);
          const ea = new Date(a.endAtUtc);
          const sb = new Date(b.startAtUtc);
          const eb = new Date(b.endAtUtc);
          const pa = getFlashSlotPhase(now, sa, ea);
          const pb = getFlashSlotPhase(now, sb, eb);
          if (flashPhaseRank(pa) !== flashPhaseRank(pb)) {
            return flashPhaseRank(pa) - flashPhaseRank(pb);
          }
          return sa.getTime() - sb.getTime();
        });
      })()
      : [];

  return (
    <div
      className={`rounded-2xl border border-gray-200 dark:border-white/[0.05] bg-white dark:bg-white/[0.03] p-5 shadow-sm ${className}`}
    >
      <div className="flex items-center gap-3 mb-4">
        <span className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800">{meta.icon}</span>
        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {meta.label}
        </h3>
      </div>

      {resolvedReference ? (
        <div className="space-y-5">
          <div className="space-y-3">

            <div className="flex items-center gap-3">
              {(resolvedReference.imageUrl || imageUrl) &&
              referenceType !== "VOUCHER" &&
              referenceType !== "SALE" ? (
                <img
                  src={resolvedReference.imageUrl || imageUrl || ""}
                  alt={resolvedReference.displayName || "Reference"}
                  className="w-12 h-12 rounded-lg object-cover border border-gray-200 dark:border-white/10 bg-white flex-shrink-0"
                />
              ) : null}
              <p className="text-base font-semibold text-gray-800 dark:text-white/90 line-clamp-2">
                {resolvedReference.displayName || "—"}
              </p>
            </div>
            {resolvedReference.promotionType ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Type: <span className="font-medium text-gray-700 dark:text-gray-300">{resolvedReference.promotionType}</span>
              </p>
            ) : null}
            {Object.entries(placeholders).map(([key, val]) => {
              const { text, isLikelyDate } = formatPlaceholderValueDisplay(key, val);
              const highlight =
                scheduleContextNote &&
                (shouldHighlightScheduleRow(key, resolvedReference) || isLikelyDate);
              return (
                <div
                  key={key}
                  className={`flex gap-2 text-sm justify-between items-start rounded-lg px-2 py-1.5 -mx-2 ${highlight
                    ? "border border-amber-200 bg-amber-50/60 dark:border-amber-800/40 dark:bg-amber-900/15"
                    : ""
                    }`}
                >
                  <span className="text-gray-400 flex-shrink-0 max-w-[45%]">
                    {humanizePlaceholderLabel(key)}:
                  </span>
                  <span className="text-gray-800 dark:text-white/90 font-medium text-right break-words">{text}</span>
                </div>
              );
            })}

            {scheduleContextNote && flashSaleTypeMatch && flashSlotsList.length === 0 ? (
              <p className="text-[11px] text-amber-800 dark:text-amber-200/90 mt-2">
                No flash timeframe found - check if promotion has slots or refresh page.
              </p>
            ) : null}
            {scheduleContextNote && Object.keys(placeholders).some((k) => shouldHighlightScheduleRow(k, resolvedReference)) ? (
              <p className="text-[11px] text-amber-800 dark:text-amber-200/90 leading-relaxed">
                Hint: select <span className="font-medium">send time</span> within program validity; check timeframe
                “Allowed range” from server.
              </p>
            ) : null}
            {resolvedReference.defaultActionTarget ? (
              <div className="mt-1 space-y-1">
                <a
                  href={mapReferenceDefaultActionToAdminUrl(resolvedReference.defaultActionTarget)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600 font-medium"
                >
                  View Details (admin)
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Link khi khách bấm TB:{" "}
                  <span className="font-mono text-gray-700 dark:text-gray-300 break-all">
                    {resolvedReference.defaultActionTarget}
                  </span>
                </p>
              </div>
            ) : null}
          </div>
          {orderedFlashSlots.length > 0 ? (
            <div className="mt-5 pt-5 border-t border-gray-100 dark:border-white/10 w-full">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-gray-700 dark:text-gray-200">
                  Flash timeframe (VN time)
                </p>
                <button
                  type="button"
                  onClick={() => setIsSlotsExpanded(!isSlotsExpanded)}
                  className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors flex items-center gap-1.5 px-2.5 py-1 rounded bg-brand-50 dark:bg-brand-500/10 cursor-pointer select-none"
                >
                  {isSlotsExpanded ? (
                    <>
                      Hide Slots
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                      </svg>
                    </>
                  ) : (
                    <>
                      Show Slots ({orderedFlashSlots.length})
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
              {isSlotsExpanded ? (
                <div className="max-h-[400px] overflow-y-auto pr-1">
                  <ul className="space-y-2">
                    {orderedFlashSlots.map((slot) => {
                      const start = new Date(slot.startAtUtc);
                      const end = new Date(slot.endAtUtc);
                      const phase = getFlashSlotPhase(new Date(), start, end);
                      const badge =
                        phase === "live"
                          ? {
                              label: "Ongoing",
                              className:
                                "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/35 dark:text-emerald-100",
                            }
                          : phase === "upcoming"
                            ? {
                                label: "Upcoming",
                                className:
                                  "bg-sky-100 text-sky-900 dark:bg-sky-900/35 dark:text-sky-100",
                              }
                            : {
                                label: "Ended",
                                className:
                                  "bg-gray-100 text-gray-600 dark:bg-gray-800/80 dark:text-gray-400",
                              };
                      const lines = slot.productLines ?? [];
                      return (
                        <li
                          key={slot.timeSlotId}
                          className="rounded-lg border border-gray-250 dark:border-white/10 bg-gray-50 dark:bg-zinc-800/40 px-3 py-2.5 text-sm"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                            <span
                              className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                            {slot.status ? (
                              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                                {slot.status}
                              </span>
                            ) : null}
                          </div>
                          <p className="text-gray-900 dark:text-white font-semibold text-xs leading-snug break-words">
                            {formatFlashSlotRangeVi(slot.startAtUtc, slot.endAtUtc)}
                          </p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                            Slot code #{slot.timeSlotId}
                          </p>
                          {lines.length > 0 ? (
                            <details
                              className="mt-2 rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900/50 overflow-x-auto"
                              open
                            >
                              <summary className="cursor-pointer select-none px-2 py-1.5 text-[11px] font-bold text-gray-850 dark:text-white list-none [&::-webkit-details-marker]:hidden">
                                Product Details ({lines.length})
                              </summary>
                              <div className={`px-2 pb-2 ${lines.length > 4 ? "max-h-[240px] overflow-y-auto" : ""}`}>
                                <table className="w-full text-[10px] border-collapse min-w-[300px]">
                                  <thead>
                                    <tr className="border-b border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 font-semibold">
                                      <th className="py-1 pr-2 font-medium text-left align-bottom">Product</th>
                                      <th className="py-1 pr-2 font-medium text-right align-bottom whitespace-nowrap">Flash price</th>
                                      <th className="py-1 pr-2 font-medium text-right align-bottom whitespace-nowrap">%</th>
                                      <th className="py-1 pr-1 font-medium text-right align-bottom whitespace-nowrap">SL</th>
                                      <th className="py-1 pr-1 font-medium text-right align-bottom whitespace-nowrap">Sold</th>
                                      <th className="py-1 pr-1 font-medium text-right align-bottom whitespace-nowrap">Reserved</th>
                                      <th className="py-1 font-medium text-right align-bottom whitespace-nowrap">Remaining</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {lines.map((line) => {
                                      const dim = !line.isActive;
                                      return (
                                        <tr
                                          key={line.slotProductId}
                                          className="border-b border-gray-100/80 dark:border-white/[0.06] last:border-0"
                                        >
                                          <td className="py-2 pr-2 align-top text-gray-900 dark:text-white font-medium max-w-[200px]">
                                            <div>
                                              <span className="line-clamp-2 leading-snug font-semibold text-gray-950 dark:text-white">{line.productName}</span>
                                              <span className="block text-[10px] text-gray-400 font-normal mt-0.5">
                                                SP #{line.productId}
                                                {!line.isActive ? " · Paused" : ""}
                                              </span>
                                            </div>
                                          </td>
                                          <td className="py-1.5 pr-2 align-top text-right tabular-nums whitespace-nowrap">
                                            {formatVnd(line.salePrice)}
                                          </td>
                                          <td className="py-1.5 pr-2 align-top text-right tabular-nums whitespace-nowrap">
                                            {line.discountPercent != null ? `${line.discountPercent}%` : "—"}
                                          </td>
                                          <td className="py-1.5 pr-1 align-top text-right tabular-nums">{line.saleQuantity}</td>
                                          <td className="py-1.5 pr-1 align-top text-right tabular-nums">{line.soldQuantity}</td>
                                          <td className="py-1.5 pr-1 align-top text-right tabular-nums">{line.reservedQuantity}</td>
                                          <td className="py-1.5 align-top text-right tabular-nums font-medium">
                                            {flashLineRemaining(line)}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </details>
                          ) : (
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 italic">
                              Slot has no flash products.
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-gray-400">
          {referenceType} {referenceId != null ? `#${referenceId}` : ""}
        </p>
      )}
    </div>
  );
};

/** Wrapper lấy field từ Campaign đầy đủ */
export function CampaignReferenceCardFromCampaign({ campaign, ...rest }: Omit<CampaignReferenceCardProps, "campaignName" | "referenceType" | "referenceId" | "resolvedReference" | "imageUrl"> & { campaign: Campaign }) {
  return (
    <CampaignReferenceCard
      campaignName={campaign.campaignName}
      referenceType={campaign.referenceType}
      referenceId={campaign.referenceId}
      resolvedReference={campaign.resolvedReference}
      imageUrl={campaign.imageUrl}
      {...rest}
    />
  );
}
