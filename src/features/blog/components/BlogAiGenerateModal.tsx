"use client";

import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { blogApi } from "../services/blog-api";
import { ApiErrorResponse, AiBlogGenerateResult, BlogCategoryItem } from "../types/blog";

interface BlogAiGenerateModalProps {
  isOpen: boolean;
  blogPostId?: number | null;
  defaultTitle?: string;
  defaultContent?: string;
  onClose: () => void;
  onGenerated: (result: AiBlogGenerateResult) => void;
}

const BlogAiGenerateModal: React.FC<BlogAiGenerateModalProps> = ({
  isOpen,
  blogPostId,
  defaultTitle = "",
  defaultContent = "",
  onClose,
  onGenerated,
}) => {
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState("");
  const [promptStructure, setPromptStructure] = useState("");
  const [tone, setTone] = useState("Friendly");
  const [categoryId, setCategoryId] = useState<number>(0);
  const [action, setAction] = useState<"Generate" | "Improve" | "Rewrite">("Generate");
  const [categories, setCategories] = useState<BlogCategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTitle(defaultTitle);
    setPromptStructure(defaultContent ? "Cải thiện bài viết hiện tại theo tone thân thiện cho phụ huynh." : "");
    setError(null);
    blogApi.getBlogCategories()
      .then((items) => {
        setCategories(items);
        if (items.length > 0) setCategoryId(items[0].blogCategoryId);
      })
      .catch(() => setError("Unable to load blog categories."));
  }, [defaultContent, defaultTitle, isOpen]);

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
        action,
        title: title.trim(),
        description: description.trim() || null,
        promptStructure: promptStructure.trim(),
        defaultTone: tone.trim() || "Friendly",
        defaultCategoryId: categoryId,
        isActive: true,
      });
      onGenerated(result);
      onClose();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setError(axiosError.response?.data?.message ?? "AI generation failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[720px] p-6 lg:p-7">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          {blogPostId ? "Improve Blog bằng AI" : "Add Blog bằng AI"}
        </h3>
        {error && <p className="text-sm text-error-600">{error}</p>}
        <input className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title / keyword" />
        <textarea className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" />
        <textarea className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm" rows={4} value={promptStructure} onChange={(e) => setPromptStructure(e.target.value)} placeholder="PromptStructure" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <select className="h-11 rounded-lg border border-gray-300 px-3 text-sm" value={action} onChange={(e) => setAction(e.target.value as "Generate" | "Improve" | "Rewrite")}>
            <option value="Generate">Generate</option>
            <option value="Improve">Improve</option>
            <option value="Rewrite">Rewrite</option>
          </select>
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
    </Modal>
  );
};

export default BlogAiGenerateModal;
