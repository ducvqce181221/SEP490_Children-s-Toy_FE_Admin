"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Pagination from "@/components/common/Pagination";
import { Modal } from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import SearchInput from "@/components/common/SearchInput";
import Button from "@/components/ui/button/Button";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import TextArea from "@/components/form/input/TextArea";
import { blogApi } from "../services/blog-api";
import { BlogReview, BlogReviewReply } from "../types/blog";

const flattenReplies = (replies: BlogReviewReply[], depth = 1): Array<{ item: BlogReviewReply; depth: number; visualDepth: number }> => {
  return replies.flatMap((reply) => {
    const next = depth >= 2 ? 2 : depth;
    return [{ item: reply, depth, visualDepth: next }, ...flattenReplies(reply.replies, depth + 1)];
  });
};

const headerCellClassName =
  "px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400";

const FilterIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.5 5.83333H17.5M5 10H15M8.33333 14.1667H11.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const toDateTimeText = (value: string | null) => {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "NA";
  }
  return parts.slice(-2).map((part) => part[0]?.toUpperCase() ?? "").join("");
};

const getRoleTone = (name: string) => {
  const normalized = name.toLowerCase();
  const isStaffOrAdmin =
    normalized.includes("admin") || normalized.includes("staff") || normalized.includes("toystore");
  return isStaffOrAdmin
    ? {
        label: "Staff/Admin",
        badge: "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300",
        avatar: "bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300",
      }
    : {
        label: "Customer",
        badge: "bg-blue-light-50 text-blue-light-500 dark:bg-blue-light-500/15 dark:text-blue-light-300",
        avatar: "bg-blue-light-100 text-blue-light-700 dark:bg-blue-light-500/20 dark:text-blue-light-200",
      };
};

type ThreadEntry =
  | { kind: "review"; review: BlogReview; visualDepth: 0 }
  | { kind: "reply"; review: BlogReview; reply: BlogReviewReply; visualDepth: number };

const DEFAULT_VISIBLE_REPLIES = 3;

const buildThreadEntries = (review: BlogReview): ThreadEntry[] => {
  const replyEntries = flattenReplies(review.replies).map(({ item, visualDepth }) => ({
    kind: "reply" as const,
    review,
    reply: item,
    visualDepth,
  }));

  return [{ kind: "review" as const, review, visualDepth: 0 }, ...replyEntries];
};

export default function BlogReviewManageTable() {
  const [items, setItems] = useState<BlogReview[]>([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [status, setStatus] = useState<"all" | "Visible" | "Hidden">("all");
  const [replyTarget, setReplyTarget] = useState<{
    reviewBlogId: number;
    replyToAccountId?: number;
    parentReplyId?: number;
    replyToAccountName?: string;
  } | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState<Record<number, boolean>>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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
      setTotalCount(data.totalCount);
    } catch {
      toast.error("Unable to load blog reviews.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, [pageNumber, pageSize, status, submittedSearch]);

  const pageRangeText = useMemo(() => {
    if (totalCount === 0) {
      return "No data available";
    }
    const start = (pageNumber - 1) * pageSize + 1;
    const end = Math.min(pageNumber * pageSize, totalCount);
    return `Showing ${start} - ${end} / ${totalCount} reviews`;
  }, [pageNumber, pageSize, totalCount]);

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

  const handleSearchSubmit = () => {
    setSubmittedSearch(searchTerm.trim());
    setPageNumber(1);
    setExpandedReviews({});
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white text-black dark:border-white/[0.05] dark:bg-white/[0.03] dark:text-white">
      <div className="px-5 py-5 sm:px-6">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Blog Reviews</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage customer reviews and replies for blog posts.
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearchSubmit();
                }
              }}
              placeholder="Search reviews... (Press Enter)"
            />
          </div>
          <div className="relative">
            <Button
              variant="outline"
              startIcon={<FilterIcon />}
              onClick={() => setIsFilterOpen((prev) => !prev)}
              className="h-11 px-7 font-medium"
            >
              Filter
            </Button>
            <Dropdown isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} className="right-0 w-[280px] p-4">
              <div className="space-y-3">
                <Label>Status</Label>
                <Select
                  options={[
                    { value: "all", label: "All status" },
                    { value: "Visible", label: "Visible" },
                    { value: "Hidden", label: "Hidden" },
                  ]}
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value as "all" | "Visible" | "Hidden");
                    setPageNumber(1);
                    setIsFilterOpen(false);
                  }}
                />
              </div>
            </Dropdown>
          </div>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto border-t border-gray-100 dark:border-white/[0.05]">
        <div className="min-w-[1060px]">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className={headerCellClassName}>#</TableCell>
                <TableCell isHeader className={headerCellClassName}>Blog / Review Thread</TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={2} className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    Loading review list...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                    No reviews found.
                  </TableCell>
                </TableRow>
              )}

              {items.map((review, index) => (
                <TableRow key={review.reviewBlogId} className="align-top">
                  <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {(pageNumber - 1) * pageSize + index + 1}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <div className="max-w-[860px]">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{review.blogTitle}</p>
                    </div>
                    <div className="mt-3 space-y-3">
                      {(() => {
                        const threadEntries = buildThreadEntries(review);
                        const replyEntries = threadEntries.filter((entry) => entry.kind === "reply");
                        const isExpanded = !!expandedReviews[review.reviewBlogId] || submittedSearch.length > 0;
                        const visibleReplyCount = isExpanded
                          ? replyEntries.length
                          : Math.min(DEFAULT_VISIBLE_REPLIES, replyEntries.length);
                        const hiddenReplyCount = Math.max(0, replyEntries.length - visibleReplyCount);
                        const visibleEntries: ThreadEntry[] = [
                          threadEntries[0],
                          ...replyEntries.slice(0, visibleReplyCount),
                        ];

                        return (
                          <>
                            {visibleEntries.map((entry) => {
                        const isReview = entry.kind === "review";
                        const actorName = isReview ? entry.review.accountName : entry.reply.accountName;
                        const actorTone = getRoleTone(actorName);
                        const actorComment = isReview ? entry.review.comment : entry.reply.comment;
                        const actorTime = toDateTimeText(isReview ? entry.review.createdAt : entry.reply.createdAt);
                        const replyToName = isReview ? null : entry.reply.replyToAccountName;
                        const visualDepth = isReview ? 0 : entry.visualDepth;
                        const actionKey = isReview ? `action-review-${entry.review.reviewBlogId}` : `action-reply-${entry.reply.replyBlogId}`;

                              return (
                          <div
                            key={actionKey}
                            className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-stretch"
                          >
                            <div
                              className={`rounded-xl border border-gray-200 p-4 dark:border-gray-700 ${
                                isReview
                                  ? "bg-gray-50/60 dark:bg-gray-800/40"
                                  : "bg-white dark:bg-gray-900/20"
                              } ${visualDepth === 1 ? "ml-8" : ""} ${
                                visualDepth >= 2
                                  ? "ml-12 border-l-[3px] border-l-brand-500 dark:border-l-brand-400"
                                  : ""
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${actorTone.avatar}`}>
                                  {getInitials(actorName)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{actorName}</p>
                                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${actorTone.badge}`}>
                                      {actorTone.label}
                                    </span>
                                    {replyToName ? (
                                      <span className="text-xs text-gray-500 dark:text-gray-400">reply to {replyToName}</span>
                                    ) : null}
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{actorTime}</span>
                                  </div>
                                  <p className="mt-1.5 break-words text-sm leading-6 text-gray-700 dark:text-gray-200">{actorComment}</p>
                                </div>
                              </div>
                            </div>

                            <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-2 dark:border-gray-700 dark:bg-gray-800/40">
                              <div className="flex h-full items-center gap-2">
                                <select
                                  value={isReview ? entry.review.status : entry.reply.status}
                                  onChange={(e) =>
                                    isReview
                                      ? void changeReviewStatus(entry.review.reviewBlogId, e.target.value as "Visible" | "Hidden")
                                      : void changeReplyStatus(entry.reply.replyBlogId, e.target.value as "Visible" | "Hidden")
                                  }
                                  className="h-9 flex-1 rounded-md border border-gray-300 bg-white px-2 text-xs text-black dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                                >
                                  <option value="Visible">Visible</option>
                                  <option value="Hidden">Hidden</option>
                                </select>
                                <button
                                  onClick={() =>
                                    setReplyTarget(
                                      isReview
                                        ? {
                                            reviewBlogId: entry.review.reviewBlogId,
                                            replyToAccountId: entry.review.accountId,
                                            replyToAccountName: entry.review.accountName,
                                          }
                                        : {
                                            reviewBlogId: entry.review.reviewBlogId,
                                            replyToAccountId: entry.reply.accountId,
                                            parentReplyId: entry.reply.replyBlogId,
                                            replyToAccountName: entry.reply.accountName,
                                          },
                                    )
                                  }
                                  className="h-9 rounded-md border border-brand-500 px-3 text-xs font-semibold text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10"
                                >
                                  Reply
                                </button>
                              </div>
                            </div>
                          </div>
                              );
                            })}
                            {hiddenReplyCount > 0 && (
                              <div className="ml-8">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedReviews((prev) => ({ ...prev, [review.reviewBlogId]: true }))
                                  }
                                  className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
                                >
                                  See more replies ({hiddenReplyCount})
                                </button>
                              </div>
                            )}
                            {submittedSearch.length === 0 && replyEntries.length > DEFAULT_VISIBLE_REPLIES && isExpanded && (
                              <div className="ml-8">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedReviews((prev) => ({ ...prev, [review.reviewBlogId]: false }))
                                  }
                                  className="text-xs font-semibold text-gray-600 hover:underline dark:text-gray-300"
                                >
                                  Collapse replies
                                </button>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Modal isOpen={!!replyTarget} onClose={() => setReplyTarget(null)} className="max-w-[620px] p-5 lg:p-6">
        <div className="space-y-3">
          <h4 className="text-base font-semibold text-black dark:text-white">Reply to review</h4>
          {replyTarget?.replyToAccountName && (
            <p className="text-xs text-gray-600 dark:text-gray-300">
              Replying to <span className="font-semibold text-black dark:text-white">{replyTarget.replyToAccountName}</span>
            </p>
          )}
          <TextArea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            maxLength={500}
            rows={4}
            className="border-blue-200 dark:border-blue-400/40"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-300">{replyText.length}/500</span>
            <div className="flex gap-2">
              <button onClick={() => setReplyTarget(null)} className="rounded border px-3 py-1 text-xs text-black dark:text-white">Cancel</button>
              <button onClick={() => void submitReply()} disabled={!replyText.trim()} className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white disabled:opacity-50">Send reply</button>
            </div>
          </div>
        </div>
      </Modal>

      <div className="flex flex-col items-start justify-between gap-4 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center dark:border-white/[0.05]">
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <span>{pageRangeText}</span>
          <label htmlFor="blog-review-page-size" className="font-medium">Rows per page</label>
          <select
            id="blog-review-page-size"
            className="rounded-md border border-gray-300 px-2 py-1 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800"
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPageNumber(1);
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
        {totalPages > 0 && (
          <Pagination currentPage={pageNumber} totalPages={totalPages} onPageChange={setPageNumber} />
        )}
      </div>
    </div>
  );
}
