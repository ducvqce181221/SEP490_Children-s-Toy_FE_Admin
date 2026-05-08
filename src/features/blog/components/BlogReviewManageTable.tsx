"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Pagination from "@/components/common/Pagination";
import { blogApi } from "../services/blog-api";
import { BlogReview, BlogReviewReply } from "../types/blog";

const flattenReplies = (replies: BlogReviewReply[], depth = 1): Array<{ item: BlogReviewReply; depth: number }> => {
  return replies.flatMap((reply) => [{ item: reply, depth }, ...flattenReplies(reply.replies, depth + 1)]);
};

export default function BlogReviewManageTable() {
  const [items, setItems] = useState<BlogReview[]>([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [status, setStatus] = useState<"all" | "Visible" | "Hidden">("all");
  const [replyTarget, setReplyTarget] = useState<{ reviewBlogId: number; replyToAccountId?: number; parentReplyId?: number } | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await blogApi.getBlogReviewsForManagement({
        pageNumber,
        pageSize,
        searchTerm: submittedSearch || undefined,
        status: status === "all" ? undefined : status,
      });
      setItems(data.items);
      setTotalPages(data.totalPages);
    } catch {
      toast.error("Unable to load blog reviews.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, [pageNumber, status, submittedSearch]);

  const totalRows = useMemo(() => items.reduce((sum, item) => sum + 1 + flattenReplies(item.replies).length, 0), [items]);

  const changeReviewStatus = async (reviewBlogId: number, next: "Visible" | "Hidden") => {
    try {
      await blogApi.updateBlogReviewStatus(reviewBlogId, next);
      toast.success("Updated review status.");
      await fetchData();
    } catch {
      toast.error("Cannot update review status.");
    }
  };

  const changeReplyStatus = async (replyBlogId: number, next: "Visible" | "Hidden") => {
    try {
      await blogApi.updateBlogReplyStatus(replyBlogId, next);
      toast.success("Updated reply status.");
      await fetchData();
    } catch {
      toast.error("Cannot update reply status.");
    }
  };

  const submitReply = async () => {
    if (!replyTarget || !replyText.trim()) {
      return;
    }

    try {
      await blogApi.replyToBlogReview(replyTarget.reviewBlogId, {
        comment: replyText.trim(),
        parentReplyId: replyTarget.parentReplyId,
        replyToAccountId: replyTarget.replyToAccountId,
      });
      toast.success("Reply sent.");
      setReplyTarget(null);
      setReplyText("");
      await fetchData();
    } catch {
      toast.error("Cannot reply now.");
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 text-black dark:border-white/[0.05] dark:bg-white/[0.03] dark:text-white">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search blog title, user, comment..." className="h-10 w-[320px] rounded-lg border border-gray-300 px-3 text-sm text-black placeholder:text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-300" />
        <button onClick={() => { setSubmittedSearch(searchTerm.trim()); setPageNumber(1); }} className="h-10 rounded-lg bg-blue-600 px-3 text-sm font-medium text-white">Search</button>
        <select value={status} onChange={(e) => { setStatus(e.target.value as "all" | "Visible" | "Hidden"); setPageNumber(1); }} className="h-10 rounded-lg border border-gray-300 px-3 text-sm text-black dark:border-gray-600 dark:bg-gray-800 dark:text-white">
          <option value="all">All status</option>
          <option value="Visible">Visible</option>
          <option value="Hidden">Hidden</option>
        </select>
        <span className="text-sm text-gray-500 dark:text-gray-300">Rows: {totalRows}</span>
      </div>

      <div className="space-y-4">
        {isLoading && <div className="text-sm text-gray-500 dark:text-gray-300">Loading...</div>}
        {!isLoading && items.length === 0 && <div className="text-sm text-gray-500 dark:text-gray-300">No reviews found.</div>}

        {items.map((review) => (
          <div key={review.reviewBlogId} className="rounded-lg border border-gray-200 p-3 dark:border-gray-600">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-black dark:text-white">{review.accountName} - {review.blogTitle}</p>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-200">{review.comment}</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={review.status}
                  onChange={(e) => void changeReviewStatus(review.reviewBlogId, e.target.value as "Visible" | "Hidden")}
                  className="h-8 rounded border border-gray-300 px-2 text-xs text-black dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="Visible">Visible</option>
                  <option value="Hidden">Hidden</option>
                </select>
                <button onClick={() => setReplyTarget({ reviewBlogId: review.reviewBlogId, replyToAccountId: review.accountId })} className="h-8 rounded border border-blue-500 px-2 text-xs text-blue-600">Reply</button>
              </div>
            </div>

            {flattenReplies(review.replies).map(({ item, depth }) => (
              <div key={item.replyBlogId} className="mt-2 rounded border border-gray-100 p-2 dark:border-gray-600" style={{ marginLeft: `${Math.min(depth, 4) * 20}px` }}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-xs text-gray-700 dark:text-gray-200"><span className="font-semibold text-black dark:text-white">{item.accountName}</span>{item.replyToAccountName ? ` -> ${item.replyToAccountName}` : ""}: {item.comment}</p>
                  <div className="flex items-center gap-2">
                    <select
                      value={item.status}
                      onChange={(e) => void changeReplyStatus(item.replyBlogId, e.target.value as "Visible" | "Hidden")}
                      className="h-7 rounded border border-gray-300 px-2 text-[11px] text-black dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="Visible">Visible</option>
                      <option value="Hidden">Hidden</option>
                    </select>
                    <button onClick={() => setReplyTarget({ reviewBlogId: review.reviewBlogId, replyToAccountId: item.accountId, parentReplyId: item.replyBlogId })} className="h-7 rounded border border-blue-500 px-2 text-[11px] text-blue-600">Reply</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {replyTarget && (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-400/40 dark:bg-blue-900/20">
          <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} maxLength={500} rows={3} className="w-full rounded border border-blue-200 p-2 text-sm text-black dark:border-blue-400/40 dark:bg-gray-800 dark:text-white" />
          <div className="mt-2 flex justify-end gap-2">
            <button onClick={() => setReplyTarget(null)} className="rounded border px-3 py-1 text-xs text-black dark:text-white">Cancel</button>
            <button onClick={() => void submitReply()} className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white">Send reply</button>
          </div>
        </div>
      )}

      {totalPages > 1 && <div className="mt-4"><Pagination currentPage={pageNumber} totalPages={totalPages} onPageChange={setPageNumber} /></div>}
    </div>
  );
}
