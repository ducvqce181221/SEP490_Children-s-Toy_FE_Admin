"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useAuthContext } from "@/context/AuthContext";
import Pagination from "@/components/common/Pagination";
import { Modal } from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import SearchInput from "@/components/common/SearchInput";
import Button from "@/components/ui/button/Button";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import TextArea from "@/components/form/input/TextArea";
import { ChevronDownIcon, PencilIcon } from "@/icons";
import { formatDisplayDate } from "@/utils/date-utils";
import { blogApi } from "../services/blog-api";
import { BlogCommentBanReason, BlogReview, BlogReviewModerationStatus, BlogReviewReply } from "../types/blog";

const flattenReplies = (replies: BlogReviewReply[], depth = 1): Array<{ item: BlogReviewReply; depth: number }> => {
  return replies.flatMap((reply) => [{ item: reply, depth }, ...flattenReplies(reply.replies, depth + 1)]);
};

const headerCellClassName = "px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400";

const FilterIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.5 5.83333H17.5M5 10H15M8.33333 14.1667H11.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const getStatusBadge = (status: BlogReviewModerationStatus) => {
  switch (status) {
    case "Approved":
      return <Badge size="sm" color="success">Approved</Badge>;
    case "Rejected":
      return <Badge size="sm" color="error">Rejected</Badge>;
    case "ManualReview":
      return <Badge size="sm" color="warning">Manual Review</Badge>;
    default:
      return <Badge size="sm" color="light">{status}</Badge>;
  }
};

const toDateTimeText = (value: string | null) => {
  return formatDisplayDate(value);
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "NA";
  return parts.slice(-2).map((part) => part[0]?.toUpperCase() ?? "").join("");
};

const getRoleTone = (name: string) => {
  const normalized = name.toLowerCase();
  const isStaffOrAdmin = normalized.includes("admin") || normalized.includes("staff") || normalized.includes("toystore");
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

const ROLE_ID = {
  ADMIN: 2,
  STAFF: 3,
} as const;

const normalizeRoleName = (roleName?: string | null) => (roleName ?? "").trim().toLowerCase();

const isAdminAccount = (account: { roleId: number; roleName: string } | null) =>
  account?.roleId === ROLE_ID.ADMIN || normalizeRoleName(account?.roleName) === "admin";

const isStaffAccount = (account: { roleId: number; roleName: string } | null) =>
  account?.roleId === ROLE_ID.STAFF || normalizeRoleName(account?.roleName) === "staff";

const isCustomerRole = (roleName: string) => normalizeRoleName(roleName) === "customer";

type EditTarget =
  | { kind: "review"; reviewBlogId: number; comment: string; moderationStatus: BlogReviewModerationStatus; banReasonId: number | null; accountRoleName: string }
  | { kind: "reply"; replyBlogId: number; comment: string; moderationStatus: BlogReviewModerationStatus; banReasonId: number | null; accountRoleName: string };

export default function BlogReviewManageTable() {
  const { account } = useAuthContext();
  const [items, setItems] = useState<BlogReview[]>([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [replyTarget, setReplyTarget] = useState<{ reviewBlogId: number; replyToAccountId?: number; parentReplyId?: number; replyToAccountName?: string } | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState<Record<number, boolean>>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [editStatus, setEditStatus] = useState<BlogReviewModerationStatus>("ManualReview");
  const [selectedBanReasonId, setSelectedBanReasonId] = useState<number | "">("");
  const [banReasons, setBanReasons] = useState<BlogCommentBanReason[]>([]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await blogApi.getBlogReviewsForManagement({
        pageNumber,
        pageSize,
        searchTerm: submittedSearch || undefined,
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
  }, [pageNumber, pageSize, submittedSearch]);

  useEffect(() => {
    void blogApi.getBlogCommentBanReasons().then(setBanReasons).catch(() => setBanReasons([]));
  }, []);

  const pageRangeText = useMemo(() => {
    if (totalCount === 0) return "No data available";
    const start = (pageNumber - 1) * pageSize + 1;
    const end = Math.min(pageNumber * pageSize, totalCount);
    return `Showing ${start} - ${end} / ${totalCount} reviews`;
  }, [pageNumber, pageSize, totalCount]);

  const currentUserIsAdmin = isAdminAccount(account);
  const currentUserIsStaff = isStaffAccount(account);

  const canRejectTarget = (target: EditTarget) => {
    if (currentUserIsAdmin) return true;
    return currentUserIsStaff && target.kind === "review" && isCustomerRole(target.accountRoleName);
  };

  const editTargetCanReject = editTarget ? canRejectTarget(editTarget) : false;
  const moderationStatusOptions = [
    ...(editTarget?.moderationStatus === "Approved" ? [] : [{ value: "ManualReview", label: "Manual" }]),
    { value: "Approved", label: "Approved" },
    ...(editTargetCanReject || editTarget?.moderationStatus === "Rejected" ? [{ value: "Rejected", label: "Rejected" }] : []),
  ];
  const isRejectUnauthorized = editStatus === "Rejected" && !!editTarget && !editTargetCanReject;

  const changeModerationStatus = async (target: EditTarget, next: BlogReviewModerationStatus, banReasonId?: number) => {
    try {
      if (target.kind === "review") {
        await blogApi.updateBlogReviewStatus(target.reviewBlogId, next, banReasonId);
      } else {
        await blogApi.updateBlogReplyStatus(target.replyBlogId, next, banReasonId);
      }
      toast.success(`Updated ${target.kind} status.`);
      setEditTarget(null);
      await fetchData();
    } catch (error) {
      const message =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === "string"
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : "Cannot update status.";
      toast.error(message ?? "Cannot update status.");
    }
  };

  const submitReply = async () => {
    if (!replyTarget || !replyText.trim()) return;

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

  const closeReplyModal = () => {
    setReplyTarget(null);
    setReplyText("");
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
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage customer reviews and replies for blog posts.</p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <SearchInput value={searchTerm} onChange={setSearchTerm} onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()} placeholder="Search reviews... (Press Enter)" />
          </div>
          <div className="relative">
            <Button variant="outline" startIcon={<FilterIcon />} onClick={() => setIsFilterOpen((prev) => !prev)} className="h-11 px-7 font-medium">Filter</Button>
            <Dropdown isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} className="right-0 w-[280px] p-4">
              <div className="space-y-3">
                <Label>Status</Label>
                <Select options={[{ value: "manual-approved", label: "Manual + Approved" }]} value="manual-approved" onChange={() => undefined} />
              </div>
            </Dropdown>
          </div>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto border-t border-gray-100 dark:border-white/[0.05]">
        <div className="min-w-[1120px]">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className={headerCellClassName}>#</TableCell>
                <TableCell isHeader className={headerCellClassName}>Blog</TableCell>
                <TableCell isHeader className={headerCellClassName}>Customer</TableCell>
                <TableCell isHeader className={headerCellClassName}>Comment</TableCell>
                <TableCell isHeader className={headerCellClassName}>Status</TableCell>
                <TableCell isHeader className="px-5 py-3 text-center text-theme-xs font-medium text-gray-500 dark:text-gray-400">Reply</TableCell>
                <TableCell isHeader className="px-5 py-3 text-center text-theme-xs font-medium text-gray-500 dark:text-gray-400">Action</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {isLoading && <TableRow><TableCell colSpan={7} className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">Loading review list...</TableCell></TableRow>}
              {!isLoading && items.length === 0 && <TableRow><TableCell colSpan={7} className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">No reviews found.</TableCell></TableRow>}

              {items.map((review, index) => {
                const flattenedReplies = flattenReplies(review.replies);
                const repliesCount = flattenedReplies.length;
                const isExpanded = !!expandedReviews[review.reviewBlogId];
                const reviewCanReply = review.moderationStatus === "Approved" && !review.isHidden && review.status !== "Hidden";
                const reviewTone = getRoleTone(review.accountName);

                return (
                  <Fragment key={`thread-${review.reviewBlogId}`}>
                    <TableRow key={`review-${review.reviewBlogId}`} className="align-top">
                      <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">{(pageNumber - 1) * pageSize + index + 1}</TableCell>
                      <TableCell className="px-5 py-4">
                        <div className="max-w-[220px]">
                          <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90" title={review.blogTitle}>{review.blogTitle}</p>
                          <p className="text-xs text-gray-500">{toDateTimeText(review.createdAt)}</p>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${reviewTone.avatar}`}>{getInitials(review.accountName)}</div>
                          <div className="min-w-0">
                            <p className="truncate text-sm text-gray-800 dark:text-gray-200" title={review.accountName}>{review.accountName}</p>
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${reviewTone.badge}`}>{reviewTone.label}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">
                        <p className="line-clamp-2 max-w-[620px] text-sm text-gray-600 dark:text-gray-300" title={review.comment}>{review.comment}</p>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-start">{getStatusBadge(review.moderationStatus)}</TableCell>
                      <TableCell className="px-5 py-4 text-center">
                        {repliesCount > 0 ? (
                          <button
                            type="button"
                            onClick={() => setExpandedReviews((prev) => ({ ...prev, [review.reviewBlogId]: !prev[review.reviewBlogId] }))}
                            className="inline-flex items-center justify-center gap-1 rounded-md px-2 py-1 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-brand-500 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-brand-400"
                          >
                            <span>{repliesCount}</span>
                            <ChevronDownIcon className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </button>
                        ) : (
                          <span className="text-sm text-gray-400">0</span>
                        )}
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setEditTarget({
                                kind: "review",
                                reviewBlogId: review.reviewBlogId,
                                comment: review.comment,
                                moderationStatus: review.moderationStatus,
                                banReasonId: review.banReasonId,
                                accountRoleName: review.accountRoleName,
                              });
                              setEditStatus(review.moderationStatus);
                              setSelectedBanReasonId(review.banReasonId ?? "");
                            }}
                            className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-gray-700 dark:text-gray-300"
                            title="Edit"
                            aria-label="Edit review"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            disabled={!reviewCanReply}
                            onClick={() => setReplyTarget({ reviewBlogId: review.reviewBlogId, replyToAccountId: review.accountId, replyToAccountName: review.accountName })}
                            className="h-9 rounded-md border border-brand-500 px-3 text-xs font-semibold text-brand-600 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Reply
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {isExpanded && flattenedReplies.map(({ item: reply, depth }) => {
                      const replyTone = getRoleTone(reply.accountName);
                      const canReply = reply.moderationStatus === "Approved" && reply.status !== "Hidden" && !reply.isHidden;
                      const indentPx = Math.min(depth, 3) * 14;
                      return (
                        <TableRow key={`reply-${reply.replyBlogId}`} className="align-top">
                          <TableCell className="px-5 py-4 text-xs text-gray-400">↳</TableCell>
                          <TableCell className="px-5 py-4 text-xs text-gray-500">Reply</TableCell>
                          <TableCell className="px-3 py-3 text-start">
                            <div className="flex items-center gap-2" style={{ marginLeft: `${indentPx}px` }}>
                              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${replyTone.avatar}`}>{getInitials(reply.accountName)}</div>
                              <div className="min-w-0">
                                <p className="truncate text-sm text-gray-800 dark:text-gray-200">{reply.accountName}</p>
                                <p className="text-xs text-gray-500">{toDateTimeText(reply.createdAt)}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-3 py-3 text-start">
                            <div className="max-w-[700px]" style={{ marginLeft: `${indentPx}px` }}>
                              <p className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-700 dark:text-gray-200">{reply.replyToAccountName ? `Reply to ${reply.replyToAccountName}: ` : ""}{reply.comment}</p>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-start">{getStatusBadge(reply.moderationStatus)}</TableCell>
                          <TableCell className="px-5 py-4 text-center text-xs text-gray-400">-</TableCell>
                          <TableCell className="px-5 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setEditTarget({
                                    kind: "reply",
                                    replyBlogId: reply.replyBlogId,
                                    comment: reply.comment,
                                    moderationStatus: reply.moderationStatus,
                                    banReasonId: reply.banReasonId,
                                    accountRoleName: reply.accountRoleName,
                                  });
                                  setEditStatus(reply.moderationStatus);
                                  setSelectedBanReasonId(reply.banReasonId ?? "");
                                }}
                                className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-gray-700 dark:text-gray-300"
                                title="Edit"
                                aria-label="Edit reply"
                              >
                                <PencilIcon className="w-5 h-5" />
                              </button>
                              <button
                                disabled={!canReply}
                                onClick={() => setReplyTarget({ reviewBlogId: review.reviewBlogId, replyToAccountId: reply.accountId, parentReplyId: reply.replyBlogId, replyToAccountName: reply.accountName })}
                                className="h-9 rounded-md border border-brand-500 px-3 text-xs font-semibold text-brand-600 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Reply
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} className="max-w-[620px] p-5 lg:p-6">
        <div className="space-y-3">
          <h4 className="text-base font-semibold text-black dark:text-white">Edit {editTarget?.kind === "reply" ? "Reply" : "Review"}</h4>
          <p className="text-xs text-gray-600 dark:text-gray-300">{editTarget?.comment}</p>
          <Label>Moderation status</Label>
          <Select
            options={moderationStatusOptions}
            value={editStatus}
            onChange={(e) => setEditStatus(e.target.value as BlogReviewModerationStatus)}
          />
          {editStatus === "Rejected" && <>
            <Label>Reject reason</Label>
            <Select options={[{ value: "", label: "Select reason" }, ...banReasons.map((x) => ({ value: String(x.banReasonId), label: x.content }))]} value={selectedBanReasonId === "" ? "" : String(selectedBanReasonId)} onChange={(e) => setSelectedBanReasonId(e.target.value ? Number(e.target.value) : "")} />
          </>}
          <div className="flex justify-end gap-2">
            <button onClick={() => setEditTarget(null)} className="rounded border px-3 py-1 text-xs text-black dark:text-white">Cancel</button>
            <button onClick={() => editTarget && void changeModerationStatus(editTarget, editStatus, editStatus === "Rejected" ? Number(selectedBanReasonId) : undefined)} disabled={(editStatus === "Rejected" && selectedBanReasonId === "") || isRejectUnauthorized} className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white disabled:opacity-50">Save</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!replyTarget} onClose={closeReplyModal} className="max-w-[620px] p-5 lg:p-6">
        <div className="space-y-3">
          <h4 className="text-base font-semibold text-black dark:text-white">Reply to review</h4>
          {replyTarget?.replyToAccountName && <p className="text-xs text-gray-600 dark:text-gray-300">Replying to <span className="font-semibold text-black dark:text-white">{replyTarget.replyToAccountName}</span></p>}
          <TextArea value={replyText} onChange={(e) => setReplyText(e.target.value)} maxLength={500} rows={4} className="border-blue-200 dark:border-blue-400/40" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-300">{replyText.length}/500</span>
            <div className="flex gap-2">
              <button onClick={closeReplyModal} className="rounded border px-3 py-1 text-xs text-black dark:text-white">Cancel</button>
              <button onClick={() => void submitReply()} disabled={!replyText.trim()} className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white disabled:opacity-50">Send reply</button>
            </div>
          </div>
        </div>
      </Modal>

      <div className="flex flex-col items-start justify-between gap-4 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center dark:border-white/[0.05]">
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400"><span>{pageRangeText}</span><label htmlFor="blog-review-page-size" className="font-medium">Rows per page</label><select id="blog-review-page-size" className="rounded-md border border-gray-300 px-2 py-1 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPageNumber(1); }}><option value={5}>5</option><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select></div>
        {totalPages > 0 && <Pagination currentPage={pageNumber} totalPages={totalPages} onPageChange={setPageNumber} />}
      </div>
    </div>
  );
}

