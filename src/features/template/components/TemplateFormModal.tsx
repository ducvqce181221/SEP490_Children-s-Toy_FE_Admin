import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import { TemplateFormData } from "../types/template";
import { TemplateFormSchema } from "../types/template.schema";
import { Template } from "../types/template";
import toast from "react-hot-toast";

export type TemplateModalMode = "create" | "edit" | "detail";

interface TemplateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: TemplateFormData) => void;
  templateData?: Template | null;
  mode?: TemplateModalMode;
  isSubmitting?: boolean;
}

const defaultValues: TemplateFormData = {
  templateCode: "",
  titleTemplate: "",
  messageTemplate: "",
  isActive: true,
};

const PLACEHOLDER_GROUPS = [
  {
    title: "Thông tin khách hàng",
    items: ["{{CustomerName}}", "{{StoreName}}"],
  },
  {
    title: "Thông tin đơn hàng",
    items: ["{{OrderCode}}", "{{ProductName}}"],
  },
  {
    title: "Thông tin Voucher",
    items: ["{{DiscountValue}}", "{{ExpiryDate}}"],
  },
];

function highlightPlaceholders(text: string) {
  if (!text) return text;
  const parts = text.split(/(\{\{[^}]+\}\})/g);
  return parts.map((part, index) =>
    part.match(/\{\{[^}]+\}\}/) ? (
      <span
        key={index}
        className="bg-brand-50 text-brand-600 font-bold px-1 rounded border border-brand-100 mx-0.5"
      >
        {part}
      </span>
    ) : (
      part
    )
  );
}

export const TemplateFormModal: React.FC<TemplateFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  templateData,
  mode = "create",
  isSubmitting = false,
}) => {
  const [isMounted, setIsMounted] = useState(false);

  // State để quản lý việc mở/đóng danh sách drop list của từng nhóm
  const [expandedGroup, setExpandedGroup] = useState<string | null>(PLACEHOLDER_GROUPS[0].title);

  const isEditMode = mode === "edit";
  const isDetailMode = mode === "detail";
  const isReadOnly = isDetailMode;

  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch: watchForm,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<TemplateFormData>({
    resolver: zodResolver(TemplateFormSchema),
    defaultValues,
    mode: "onTouched",
  });

  const { ref: registerRef, ...messageRegister } = register("messageTemplate");

  const watchedTitle = watchForm("titleTemplate");
  const watchedMessage = watchForm("messageTemplate");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    if ((isEditMode || isDetailMode) && templateData) {
      reset({
        templateCode: templateData.templateCode,
        titleTemplate: templateData.titleTemplate,
        messageTemplate: templateData.messageTemplate,
        isActive: templateData.isActive,
      });
    } else {
      reset(defaultValues);
    }
  }, [isOpen, templateData, isEditMode, isDetailMode, reset]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const onFormSubmit = (data: TemplateFormData) => {
    if (isReadOnly) return;
    onSave?.(data);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(watchedMessage);
    toast.success("Copied to clipboard");
  };

  const insertPlaceholder = (placeholder: string) => {
    if (isReadOnly) return;
    const current = getValues("messageTemplate") || "";
    const ta = textAreaRef.current;

    if (ta) {
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const next = current.substring(0, start) + placeholder + current.substring(end);
      setValue("messageTemplate", next, { shouldValidate: true, shouldDirty: true });
      setTimeout(() => {
        ta.focus();
        ta.setSelectionRange(start + placeholder.length, start + placeholder.length);
      }, 0);
    } else {
      setValue("messageTemplate", current + placeholder, { shouldValidate: true, shouldDirty: true });
    }
  };

  if (!isMounted) return null;

  const title = isDetailMode ? "Template Details" : isEditMode ? "Edit Template" : "Add New Template";

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[1250px] p-0 overflow-hidden">
      <div className="grid grid-cols-12 min-h-[350px]">

        {/* ── Left: Form ── */}
        <div className="col-span-12 lg:col-span-7 p-8 flex flex-col border-r border-gray-100 dark:border-gray-800">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90 mb-1">
              {title}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isDetailMode
                ? "Review template details and structure."
                : "Craft your message template with dynamic placeholders."}
            </p>
          </div>

          <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col gap-5 flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <Label className="flex justify-between items-center w-full">
                  <span>Template Code <span className="text-error-500">*</span></span>
                  <span className="text-[10px] text-gray-400 font-normal">
                    {(watchForm("templateCode") || "").length}/50
                  </span>
                </Label>
                <Input
                  type="text"
                  placeholder="e.g. WELCOME_MAIL"
                  maxLength={50}
                  error={!!errors.templateCode}
                  hint={errors.templateCode?.message}
                  disabled={isReadOnly}
                  {...register("templateCode", {
                    onChange: (e) => {
                      e.target.value = e.target.value.toUpperCase();
                    },
                  })}
                />
              </div>
              <div>
                <Label className="flex justify-between items-center w-full">
                  <span>Title Template <span className="text-error-500">*</span></span>
                  <span className="text-[10px] text-gray-400 font-normal">
                    {(watchedTitle || "").length}/255
                  </span>
                </Label>
                <Input
                  type="text"
                  placeholder="e.g. Welcome to ToyStore!"
                  maxLength={255}
                  error={!!errors.titleTemplate}
                  hint={errors.titleTemplate?.message}
                  disabled={isReadOnly}
                  {...register("titleTemplate")}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label className="mb-0 flex items-center gap-2">
                  <span>Message Content <span className="text-error-500">*</span></span>
                  <span className="text-[10px] text-gray-400 font-normal mt-0.5">
                    {(watchedMessage || "").length}/500
                  </span>
                </Label>
                {!isReadOnly && (
                  <span className="text-[10px] text-gray-400 uppercase font-semibold tracking-widest">
                    Click a tag to insert
                  </span>
                )}
              </div>

              {/* ── Accordion Drop List cho Tags ── */}
              {!isReadOnly && (
                <div className="flex flex-col gap-1.5 p-2 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 max-h-40 overflow-y-auto">
                  {PLACEHOLDER_GROUPS.map((group) => {
                    const isOpen = expandedGroup === group.title;
                    return (
                      <div
                        key={group.title}
                        className={`flex flex-col bg-white dark:bg-gray-800 rounded-lg border transition-colors ${isOpen ? "border-brand-200 dark:border-brand-500/30 shadow-sm" : "border-gray-100 dark:border-gray-700"
                          }`}
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedGroup(isOpen ? null : group.title)}
                          className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <span>{group.title}</span>
                          <svg
                            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180 text-brand-500" : ""}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {isOpen && (
                          <div className="px-3 pb-3 pt-1 flex flex-wrap gap-2 border-t border-gray-50 dark:border-gray-700/50">
                            {group.items.map((p) => (
                              <button
                                key={p}
                                type="button"
                                disabled={isReadOnly}
                                onClick={() => insertPlaceholder(p)}
                                className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-brand-50 dark:bg-gray-700 border border-brand-100 dark:border-gray-600 text-brand-600 dark:text-brand-400 hover:bg-brand-100 hover:border-brand-200 hover:text-brand-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <TextArea
                placeholder="Write your message here..."
                rows={isReadOnly ? 10 : 4}
                maxLength={500}
                error={!!errors.messageTemplate}
                hint={errors.messageTemplate?.message}
                readOnly={isReadOnly}
                {...messageRegister}
                ref={(e) => {
                  registerRef(e);
                  textAreaRef.current = e;
                }}
              />
            </div>

            <div className="flex items-center gap-2.5 mt-1">
              <input
                type="checkbox"
                id="isActive"
                disabled={isReadOnly}
                {...register("isActive")}
                className="w-4 h-4 text-brand-500 rounded border-gray-300 focus:ring-brand-500 cursor-pointer"
              />
              <Label htmlFor="isActive" className="mb-0 cursor-pointer text-sm text-gray-600 dark:text-gray-400">
                Enable this template for use
              </Label>
            </div>

            <div className="flex items-center gap-3 justify-end mt-auto pt-5 border-t border-gray-100 dark:border-gray-800">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                {isReadOnly ? "Close" : "Cancel"}
              </Button>
              {!isReadOnly && (
                <Button variant="primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : isEditMode ? "Update Template" : "Create Template"}
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* ── Right: Preview ── */}
        <div className="col-span-12 lg:col-span-5 bg-gray-50 dark:bg-gray-900/40 p-6 lg:p-8 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                Live Preview
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">Updates as you type</p>
            </div>
            <button
              type="button"
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-500 transition-colors"
              title="Copy message content"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
              Copy
            </button>
          </div>

          <div className="relative flex-1">
            <div className="absolute -inset-0.5 bg-gradient-to-br from-brand-400/30 to-purple-400/20 rounded-2xl blur-md opacity-30" />
            <div className="relative h-full bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col">
              <div className="h-1 bg-gradient-to-r from-brand-500 to-brand-400" />
              <div className="p-6 flex flex-col flex-1 overflow-y-auto">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-white font-black text-sm shadow-md">
                    TS
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900 dark:text-white leading-none">ToyStore</p>
                    <p className="text-[10px] text-brand-500 font-semibold mt-0.5 uppercase tracking-wide">Official Message</p>
                  </div>
                </div>

                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 leading-tight break-words">
                  {watchedTitle || (
                    <span className="text-gray-300 dark:text-gray-600 font-medium italic">
                      Title will appear here…
                    </span>
                  )}
                </h3>

                <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-words flex-1">
                  {watchedMessage ? (
                    highlightPlaceholders(watchedMessage)
                  ) : (
                    <span className="text-gray-300 dark:text-gray-600 italic">
                      Your message will appear here as you type…
                    </span>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-50 dark:border-gray-800/60 flex items-center justify-between text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
                  <span>© 2026 ToyStore</span>
                  <span className="text-brand-300">#MSG-V1</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </Modal>
  );
};