import React, { useEffect, useRef, useState, useCallback } from "react";
import type Quill from "quill";
import "quill/dist/quill.snow.css";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { TemplateFormData } from "../types/template";
import { TemplateFormSchema } from "../types/template.schema";
import { Template } from "../types/template";
import toast from "react-hot-toast";
import { templateApi } from "../services/template-api";

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
    title: "Campaign — Voucher",
    items: [
      "{{VoucherCode}}",
      "{{VoucherName}}",
      "{{DiscountValue}}",
      "{{DiscountType}}",
      "{{MinOrderAmount}}",
      "{{MaxDiscountCap}}",
    ],
  },
  {
    title: "Campaign — Product",
    items: ["{{ProductName}}", "{{Price}}"],
  },
  {
    title: "Campaign — Sale",
    items: ["{{PromotionName}}"],
  },
  {
    title: "Campaign — Blog",
    items: ["{{BlogTitle}}"],
  },
];

function highlightPlaceholders(text: string) {
  if (!text) return text;
  const parts = text.split(/(\{\{[^}]+\}\})/g);
  return parts.map((part, index) =>
    part.match(/\{\{[^}]+\}\}/) ? (
      <span
        key={index}
        className="bg-brand-50 text-brand-600 font-bold px-1.5 py-0.5 rounded-md border border-brand-100 mx-0.5 inline-block"
        style={{
          backgroundColor: "#f0fdf4",
          color: "#16a34a",
          padding: "2px 6px",
          borderRadius: "6px",
          border: "1px solid #dcfce7",
          fontFamily: "monospace",
          fontSize: "11px",
          fontWeight: "bold",
          lineHeight: 1
        }}
      >
        {part}
      </span>
    ) : (
      part
    )
  );
}

function highlightPlaceholdersHtml(htmlText: string) {
  if (!htmlText) return "";
  return htmlText.replace(
    /\{\{([^}]+)\}\}/g,
    `<span class="bg-brand-50 text-brand-600 font-bold px-1.5 py-0.5 rounded-md border border-brand-100 mx-0.5 inline-block" style="background-color: #f0fdf4; color: #16a34a; padding: 0.125rem 0.375rem; border-radius: 0.375rem; border: 1px solid #dcfce7; font-family: monospace; font-size: 11px; font-weight: bold; line-height: 1;">{{$1}}</span>`
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
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const isEditMode = mode === "edit";
  const isDetailMode = mode === "detail";
  const isReadOnly = isDetailMode;

  const quillRef = useRef<Quill | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const [lastFocusedField, setLastFocusedField] = useState<"title" | "message">("message");

  const pendingMessageRef = useRef("");
  const isApplyingMessageRef = useRef(false);
  const toolbarId = `template-message-toolbar`;

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

  const { ref: titleRegisterRef, ...titleRegister } = register("titleTemplate");

  const watchedTitle = watchForm("titleTemplate");
  const watchedMessage = watchForm("messageTemplate");

  const normalizeMessageHtml = useCallback((rawValue: unknown) => {
    if (typeof rawValue !== "string") {
      return "";
    }

    const trimmed = rawValue.trim();
    if (trimmed.length === 0 || trimmed === "<p><br></p>") {
      return "";
    }

    return trimmed;
  }, []);

  const toMessageFormValue = useCallback(
    (html: string): string | null => {
      const normalizedHtml = normalizeMessageHtml(html);
      if (normalizedHtml.length === 0) {
        return null;
      }

      if (typeof window === "undefined") {
        return normalizedHtml;
      }

      const parser = document.createElement("div");
      parser.innerHTML = normalizedHtml;
      const plainText = parser.textContent?.replace(/\u00a0/g, " ").trim() ?? "";
      return plainText.length === 0 ? null : normalizedHtml;
    },
    [normalizeMessageHtml],
  );

  const setMessageEditorContent = useCallback(
    (html: string) => {
      const normalizedContent = normalizeMessageHtml(html);
      if (!quillRef.current) {
        pendingMessageRef.current = normalizedContent;
        return;
      }

      isApplyingMessageRef.current = true;

      // Sử dụng innerHTML trực tiếp cho Quill 2.x cực kỳ an toàn và ổn định
      quillRef.current.root.innerHTML = normalizedContent;

      queueMicrotask(() => {
        isApplyingMessageRef.current = false;
      });
    },
    [normalizeMessageHtml],
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load data from backend when editing/viewing, fallback to list data first
  useEffect(() => {
    if (!isOpen) return;

    if ((isEditMode || isDetailMode) && templateData) {
      // 1. Set values immediately using list data
      reset({
        templateCode: templateData.templateCode,
        titleTemplate: templateData.titleTemplate,
        messageTemplate: templateData.messageTemplate,
        isActive: templateData.isActive,
      });
      setMessageEditorContent(templateData.messageTemplate);

      // 2. Fetch the latest detail from backend
      const fetchDetail = async () => {
        setIsLoadingDetail(true);
        try {
          const detail = await templateApi.getTemplateById(templateData.templateId);
          reset({
            templateCode: detail.templateCode,
            titleTemplate: detail.titleTemplate,
            messageTemplate: detail.messageTemplate,
            isActive: detail.isActive,
          });
          setMessageEditorContent(detail.messageTemplate);
        } catch (err) {
          console.error("Failed to fetch template detail:", err);
          toast.error("Could not sync with server. Showing cached template data.");
        } finally {
          setIsLoadingDetail(false);
        }
      };

      fetchDetail();
    } else {
      // Create mode
      reset(defaultValues);
      setMessageEditorContent("");
    }
  }, [isOpen, templateData, isEditMode, isDetailMode, reset, setMessageEditorContent]);

  // Callback Ref để khởi tạo Quill cực kỳ an toàn và đồng bộ với DOM React
  const editorRefCallback = useCallback((node: HTMLDivElement | null) => {
    if (!node) {
      quillRef.current = null;
      return;
    }

    if (quillRef.current) {
      return;
    }

    const initQuill = async () => {
      const QuillModule = await import("quill");
      if (!node || quillRef.current) return;

      const Quill = QuillModule.default;
      const quill = new Quill(node, {
        theme: "snow",
        modules: {
          toolbar: isReadOnly ? false : [
            ["bold", "italic", "underline", "strike"],
            [{ color: [] }, { background: [] }],
            [{ list: "ordered" }, { list: "bullet" }],
            ["clean"]
          ],
        },
        placeholder: "Write your message here...",
        readOnly: isReadOnly,
      });

      quill.on("text-change", (_delta, _oldDelta, source) => {
        if (source !== "user" || isApplyingMessageRef.current) {
          return;
        }
        setValue("messageTemplate", toMessageFormValue(quill.root.innerHTML) || "", {
          shouldValidate: true,
          shouldDirty: true,
        });
      });

      quill.on("selection-change", (range) => {
        if (range) {
          setLastFocusedField("message");
        }
      });

      quillRef.current = quill;

      // Nạp dữ liệu ban đầu ĐÚNG 1 LẦN DUY NHẤT khi khởi tạo thành công
      if (isEditMode || isDetailMode) {
        const initialContent = normalizeMessageHtml(getValues("messageTemplate") || "");
        quill.root.innerHTML = initialContent;
        pendingMessageRef.current = initialContent;
      } else {
        quill.root.innerHTML = "";
        pendingMessageRef.current = "";
      }

      quill.enable(!isReadOnly && !isSubmitting && !isLoadingDetail);
    };

    void initQuill();
  }, [isOpen, isReadOnly, isEditMode, isDetailMode, isSubmitting, isLoadingDetail, normalizeMessageHtml, setValue, toMessageFormValue, getValues]);

  // Reactively enable/disable Quill editor based on submitting/loading detail state
  useEffect(() => {
    if (quillRef.current) {
      quillRef.current.enable(!isReadOnly && !isSubmitting && !isLoadingDetail);
    }
  }, [isReadOnly, isSubmitting, isLoadingDetail]);

  // Handlers
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

    if (lastFocusedField === "title" && titleInputRef.current) {
      const input = titleInputRef.current;
      const start = input.selectionStart ?? 0;
      const end = input.selectionEnd ?? 0;
      const currentValue = getValues("titleTemplate") || "";
      const next = currentValue.substring(0, start) + placeholder + currentValue.substring(end);

      setValue("titleTemplate", next, { shouldValidate: true, shouldDirty: true });
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + placeholder.length, start + placeholder.length);
      }, 0);
    } else if (quillRef.current) {
      const range = quillRef.current.getSelection();
      if (range) {
        quillRef.current.insertText(range.index, placeholder, "user");
        quillRef.current.setSelection(range.index + placeholder.length, 0, "user");
      } else {
        const length = quillRef.current.getLength();
        quillRef.current.insertText(Math.max(0, length - 1), placeholder, "user");
      }

      setValue("messageTemplate", toMessageFormValue(quillRef.current.root.innerHTML) || "", {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  if (!isMounted) return null;

  const title = isDetailMode ? "Template Details" : isEditMode ? "Edit Template" : "Add New Template";

  return (
    <>
      <style>{`
        .ql-container.ql-snow,
        .ql-container.ql-snow *,
        .ql-editor,
        .ql-editor *,
        .ql-editor span,
        .ql-editor [style*="font-family"] {
          font-family: Outfit, sans-serif !important;
        }
        .ql-editor {
          font-size: 14px !important;
          line-height: 1.6 !important;
        }
        .ql-editor.ql-blank::before {
          font-style: normal !important;
          color: #9ca3af !important;
        }
      `}</style>
      <Modal isOpen={isOpen} onClose={onClose} className="max-w-[1000px] p-0 overflow-hidden rounded-xl">
        <div className="grid grid-cols-12 h-[620px] overflow-hidden">

          {/* ── Left: Form ── */}
          <div className="relative col-span-12 lg:col-span-7 p-8 flex flex-col border-r border-gray-100 dark:border-gray-800 overflow-y-auto max-h-full">
            {isLoadingDetail && (
              <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 z-50 flex flex-col items-center justify-center backdrop-blur-[2px] transition-opacity duration-300">
                <svg className="animate-spin h-10 w-10 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-3 text-sm font-semibold text-gray-500 dark:text-gray-400">Loading latest template content...</p>
              </div>
            )}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90 mb-1">
                {title}
              </h2>
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
                    disabled={isReadOnly || isLoadingDetail}
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
                    disabled={isReadOnly || isLoadingDetail}
                    {...titleRegister}
                    ref={(e) => {
                      titleRegisterRef(e);
                      titleInputRef.current = e;
                    }}
                    onFocus={() => {
                      setLastFocusedField("title");
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label className="mb-0 flex items-center gap-2">
                    <span>Message Content <span className="text-error-500">*</span></span>
                    <span className="text-[10px] text-gray-400 font-normal mt-0.5">
                      {(watchedMessage || "").length}/4000
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
                                  disabled={isReadOnly || isLoadingDetail}
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

                {isReadOnly ? (
                  <div
                    className="min-h-[180px] p-4 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-xl text-sm text-gray-800 dark:text-white/90 overflow-y-auto ql-editor prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: highlightPlaceholdersHtml(watchedMessage || "") }}
                  />
                ) : (
                  <div className={`rounded-xl border transition-all overflow-hidden bg-white dark:bg-gray-900 ${errors.messageTemplate ? "border-error-500 ring-1 ring-error-500" : "border-gray-200 dark:border-gray-700"
                    }`}>
                    <div
                      ref={editorRefCallback}
                      className="min-h-[180px] text-sm text-gray-800 dark:text-white/90"
                    />
                  </div>
                )}
                <input type="hidden" {...register("messageTemplate")} />
                {errors.messageTemplate && (
                  <p className="mt-1.5 text-sm text-error-500">
                    {errors.messageTemplate.message}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2.5 mt-1">
                <input
                  type="checkbox"
                  id="isActive"
                  disabled={isReadOnly || isLoadingDetail}
                  {...register("isActive")}
                  className="w-4 h-4 text-brand-500 rounded border-gray-300 focus:ring-brand-500 cursor-pointer"
                />
                <Label htmlFor="isActive" className="mb-0 cursor-pointer text-sm text-gray-600 dark:text-gray-400">
                  Enable this template for use
                </Label>
              </div>

              <div className="flex items-center gap-3 justify-end mt-auto pt-5 border-t border-gray-100 dark:border-gray-800">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting || isLoadingDetail}>
                  {isReadOnly ? "Close" : "Cancel"}
                </Button>
                {!isReadOnly && (
                  <Button variant="primary" type="submit" disabled={isSubmitting || isLoadingDetail}>
                    {isSubmitting ? "Saving..." : isEditMode ? "Update Template" : "Create Template"}
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* ── Right: Preview ── */}
          <div className="col-span-12 lg:col-span-5 bg-gray-50 dark:bg-gray-900/40 p-6 lg:p-8 flex flex-col overflow-y-auto max-h-full">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                  Live Preview
                </p>
              </div>
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
                    {watchedTitle ? (
                      highlightPlaceholders(watchedTitle)
                    ) : (
                      <span className="text-gray-300 dark:text-gray-600 font-medium italic">
                        Title will appear here…
                      </span>
                    )}
                  </h3>

                  <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed break-words flex-1 ql-editor p-0 prose dark:prose-invert max-w-none">
                    {watchedMessage ? (
                      <div dangerouslySetInnerHTML={{ __html: highlightPlaceholdersHtml(watchedMessage) }} />
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
    </>
  );
};