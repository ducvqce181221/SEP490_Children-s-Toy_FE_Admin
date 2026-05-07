"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";

import { campaignApi, templateApi, referenceSearchApi, audienceApi } from "../services/campaign-api";
import {
  WizardState,
  NotificationTemplate,
  ReferenceTypeInfo,
  VoucherSearchItem,
  ProductSearchItem,
  BlogPostSearchItem,
  PromotionSearchItem,
  RoleItem,
  AccountSearchItem,
  Campaign,
} from "../types/campaign";
import { useAuthContext } from "@/context/AuthContext";
import { useCampaignImageUpload } from "../hooks/useCampaignImageUpload";
import {
  DocsIcon,
  BoxCubeIcon,
  PageIcon,
  BoltIcon,
  BellIcon,
  GroupIcon,
  GridIcon,
  UserIcon,
  PaperPlaneIcon,
  TimeIcon,
} from "@/icons";

// ─── Constants ────────────────────────────────────────────────────────────────

const REFERENCE_TYPE_CARDS = [
  { id: "VOUCHER", label: "Voucher / Discount Code", icon: <DocsIcon className="w-8 h-8" />, desc: "Notify customers about new vouchers" },
  { id: "PRODUCT", label: "New Product", icon: <BoxCubeIcon className="w-8 h-8" />, desc: "Announce newly launched products" },
  { id: "BLOG", label: "Blog Post", icon: <PageIcon className="w-8 h-8" />, desc: "Share useful blog posts with customers" },
  { id: "SALE", label: "Sale Campaign", icon: <BoltIcon className="w-8 h-8" />, desc: "Announce promotions" },
  { id: "", label: "General Notification", icon: <BellIcon className="w-8 h-8" />, desc: "Not tied to a specific product or campaign" },
];

const TARGET_MODE_CARDS = [
  { id: "ALL", label: "All Accounts", icon: <GroupIcon className="w-8 h-8" />, desc: "Send to all active accounts (excluding locked/inactive accounts)" },
  { id: "ROLE", label: "By Role", icon: <GridIcon className="w-8 h-8" />, desc: "Select a specific role (e.g., Customer, Staff)" },
  { id: "INDIVIDUAL", label: "Specific Customers", icon: <UserIcon className="w-8 h-8" />, desc: "Search and select individual customers" },
];

const EMPTY_WIZARD: WizardState = {
  campaignName: "",
  referenceType: "",
  referenceId: null,
  resolvedObject: null,
  referenceDisplayName: "",
  templateCode: "",
  selectedTemplate: null,
  useCustomContent: false,
  titleOverride: "",
  messageOverride: "",
  imageUrl: "",
  imageFile: null,
  imagePreviewUrl: "",
  targetMode: "ALL",
  selectedRoleId: "",
  individualAccountIds: [],
  individualAccountNames: [],
  scheduleType: "immediate",
  scheduledAt: "",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderTemplate(template: string, placeholders: Record<string, string>): string {
  let result = template;
  for (const [token, value] of Object.entries(placeholders)) {
    result = result.split(token).join(value);
  }
  return result;
}

function getPreviewTitle(state: WizardState): string {
  if (state.useCustomContent && state.titleOverride) return state.titleOverride;
  if (state.selectedTemplate) {
    return renderTemplate(
      state.selectedTemplate.titleTemplate,
      state.resolvedObject?.placeholders ?? {}
    );
  }
  return "Notification title";
}

function getPreviewMessage(state: WizardState): string {
  if (state.useCustomContent && state.messageOverride) return state.messageOverride;
  if (state.selectedTemplate) {
    return renderTemplate(
      state.selectedTemplate.messageTemplate,
      state.resolvedObject?.placeholders ?? {}
    );
  }
  return "Notification content will appear here...";
}

// ─── Phone Notification Mockup ────────────────────────────────────────────────
const DesktopPreview: React.FC<{ title: string; message: string; imageUrl?: string }> = ({
  title, message, imageUrl,
}) => (
  <div className="mx-auto w-full max-w-[350px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden shadow-md">
    <div className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 flex items-center gap-1.5 border-b border-zinc-200 dark:border-zinc-700">
      <div className="w-3.5 h-3.5 rounded-[3px] bg-brand-500 flex items-center justify-center flex-shrink-0">
        <span className="text-white text-[8px] font-medium">T</span>
      </div>
      <span className="text-[11px] text-zinc-500 flex-1 truncate">Toy Store</span>
      <span className="text-[10px] text-zinc-400 flex-shrink-0">now</span>
      <span className="text-[11px] text-zinc-400 ml-1 cursor-pointer flex-shrink-0">✕</span>
    </div>
    <div className="p-3 flex gap-2.5 items-start">
      <img
        src={imageUrl || "/images/logo/logo-icon.svg"}
        alt=""
        className="w-9 h-9 rounded-lg object-cover flex-shrink-0 bg-white"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = "/images/logo/logo-icon.svg";
        }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-zinc-900 dark:text-zinc-100 break-words">
          {title || "Notification title"}
        </p>
        <p className="text-[11px] text-zinc-500 mt-1 leading-snug whitespace-pre-wrap break-words">
          {message || "Notification content will appear here..."}
        </p>
      </div>
    </div>
  </div>
);

// ─── Step Progress Bar ────────────────────────────────────────────────────────

const STEP_LABELS = ["Subject", "Content", "Audience & Schedule"];

const WizardProgress: React.FC<{ currentStep: number }> = ({ currentStep }) => (
  <div className="flex items-center gap-0 mb-8">
    {STEP_LABELS.map((label, i) => {
      const step = i + 1;
      const active = step === currentStep;
      const done = step < currentStep;
      return (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all ${done
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
              className={`text-xs mt-1.5 font-medium ${active ? "text-brand-600" : done ? "text-brand-500" : "text-gray-400"
                }`}
            >
              {label}
            </span>
          </div>
          {i < STEP_LABELS.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-2 mb-5 rounded-full transition-all ${done ? "bg-brand-500" : "bg-gray-200"
                }`}
            />
          )}
        </React.Fragment>
      );
    })}
  </div>
);


// ─── Search Dropdown ──────────────────────────────────────────────────────────

interface SearchItem { id: number; label: string; subtitle?: string }

const SearchDropdown: React.FC<{
  placeholder: string;
  items: SearchItem[];
  loading: boolean;
  onSearch: (term: string) => void;
  onSelect: (item: SearchItem) => void;
  selectedLabel?: string;
}> = ({ placeholder, items, loading, onSearch, onSelect, selectedLabel }) => {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState(selectedLabel || "");
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTerm(selectedLabel || "");
  }, [selectedLabel]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleChange = (value: string) => {
    setTerm(value);
    setOpen(true);
    if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearch(value), 350);
  };

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={term}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => { setOpen(true); onSearch(term); }}
          placeholder={placeholder}
          className="w-full h-11 pl-9 pr-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm text-gray-800 dark:text-white/90 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300"
        />
        {loading && (
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
      </div>
      {open && (
        <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-52 overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-400 text-center">
              {loading ? "Searching..." : "No results found"}
            </div>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => { onSelect(item); setTerm(item.label); setOpen(false); }}
                className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="block text-sm font-medium text-gray-800 dark:text-white/90">{item.label}</span>
                {item.subtitle && <span className="block text-xs text-gray-400 mt-0.5">{item.subtitle}</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ─── Step 1: Campaign Subject ─────────────────────────────────────────────────

const Step1: React.FC<{
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
  errors: Record<string, string>;
  referenceTypes: ReferenceTypeInfo[];
}> = ({ state, update, errors, referenceTypes }) => {
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = useCallback(async (term: string) => {
    if (!state.referenceType) return;
    setSearching(true);
    try {
      let items: SearchItem[] = [];
      if (state.referenceType === "VOUCHER") {
        const res = await referenceSearchApi.searchVouchers(term);
        items = res.map((v: VoucherSearchItem) => ({
          id: v.voucherId,
          label: v.voucherName || v.voucherCode,
          subtitle: `Code: ${v.voucherCode} · Discount: ${v.discountValue}${v.discountType === "PERCENT" ? "%" : " VND"} · Expires: ${new Date(v.endDate).toLocaleDateString("en-US")}`,
        }));
      } else if (state.referenceType === "PRODUCT") {
        const res = await referenceSearchApi.searchProducts(term);
        items = res.map((p: ProductSearchItem) => ({
          id: p.productId,
          label: p.productName,
          subtitle: `Price: ${p.price.toLocaleString("en-US")} VND`,
        }));
      } else if (state.referenceType === "BLOG") {
        const res = await referenceSearchApi.searchBlogPosts(term);
        items = res.map((b: BlogPostSearchItem) => ({
          id: b.blogPostId,
          label: b.blogTitle,
          subtitle: b.blogAt ? new Date(b.blogAt).toLocaleDateString("en-US") : undefined,
        }));
      } else if (state.referenceType === "SALE") {
        const res = await referenceSearchApi.searchPromotions(term);
        items = res.map((s: PromotionSearchItem) => ({
          id: s.promotionId,
          label: s.promotionName,
          subtitle: `${new Date(s.startDate).toLocaleDateString("en-US")} - ${new Date(s.endDate).toLocaleDateString("en-US")}`,
        }));
      }
      setSearchResults(items);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [state.referenceType]);

  const handleSelectRef = async (item: SearchItem) => {
    update({ referenceId: item.id, referenceDisplayName: item.label });
    // Fetch resolved reference from campaign details (use preview from search result for now)
    update({
      resolvedObject: {
        displayName: item.label,
        placeholders: {},
        defaultActionTarget: null,
      },
    });
  };

  return (
    <div className="space-y-7">
      {/* Campaign Name */}
      <div>
        <Label>
          Campaign name <span className="text-red-500">*</span>
        </Label>
        <Input
          type="text"
          placeholder="e.g. Birthday voucher announcement in June"
          maxLength={255}
          value={state.campaignName}
          onChange={(e) => update({ campaignName: e.target.value })}
          error={!!errors.campaignName}
          hint={errors.campaignName}
        />
      </div>

      {/* Reference Type Cards */}
      <div>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          What is this campaign about?
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {REFERENCE_TYPE_CARDS.map((card) => {
            const selected = state.referenceType === card.id;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() =>
                  update({
                    referenceType: card.id,
                    referenceId: null,
                    referenceDisplayName: "",
                    resolvedObject: null,
                  })
                }
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all ${selected
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-900/50"
                  }`}
              >
                <span className="text-2xl">{card.icon}</span>
                <span
                  className={`text-xs font-semibold leading-tight ${selected ? "text-brand-600 dark:text-brand-400" : "text-gray-700 dark:text-gray-300"
                    }`}
                >
                  {card.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Object Search (when a type other than general is selected) */}
      {state.referenceType && (
        <div className="p-5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            {state.referenceType === "VOUCHER" && "Select the voucher to announce:"}
            {state.referenceType === "PRODUCT" && "Select the product to announce:"}
            {state.referenceType === "BLOG" && "Select the blog post to share:"}
            {state.referenceType === "SALE" && "Select the promotion:"}
          </p>
          <SearchDropdown
            placeholder={
              state.referenceType === "VOUCHER"
                ? "Search by voucher name or code..."
                : state.referenceType === "PRODUCT"
                  ? "Search by product name..."
                  : state.referenceType === "BLOG"
                    ? "Search by blog title..."
                    : "Search by promotion name..."
            }
            items={searchResults}
            loading={searching}
            onSearch={handleSearch}
            onSelect={handleSelectRef}
            selectedLabel={state.referenceDisplayName || undefined}
          />
          {errors.referenceId && (
            <p className="text-xs text-red-500 mt-1.5">{errors.referenceId}</p>
          )}

          {/* Preview card for selected object */}
          {state.referenceId && state.referenceDisplayName && (
            <div className="mt-3 flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg border border-brand-200 dark:border-brand-800">
              <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-xl flex-shrink-0">
                {REFERENCE_TYPE_CARDS.find((c) => c.id === state.referenceType)?.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-white/90 truncate">
                  {state.referenceDisplayName}
                </p>
                <p className="text-xs text-brand-500 mt-0.5">Selected ✓</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  update({ referenceId: null, referenceDisplayName: "", resolvedObject: null })
                }
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Step 2: Notification Content ────────────────────────────────────────────

const Step2: React.FC<{
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
  errors: Record<string, string>;
  templates: NotificationTemplate[];
  isUploading: boolean;
  onSelectImage: (file: File) => void;
  onImageUrlChange: (value: string) => void;
  onClearImage: () => void;
}> = ({ state, update, errors, templates, isUploading, onSelectImage, onImageUrlChange, onClearImage }) => {
  const previewTitle = getPreviewTitle(state);
  const previewMessage = getPreviewMessage(state);
  const previewImageUrl = state.imagePreviewUrl || state.imageUrl || undefined;

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    onSelectImage(file);
    event.target.value = "";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* Left: Form */}
      <div className="space-y-5">
        {/* Template selector */}
        <div>
          <Label>Choose a notification template</Label>
          <select
            value={state.templateCode}
            onChange={(e) => {
              const code = e.target.value;
              const tpl = templates.find((t) => t.templateCode === code) || null;
              update({ templateCode: code, selectedTemplate: tpl });
            }}
            className="h-11 w-full appearance-none rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white/90 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300"
          >
            <option value="">-- Write custom content --</option>
            {templates.map((t) => (
              <option key={t.templateCode} value={t.templateCode}>
                {t.titleTemplate}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1.5">
            Choose a template to save time
          </p>
        </div>

        {/* Custom content toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Customize content
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Write a custom title and message
            </p>
          </div>
          <button
            type="button"
            onClick={() => update({ useCustomContent: !state.useCustomContent })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${state.useCustomContent
              ? "bg-brand-500"
              : "bg-gray-300 dark:bg-gray-600"
              }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${state.useCustomContent ? "translate-x-6" : "translate-x-1"
                }`}
            />
          </button>
        </div>

        {/* Custom fields */}
        {state.useCustomContent && (
          <div className="space-y-4 p-4 rounded-xl border border-brand-200 dark:border-brand-800 bg-brand-50/50 dark:bg-brand-500/5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Notification title</Label>
                <span className="text-xs text-gray-400">{state.titleOverride.length}/255</span>
              </div>
              <Input
                type="text"
                placeholder="e.g. 🎉 A birthday voucher just for you!"
                maxLength={255}
                value={state.titleOverride}
                onChange={(e) => update({ titleOverride: e.target.value })}
                error={!!errors.titleOverride}
                hint={errors.titleOverride}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Notification message</Label>
                <span className="text-xs text-gray-400">{state.messageOverride.length}/500</span>
              </div>
              <TextArea
                placeholder="e.g. Happy birthday! Use code BDAY25 for 25% off..."
                rows={4}
                maxLength={500}
                value={state.messageOverride}
                onChange={(e) => update({ messageOverride: e.target.value })}
                error={!!errors.messageOverride}
                hint={errors.messageOverride}
              />
            </div>
          </div>
        )}

        {/* Image Upload Area */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Image (optional)</Label>
            {state.imageFile && (
              <span className="text-xs font-medium px-2 py-1 bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300 rounded-md">
                Selected: {state.imageFile.name}
              </span>
            )}
          </div>

          <div className="relative group rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-brand-500 dark:hover:border-brand-400 transition-all bg-gray-50/50 dark:bg-gray-800/30 overflow-hidden">
            {state.imagePreviewUrl || state.imageUrl ? (
              <div className="relative aspect-video w-full bg-black/5 dark:bg-black/20 flex items-center justify-center">
                <img
                  src={state.imagePreviewUrl || state.imageUrl || ""}
                  alt="Campaign preview"
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                  <label
                    htmlFor="campaign-image-upload"
                    className="p-2.5 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors cursor-pointer"
                    title="Change Image"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </label>
                  <button
                    type="button"
                    onClick={onClearImage}
                    className="p-2.5 rounded-full bg-red-500/80 text-white hover:bg-red-500 transition-colors"
                    title="Remove Image"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <label htmlFor="campaign-image-upload" className="flex flex-col items-center justify-center py-10 px-6 cursor-pointer hover:bg-brand-50/50 dark:hover:bg-brand-500/5 transition-colors">
                <div className="w-14 h-14 mb-4 rounded-full bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-brand-500 ring-4 ring-white dark:ring-gray-900 shadow-sm">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
                  Click to upload image
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center max-w-xs">
                  SVG, PNG, JPG or WEBP (max 5MB)
                </p>
              </label>
            )}
            <input
              id="campaign-image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              disabled={isUploading}
              onChange={handleImageFileChange}
            />
          </div>

          {isUploading && (
            <div className="flex items-center justify-center gap-2 py-2 text-sm text-brand-600 dark:text-brand-400 font-medium">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Uploading image...
            </div>
          )}

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
            <span className="flex-shrink-0 mx-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Or provide URL</span>
            <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
          </div>

          <Input
            type="text"
            placeholder="https://example.com/banner.jpg"
            maxLength={500}
            value={state.imageUrl}
            onChange={(e) => onImageUrlChange(e.target.value)}
            error={!!errors.imageUrl}
            hint={errors.imageUrl || "Paste an image URL if you don't want to upload a file"}
          />
        </div>
      </div>

      {/* Right: Preview */}
      <div className="space-y-4 lg:sticky lg:top-6">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 text-center">
          Notification preview
        </p>
        <div className="max-h-[70vh] overflow-y-auto custom-scrollbar pr-1">
          <DesktopPreview
            title={previewTitle}
            message={previewMessage}
            imageUrl={previewImageUrl}
          />
        </div>
        {state.templateCode && (
          <p className="text-xs text-center text-gray-400">
            Using template:{" "}
            <span className="font-medium text-gray-600 dark:text-gray-300">
              {templates.find((t) => t.templateCode === state.templateCode)?.titleTemplate}
            </span>
          </p>
        )}
      </div>
    </div>
  );
};

// ─── Step 3: Audience & Schedule ──────────────────────────────────────────────

const Step3: React.FC<{
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
  errors: Record<string, string>;
  roles: RoleItem[];
}> = ({ state, update, errors, roles }) => {
  const [accountSearch, setAccountSearch] = useState("");
  const [accountResults, setAccountResults] = useState<AccountSearchItem[]>([]);
  const [accountSearching, setAccountSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAccountSearch = useCallback(async (term: string) => {
    if (!term || term.length < 2) { setAccountResults([]); return; }
    setAccountSearching(true);
    try {
      const res = await audienceApi.searchAccounts(term);
      setAccountResults(res.filter((a) => !state.individualAccountIds.includes(a.accountId)));
    } catch {
      setAccountResults([]);
    } finally {
      setAccountSearching(false);
    }
  }, [state.individualAccountIds]);

  const handleAccountInput = (value: string) => {
    setAccountSearch(value);
    if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => handleAccountSearch(value), 350);
  };

  const addAccount = (account: AccountSearchItem) => {
    if (!state.individualAccountIds.includes(account.accountId)) {
      update({
        individualAccountIds: [...state.individualAccountIds, account.accountId],
        individualAccountNames: [...state.individualAccountNames, `${account.accountName} (${account.email})`],
      });
    }
    setAccountSearch("");
    setAccountResults([]);
  };

  const removeAccount = (index: number) => {
    update({
      individualAccountIds: state.individualAccountIds.filter((_, i) => i !== index),
      individualAccountNames: state.individualAccountNames.filter((_, i) => i !== index),
    });
  };

  // Min date for scheduler
  const minDate = new Date(Date.now() + 60_000).toISOString().slice(0, 16);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left: Targeting + Schedule (2/3) */}
      <div className="lg:col-span-2 space-y-7">
        {/* Audience Cards */}
        <div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Who should receive it?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TARGET_MODE_CARDS.map((card) => {
              const selected = state.targetMode === card.id;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() =>
                    update({
                      targetMode: card.id as WizardState["targetMode"],
                      selectedRoleId: "",
                      individualAccountIds: [],
                      individualAccountNames: [],
                    })
                  }
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${selected
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 bg-white dark:bg-gray-900/50"
                    }`}
                >
                  <span className="text-2xl flex-shrink-0">{card.icon}</span>
                  <div>
                    <p className={`text-sm font-semibold ${selected ? "text-brand-600 dark:text-brand-400" : "text-gray-800 dark:text-white/90"}`}>
                      {card.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {card.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          {errors.targeting && <p className="text-xs text-red-500 mt-1.5">{errors.targeting}</p>}
        </div>

        {/* Dynamic targeting input */}
        {state.targetMode === "ROLE" && (
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
            <Label>Select a user role</Label>
            <select
              value={state.selectedRoleId}
              onChange={(e) => update({ selectedRoleId: e.target.value })}
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white/90 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">-- Select role --</option>
              {roles.map((r) => (
                <option key={r.roleId} value={String(r.roleId)}>
                  {r.roleName}
                </option>
              ))}
            </select>
            {errors.selectedRoleId && <p className="text-xs text-red-500 mt-1">{errors.selectedRoleId}</p>}
          </div>
        )}

        {state.targetMode === "INDIVIDUAL" && (
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 space-y-3">
            <Label>Search and add customers</Label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={accountSearch}
                onChange={(e) => handleAccountInput(e.target.value)}
                placeholder="Search by customer name or email..."
                className="w-full h-11 pl-9 pr-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-white/90 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
              {accountSearching && (
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
            </div>
            {accountResults.length > 0 && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                {accountResults.map((a) => (
                  <button key={a.accountId} type="button" onClick={() => addAccount(a)}
                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center text-xs font-semibold text-brand-600 flex-shrink-0">
                      {a.accountName[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">{a.accountName}</p>
                      <p className="text-xs text-gray-400">{a.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {state.individualAccountNames.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {state.individualAccountNames.map((name, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 text-xs font-medium">
                    {name}
                    <button type="button" onClick={() => removeAccount(i)} className="text-brand-400 hover:text-brand-700">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
            {errors.targeting && <p className="text-xs text-red-500">{errors.targeting}</p>}
          </div>
        )}


        {/* Schedule */}
        <div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            When to send?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { id: "immediate", label: "Send immediately", icon: <PaperPlaneIcon className="w-8 h-8" />, desc: "Notification will be sent immediately" },
              { id: "scheduled", label: "Schedule send", icon: <TimeIcon className="w-8 h-8" />, desc: "Choose a specific date and time" },
            ].map((card) => {
              const selected = state.scheduleType === card.id;
              return (
                <button key={card.id} type="button"
                  onClick={() => update({ scheduleType: card.id as WizardState["scheduleType"], scheduledAt: "" })}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${selected ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 bg-white dark:bg-gray-900/50"
                    }`}
                >
                  <span className="text-2xl flex-shrink-0">{card.icon}</span>
                  <div>
                    <p className={`text-sm font-semibold ${selected ? "text-brand-600 dark:text-brand-400" : "text-gray-800 dark:text-white/90"}`}>{card.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{card.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {state.scheduleType === "scheduled" && (
            <div className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <Label>Send time</Label>
              <Input
                type="datetime-local"
                min={minDate}
                value={state.scheduledAt}
                onChange={(e) => update({ scheduledAt: e.target.value })}
                error={!!errors.scheduledAt}
                hint={errors.scheduledAt}
              />
            </div>
          )}
        </div>
      </div>

      {/* Right: Summary sidebar (1/3) */}
      <div className="lg:col-span-1">
        <div className="sticky top-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-5">
          <h3 className="text-sm font-bold text-gray-800 dark:text-white/90 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-brand-100 dark:bg-brand-500/20 rounded-full flex items-center justify-center text-brand-600 dark:text-brand-400 text-xs font-bold">✓</span>
            Campaign summary
          </h3>
          <ul className="space-y-3">
            <SummaryRow label="Campaign name" value={state.campaignName || "Not set yet"} empty={!state.campaignName} />
            <SummaryRow
              label="Reference"
              value={REFERENCE_TYPE_CARDS.find((c) => c.id === state.referenceType)?.label || "General notification"}
            />
            {state.referenceDisplayName && (
              <SummaryRow label="Linked to" value={state.referenceDisplayName} />
            )}
            <SummaryRow
              label="Content"
              value={
                state.selectedTemplate
                  ? `Template: ${state.selectedTemplate.titleTemplate}`
                  : state.useCustomContent && state.titleOverride
                    ? state.titleOverride
                    : "No template selected"
              }
              empty={!state.selectedTemplate && !(state.useCustomContent && state.titleOverride)}
            />
            <SummaryRow label="Audience" value={TARGET_MODE_CARDS.find((c) => c.id === state.targetMode)?.label || ""} />
            <SummaryRow
              label="Schedule"
              value={
                state.scheduleType === "immediate"
                  ? "Send immediately"
                  : state.scheduledAt
                    ? new Date(state.scheduledAt).toLocaleString("en-US")
                    : "Not scheduled"
              }
              empty={state.scheduleType === "scheduled" && !state.scheduledAt}
            />
          </ul>
        </div>
      </div>
    </div>
  );
};

const SummaryRow: React.FC<{ label: string; value: string; empty?: boolean }> = ({
  label,
  value,
  empty,
}) => (
  <li className="flex flex-col gap-0.5">
    <span className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">{label}</span>
    <span className={`text-sm font-medium ${empty ? "text-gray-300 dark:text-gray-600 italic" : "text-gray-800 dark:text-white/90"}`}>
      {value}
    </span>
  </li>
);

// ─── Main Wizard Component ────────────────────────────────────────────────────

interface CampaignWizardProps {
  campaignId?: number;
}

export const CampaignWizard: React.FC<CampaignWizardProps> = ({ campaignId }) => {
  const router = useRouter();
  const { account } = useAuthContext();
  const isEditing = !!campaignId;

  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>(EMPTY_WIZARD);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [referenceTypes, setReferenceTypes] = useState<ReferenceTypeInfo[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCampaign, setIsLoadingCampaign] = useState(false);
  const { uploadImage, isUploading } = useCampaignImageUpload();

  const handleImageFileSelect = useCallback((file: File) => {
    setState((prev) => {
      if (prev.imagePreviewUrl) {
        URL.revokeObjectURL(prev.imagePreviewUrl);
      }
      return {
        ...prev,
        imageFile: file,
        imagePreviewUrl: URL.createObjectURL(file),
      };
    });
  }, []);

  const handleImageUrlChange = useCallback((value: string) => {
    setState((prev) => {
      if (prev.imagePreviewUrl) {
        URL.revokeObjectURL(prev.imagePreviewUrl);
      }
      return {
        ...prev,
        imageUrl: value,
        imageFile: null,
        imagePreviewUrl: "",
      };
    });
  }, []);

  const handleClearImage = useCallback(() => {
    setState((prev) => {
      if (prev.imagePreviewUrl) {
        URL.revokeObjectURL(prev.imagePreviewUrl);
      }
      return {
        ...prev,
        imageUrl: "",
        imageFile: null,
        imagePreviewUrl: "",
      };
    });
  }, []);

  const update = useCallback((patch: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  // Load templates, roles, reference types on mount
  useEffect(() => {
    templateApi.getActiveTemplates().then(setTemplates).catch(() => { });
    audienceApi.getRoles().then(setRoles).catch(() => { });
    campaignApi.getReferenceTypes().then(setReferenceTypes).catch(() => { });
  }, []);

  // Load existing campaign for edit mode
  useEffect(() => {
    if (!isEditing || !campaignId) return;
    setIsLoadingCampaign(true);
    campaignApi.getCampaignById(campaignId).then((c: Campaign) => {
      setState({
        campaignName: c.campaignName,
        referenceType: c.referenceType || "",
        referenceId: c.referenceId || null,
        resolvedObject: c.resolvedReference || null,
        referenceDisplayName: c.resolvedReference?.displayName || "",
        templateCode: c.templateCode || "",
        selectedTemplate: null,
        useCustomContent: !!(c.titleOverride || c.messageOverride),
        titleOverride: c.titleOverride || "",
        messageOverride: c.messageOverride || "",
        imageUrl: c.imageUrl || "",
        imageFile: null,
        imagePreviewUrl: "",
        targetMode: (c.targetType as WizardState["targetMode"]) || "ALL",
        selectedRoleId: c.targets.find((t) => t.targetType === "ROLE_ID")?.targetValue || "",
        individualAccountIds: c.targets.filter((t) => t.targetType === "ACCOUNT_ID").map((t) => Number(t.targetValue)),
        individualAccountNames: c.targets.filter((t) => t.targetType === "ACCOUNT_ID").map((t) => t.targetValue),
        scheduleType: c.scheduledAt ? "scheduled" : "immediate",
        scheduledAt: c.scheduledAt ? new Date(c.scheduledAt).toISOString().slice(0, 16) : "",
      });
    }).catch(() => {
      toast.error("Failed to load campaign info");
      router.push("/admin/campaigns");
    }).finally(() => setIsLoadingCampaign(false));
  }, [campaignId, isEditing, router]);

  // Once templates are loaded, find the selected template
  useEffect(() => {
    if (!templates.length || !state.templateCode) return;
    const tpl = templates.find((t) => t.templateCode === state.templateCode);
    if (tpl) setState((prev) => ({ ...prev, selectedTemplate: tpl }));
  }, [templates, state.templateCode]);

  const validateStep = (): boolean => {
    const errs: Record<string, string> = {};
    if (step === 1) {
      if (!state.campaignName.trim()) errs.campaignName = "Please name the campaign";
      if (state.referenceType && !state.referenceId) errs.referenceId = "Please select a specific reference";
    }
    if (step === 2) {
      if (state.imageUrl && !/^https?:\/\/.+/.test(state.imageUrl) && !state.imageFile)
        errs.imageUrl = "Invalid image URL (must start with https://)";
      if (state.useCustomContent && state.titleOverride && state.titleOverride.length > 255)
        errs.titleOverride = "Title must not exceed 255 characters";
      if (state.useCustomContent && state.messageOverride && state.messageOverride.length > 500)
        errs.messageOverride = "Message must not exceed 500 characters";
    }
    if (step === 3) {
      if (state.targetMode === "ROLE" && !state.selectedRoleId) errs.selectedRoleId = "Please select a user role";
      if (state.targetMode === "INDIVIDUAL" && state.individualAccountIds.length === 0)
        errs.targeting = "Please add at least one customer";
      if (state.scheduleType === "scheduled" && !state.scheduledAt)
        errs.scheduledAt = "Please select a scheduled time";
      if (state.scheduleType === "scheduled" && state.scheduledAt && new Date(state.scheduledAt) <= new Date())
        errs.scheduledAt = "Scheduled time must be in the future";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep((s) => s + 1);
  };

  const buildPayload = () => {
    const targets: { targetType: string; targetValue: string }[] = [];
    if (state.targetMode === "ROLE" && state.selectedRoleId) {
      targets.push({ targetType: "ROLE_ID", targetValue: state.selectedRoleId });
    } else if (state.targetMode === "INDIVIDUAL") {
      state.individualAccountIds.forEach((id) =>
        targets.push({ targetType: "ACCOUNT_ID", targetValue: String(id) })
      );
    }

    return {
      campaignName: state.campaignName.trim(),
      templateCode: state.templateCode || null,
      referenceType: state.referenceType || null,
      referenceId: state.referenceId || null,
      titleOverride: state.useCustomContent && state.titleOverride ? state.titleOverride : null,
      messageOverride: state.useCustomContent && state.messageOverride ? state.messageOverride : null,
      sourceType: "ADMIN" as const,
      targetType: state.targetMode,
      scheduledAt: state.scheduleType === "scheduled" && state.scheduledAt ? new Date(state.scheduledAt).toISOString() : null,
      imageUrl: state.imageUrl || null,
      actionType: null,
      actionTarget: null,
      createdByAccountId: account?.accountId ?? 0,
      targets,
    };
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setIsSubmitting(true);
    try {
      let uploadedImageUrl = state.imageUrl || null;
      if (state.imageFile) {
        const url = await uploadImage(state.imageFile);
        if (!url) return;
        uploadedImageUrl = url;
      }

      const payload = {
        ...buildPayload(),
        imageUrl: uploadedImageUrl,
      };
      if (isEditing && campaignId) {
        await campaignApi.updateCampaign(campaignId, payload);
        toast.success("Campaign updated successfully!");
        router.push(`/admin/campaigns/${campaignId}`);
      } else {
        const created = await campaignApi.createCampaign(payload);
        toast.success("Campaign created successfully!");
        router.push(`/admin/campaigns/${created.campaignId}`);
      }
    } catch {
      toast.error(isEditing ? "Failed to update campaign. Please try again." : "Failed to create campaign. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingCampaign) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <svg className="w-10 h-10 animate-spin text-brand-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-gray-500">Đang tải thông tin chiến dịch...</p>
        </div>
      </div>
    );
  }

  const stepTitles = [
    "Chiến dịch này về cái gì?",
    "Nội dung thông báo",
    "Gửi cho ai và khi nào?",
  ];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Progress */}
      <WizardProgress currentStep={step} />

      {/* Step card */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/[0.05] bg-white dark:bg-white/[0.03] p-6 lg:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
            Step {step}: {stepTitles[step - 1]}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {step === 1 && "Name your campaign and choose content type"}
            {step === 2 && "Design the notification content to send to customers"}
            {step === 3 && "Determine recipients and send time"}
          </p>
        </div>

        {step === 1 && (
          <Step1 state={state} update={update} errors={errors} referenceTypes={referenceTypes} />
        )}
        {step === 2 && (
          <Step2
            state={state}
            update={update}
            errors={errors}
            templates={templates}
            isUploading={isUploading}
            onSelectImage={handleImageFileSelect}
            onImageUrlChange={handleImageUrlChange}
            onClearImage={handleClearImage}
          />
        )}
        {step === 3 && (
          <Step3 state={state} update={update} errors={errors} roles={roles} />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6 gap-3">
        <div>
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/admin/campaigns")}
            className="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Tiếp theo
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              {isSubmitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </>
              ) : isEditing ? (
                "Update campaign"
              ) : (
                "Create campaign"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
