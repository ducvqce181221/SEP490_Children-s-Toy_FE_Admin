"use client";

import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { blogApi } from "../services/blog-api";
import { ApiErrorResponse, AiBlockedResponse, AiBlogGenerateResult, BlogCategoryItem } from "../types/blog";

interface BlogAiGenerateModalProps {
  isOpen: boolean;
  blogPostId?: number | null;
  defaultTitle?: string;
  defaultContent?: string;
  defaultCategoryId?: number;
  onClose: () => void;
  onGenerated: (result: AiBlogGenerateResult) => void;
}

const BlogAiGenerateModal: React.FC<BlogAiGenerateModalProps> = ({
  isOpen,
  blogPostId,
  defaultTitle = "",
  defaultContent = "",
  defaultCategoryId = 0,
  onClose,
  onGenerated,
}) => {
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState("");
  const [promptStructure, setPromptStructure] = useState("");
  const [tone, setTone] = useState("Friendly");
  const [categoryId, setCategoryId] = useState<number>(0);
  const [categories, setCategories] = useState<BlogCategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockedData, setBlockedData] = useState<AiBlockedResponse | null>(null);

  const violationLabelMap: Record<AiBlockedResponse["violation_type"], string> = {
    brand_external: "Thương hiệu bên ngoài",
    topic_restricted: "Chủ đề không phù hợp",
    out_of_scope: "Ngoài phạm vi website",
  };

  const parseBlockedPayload = (value: unknown): AiBlockedResponse | null => {
    const parsed = typeof value === "string" ? (() => {
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    })() : value;

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const candidate = parsed as Partial<AiBlockedResponse>;
    if (
      candidate.status === "blocked"
      && (candidate.violation_type === "brand_external"
        || candidate.violation_type === "topic_restricted"
        || candidate.violation_type === "out_of_scope")
      && typeof candidate.violated_keyword === "string"
      && typeof candidate.reason === "string"
      && Array.isArray(candidate.suggestions)
    ) {
      return {
        status: "blocked",
        violation_type: candidate.violation_type,
        violated_keyword: candidate.violated_keyword,
        reason: candidate.reason,
        suggestions: candidate.suggestions
          .filter((x): x is string => typeof x === "string")
          .slice(0, 4),
      };
    }

    return null;
  };

  useEffect(() => {
    if (!isOpen) return;
    setTitle(defaultTitle);
    setPromptStructure("");
    setError(null);
    setBlockedData(null);

    blogApi
      .getBlogCategories()
      .then((items) => {
        setCategories(items);
        if (items.length > 0) {
          const targetCategory =
            defaultCategoryId > 0 && items.some((x) => x.blogCategoryId === defaultCategoryId)
              ? defaultCategoryId
              : items[0].blogCategoryId;
          setCategoryId(targetCategory);
        }
      })
      .catch(() => setError("Unable to load blog categories."));
  }, [defaultCategoryId, defaultContent, defaultTitle, isOpen]);

  const handleGenerate = async () => {
    if (!title.trim() || !promptStructure.trim() || categoryId <= 0) {
      setError("Title, PromptStructure, and Category are required.");
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const result = await blogApi.generateWithAi({
        blogPostId: blogPostId ?? undefined,
        action: "Generate",
        title: title.trim(),
        description: description.trim() || null,
        promptStructure: promptStructure.trim(),
        defaultTone: tone.trim() || "Friendly",
        defaultCategoryId: categoryId,
        isActive: true,
      });

      const blockedFromSuccess = parseBlockedPayload(result);
      const blockedFromContent = parseBlockedPayload(result.blogContent);
      if (blockedFromSuccess || blockedFromContent) {
        setBlockedData(blockedFromSuccess ?? blockedFromContent);
        return;
      }

      onGenerated(result);
      onClose();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      const blockedFromData = parseBlockedPayload(axiosError.response?.data);
      const blockedFromMessage = parseBlockedPayload(axiosError.response?.data?.message);
      const blockedFromDetail = parseBlockedPayload((axiosError.response?.data as { detail?: unknown } | undefined)?.detail);
      if (blockedFromData || blockedFromMessage || blockedFromDetail) {
        setBlockedData(blockedFromData ?? blockedFromMessage ?? blockedFromDetail);
        return;
      }

      setError(axiosError.response?.data?.message ?? "AI generation failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[720px] p-6 lg:p-7">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {blogPostId ? "Improve Blog with AI" : "Generate Blog with AI"}
        </h3>
        {error && <p className="text-sm text-error-600">{error}</p>}
        <input className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title / keyword" />
        <textarea className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" />
        <textarea className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm" rows={4} value={promptStructure} onChange={(e) => setPromptStructure(e.target.value)} placeholder="PromptStructure" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input className="h-11 rounded-lg border border-gray-300 px-3 text-sm" value={tone} onChange={(e) => setTone(e.target.value)} placeholder="Tone (default: Friendly)" />
          <select className="h-11 rounded-lg border border-gray-300 px-3 text-sm" value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))}>
            <option value={0}>Select category</option>
            {categories.map((x) => (
              <option key={x.blogCategoryId} value={x.blogCategoryId}>{x.blogCategoryName}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button variant="primary" onClick={handleGenerate} disabled={isLoading}>
            {isLoading ? "Generating..." : "Generate with AI"}
          </Button>
        </div>
      </div>

      <Modal
        isOpen={blockedData !== null}
        onClose={() => setBlockedData(null)}
        className="max-w-[680px] border border-gray-200 bg-white p-6 shadow-2xl lg:p-8"
      >
        <div className="space-y-5">
          {blockedData && (
            <>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-500">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M12 3L4 7V12C4 17 7.4 21.7 12 23C16.6 21.7 20 17 20 12V7L12 3Z" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M9 9L15 15M15 9L9 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <h4 className="text-2xl font-semibold text-gray-900">
                Không thể tạo nội dung này
              </h4>
              <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                {violationLabelMap[blockedData.violation_type]}
              </span>
              <p className="text-sm leading-7 text-gray-700">
                Chủ đề yêu cầu đề cập đến <span className="font-semibold text-gray-900">{blockedData.violated_keyword}</span>. {blockedData.reason}
              </p>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="mb-3 text-sm font-semibold text-gray-800">
                  Gợi ý chủ đề thay thế:
                </p>
                <div className="flex flex-wrap gap-2">
                  {blockedData.suggestions.map((item, idx) => (
                    <span
                      key={`${item}-${idx}`}
                      className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setBlockedData(null)} className="border-gray-300 bg-white text-gray-700 hover:bg-gray-100">
              Đóng
            </Button>
            <Button variant="primary" onClick={() => setBlockedData(null)} className="bg-brand-500 text-white hover:bg-brand-600">
              Nhập chủ đề khác
            </Button>
          </div>
        </div>
      </Modal>
    </Modal>
  );
};

export default BlogAiGenerateModal;
