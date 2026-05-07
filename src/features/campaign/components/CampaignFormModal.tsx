import React, { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import TextArea from "@/components/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { CampaignFormData, CampaignFormSchema } from "../types/campaign.schema";
import { campaignApi } from "../services/campaign-api";
import { templateApi } from "@/features/template/services/template-api";
import { Template } from "@/features/template/types/template";
import { Campaign, ReferenceTypeInfo } from "../types/campaign";
import { useAuthContext } from "@/context/AuthContext";

export type CampaignModalMode = "create" | "edit" | "detail";

interface CampaignFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: CampaignFormData) => void;
  campaignId?: number | null;
  mode?: CampaignModalMode;
  isSubmitting?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getDefaultValues = (accountId: number): CampaignFormData => ({
  campaignName: "",
  templateCode: "",
  referenceType: "",
  referenceId: null,
  titleOverride: "",
  messageOverride: "",
  sourceType: "ADMIN",
  targetType: "ALL",
  scheduledAt: "",
  eventKey: "",
  imageUrl: "",
  actionType: "",
  actionTarget: "",
  createdByAccountId: accountId,
  targets: [],
});

const getStatusBadge = (status: string) => {
  switch (status?.toLowerCase()) {
    case "draft": return <Badge color="warning">Draft</Badge>;
    case "sent": return <Badge color="success">Sent</Badge>;
    case "sending": return <Badge color="info">Sending</Badge>;
    case "scheduled": return <Badge color="info">Scheduled</Badge>;
    case "cancelled": return <Badge color="error">Cancelled</Badge>;
    case "failed": return <Badge color="error">Failed</Badge>;
    default: return <Badge color="light">{status}</Badge>;
  }
};

// ─── Component ────────────────────────────────────────────────────────────────

export const CampaignFormModal: React.FC<CampaignFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  campaignId,
  mode = "create",
  isSubmitting = false,
}) => {
  const { account } = useAuthContext();
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fullCampaign, setFullCampaign] = useState<Campaign | null>(null);
  const [activeTemplates, setActiveTemplates] = useState<Template[]>([]);
  const [referenceTypes, setReferenceTypes] = useState<ReferenceTypeInfo[]>([]);

  const isEditMode = mode === "edit";
  const isDetailMode = mode === "detail";
  const isReadOnly = isDetailMode;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    setValue,
    formState: { errors },
  } = useForm<CampaignFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(CampaignFormSchema) as any,
    defaultValues: getDefaultValues(account?.accountId ?? 0),
    mode: "onTouched",
  });

  // Dynamic targets list (only used when targetType === "ROLE" or "INDIVIDUAL")
  const { fields: targetFields, append: appendTarget, remove: removeTarget } = useFieldArray({
    control,
    name: "targets",
  });

  const watchedTargetType = watch("targetType");
  const watchedSourceType = watch("sourceType");
  const watchedActionType = watch("actionType");
  const watchedTitle = watch("titleOverride");
  const watchedMessage = watch("messageOverride");

  useEffect(() => {
    setIsMounted(true);

    // Fetch active templates for dropdown
    templateApi.getTemplates(1, 100, undefined, false, undefined, true)
      .then(res => setActiveTemplates(res.items))
      .catch(() => console.log("Failed to load templates"));

    // Fetch reference types
    campaignApi.getReferenceTypes()
      .then(res => setReferenceTypes(res))
      .catch(() => console.log("Failed to load reference types"));
  }, []);

  // When targetType switches to ALL, clear all targets automatically
  useEffect(() => {
    if (watchedTargetType === "ALL") {
      setValue("targets", []);
    }
  }, [watchedTargetType, setValue]);

  // Load data when modal opens in edit/detail mode
  useEffect(() => {
    if (!isOpen) return;

    if ((isEditMode || isDetailMode) && campaignId) {
      const fetchCampaign = async () => {
        setIsLoading(true);
        try {
          const data = await campaignApi.getCampaignById(campaignId);
          setFullCampaign(data);
          reset({
            campaignName: data.campaignName,
            templateCode: data.templateCode || "",
            referenceType: data.referenceType || "",
            referenceId: data.referenceId || null,
            titleOverride: data.titleOverride || "",
            messageOverride: data.messageOverride || "",
            sourceType: data.sourceType as "ADMIN" | "SYSTEM",
            targetType: data.targetType as "ALL" | "ROLE" | "INDIVIDUAL",
            scheduledAt: (() => {
              if (!data.scheduledAt) return "";
              const scheduled = new Date(data.scheduledAt);
              const now = new Date();
              // Nếu scheduledAt đã qua → đây là "gửi ngay", để trống field
              if (scheduled <= now) return "";
              return scheduled.toISOString().slice(0, 16);
            })(),
            eventKey: data.eventKey || "",
            imageUrl: data.imageUrl || "",
            actionType: data.actionType || "",
            actionTarget: data.actionTarget || "",
            createdByAccountId: data.createdByAccountId,
            targets: data.targets.map((t) => ({
              targetType: t.targetType as "ACCOUNT_ID" | "ROLE_ID",
              targetValue: t.targetValue,
            })),
          });
        } catch {
          toast.error("Error loading campaign information");
          onClose();
        } finally {
          setIsLoading(false);
        }
      };
      fetchCampaign();
    } else {
      setFullCampaign(null);
      reset(getDefaultValues(account?.accountId ?? 0));
    }
  }, [isOpen, campaignId, isEditMode, isDetailMode, reset, onClose, account]);

  if (!isMounted) return null;

  const onFormSubmit = (data: CampaignFormData) => {
    if (isReadOnly) return;
    const payload: CampaignFormData = {
      ...data,
      scheduledAt: data.scheduledAt || null,
      templateCode: data.templateCode || null,
      referenceType: data.referenceType || null,
      referenceId: data.referenceId || null,
      titleOverride: data.titleOverride || null,
      messageOverride: data.messageOverride || null,
      imageUrl: data.imageUrl || null,
      actionType: data.actionType || null,
      actionTarget: data.actionTarget || null,
      // Only send targets for ROLE or INDIVIDUAL, otherwise send empty array
      targets:
        data.targetType === "ROLE" || data.targetType === "INDIVIDUAL"
          ? data.targets ?? []
          : [],
    };
    onSave?.(payload);
  };

  const title = isDetailMode ? "Campaign Details" : isEditMode ? "Edit Campaign" : "Add New Campaign";
  const description = isDetailMode
    ? "Viewing campaign detailed information."
    : isEditMode
      ? "Update the campaign information."
      : "Fill in the details to create a new campaign.";

  // Min datetime for scheduledAt (now + 1 min)
  const minScheduled = new Date(Date.now() + 60_000).toISOString().slice(0, 16);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[900px] p-6 lg:p-10">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="mb-8 pr-10">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">{title}</h2>
          {isDetailMode && fullCampaign && (
            <div className="flex-shrink-0">{getStatusBadge(fullCampaign.status)}</div>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
      </div>

      {isLoading ? (
        <div className="py-10 text-center text-gray-500">Loading campaign details...</div>
      ) : (
        <form
          className="flex flex-col gap-6 max-h-[65vh] overflow-y-auto pr-3"
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onSubmit={handleSubmit(onFormSubmit as any)}
        >
          {/* ── Section 1: Basic ──────────────────────────────── */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-4">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <Label>Campaign Name <span className="text-error-500">*</span></Label>
                <Input
                  type="text"
                  placeholder="e.g. Summer Holiday Sale"
                  maxLength={255}
                  error={!!errors.campaignName}
                  hint={errors.campaignName?.message}
                  disabled={isReadOnly}
                  {...register("campaignName")}
                />
              </div>

              <div>
                <Label>Source Type <span className="text-error-500">*</span></Label>
                <Select
                  options={[
                    { value: "ADMIN", label: "Manual Creation (Admin)" },
                    { value: "SYSTEM", label: "Auto Send (System)" },
                  ]}
                  error={!!errors.sourceType}
                  hint={errors.sourceType?.message || "Admin: Send now or scheduled. System: Auto send on event."}
                  disabled={isReadOnly}
                  {...register("sourceType")}
                />
              </div>

              <div>
                <Label>Reference Type</Label>
                <Select
                  options={[
                    { value: "", label: "-- No object attached --" },
                    ...referenceTypes.map(rt => ({
                      value: rt.referenceType,
                      label: rt.displayName
                    }))
                  ]}
                  error={!!errors.referenceType}
                  hint={errors.referenceType?.message || "Data type linked with this campaign."}
                  disabled={isReadOnly}
                  {...register("referenceType")}
                />
              </div>

              <div>
                <Label>Reference ID</Label>
                <Input
                  type="number"
                  placeholder="Ex: 123"
                  error={!!errors.referenceId}
                  hint={errors.referenceId?.message || "ID of the corresponding object."}
                  disabled={isReadOnly}
                  {...register("referenceId")}
                />
              </div>

              <div>
                <Label>Scheduled Date</Label>
                <Input
                  type="datetime-local"
                  min={!isReadOnly ? minScheduled : undefined}
                  error={!!errors.scheduledAt}
                  hint={errors.scheduledAt?.message || "Leave blank to send immediately (for Admin)."}
                  disabled={isReadOnly}
                  {...register("scheduledAt")}
                />
              </div>

              {watchedSourceType === "SYSTEM" && (
                <div>
                  <Label>Event Key</Label>
                  <Input
                    type="text"
                    placeholder="Ex: ORDER_PLACED"
                    maxLength={100}
                    error={!!errors.eventKey}
                    hint={errors.eventKey?.message || "System event to auto trigger this campaign."}
                    disabled={isReadOnly}
                    {...register("eventKey")}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="h-px w-full bg-gray-100 dark:bg-gray-800" />

          {/* ── Section 2: Targeting ──────────────────────────── */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-4">
              Audience Targeting
            </h3>

            <div className="mb-5">
              <Label>Target Type <span className="text-error-500">*</span></Label>
              <Select
                options={[
                  { value: "ALL", label: "Send to All Accounts (ALL)" },
                  { value: "ROLE", label: "Send by User Role (ROLE)" },
                  { value: "INDIVIDUAL", label: "Send to Specific Customers (INDIVIDUAL)" },
                ]}
                error={!!errors.targetType}
                hint={errors.targetType?.message || "ALL: only send to active accounts (excluding locked/inactive ones)."}
                disabled={isReadOnly}
                {...register("targetType")}
              />
            </div>

            {/* Dynamic Targets — only shown when ROLE or INDIVIDUAL */}
            {(watchedTargetType === "ROLE" || watchedTargetType === "INDIVIDUAL") && (
              <div className="rounded-xl border border-brand-100 dark:border-gray-700 bg-brand-50/40 dark:bg-gray-800/40 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Target List
                    {errors.targets && !Array.isArray(errors.targets) && (
                      <span className="ml-2 text-error-500 font-normal">
                        — {errors.targets.message}
                      </span>
                    )}
                  </p>
                  {!isReadOnly && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => appendTarget({
                        targetType: watchedTargetType === "ROLE" ? "ROLE_ID" : "ACCOUNT_ID",
                        targetValue: "",
                      })}
                    >
                      + Add Target
                    </Button>
                  )}
                </div>

                {targetFields.length === 0 ? (
                  <p className="text-sm text-gray-400 italic text-center py-3">
                    No targets added. Click "Add Target" to add one.
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {targetFields.map((field, index) => (
                      <div
                        key={field.id}
                        className="flex items-start gap-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-3"
                      >
                        <div className="w-44 flex-shrink-0">
                          <Select
                            options={[
                              ...(watchedTargetType === "ROLE"
                                ? [{ value: "ROLE_ID", label: "Role ID" }]
                                : [{ value: "ACCOUNT_ID", label: "Account ID" }]),
                            ]}
                            disabled={isReadOnly}
                            error={!!errors.targets?.[index]?.targetType}
                            {...register(`targets.${index}.targetType`)}
                          />
                          {errors.targets?.[index]?.targetType && (
                            <p className="text-xs text-error-500 mt-1">
                              {errors.targets[index]?.targetType?.message}
                            </p>
                          )}
                        </div>
                        <div className="flex-1">
                          <Input
                            type="text"
                            placeholder={
                              watchedTargetType === "ROLE"
                                ? "Ex: 2 (Role ID)"
                                : "Ex: 123 (Account ID)"
                            }
                            maxLength={200}
                            disabled={isReadOnly}
                            error={!!errors.targets?.[index]?.targetValue}
                            hint={errors.targets?.[index]?.targetValue?.message}
                            {...register(`targets.${index}.targetValue`)}
                          />
                        </div>
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => removeTarget(index)}
                            className="mt-1 p-1.5 text-gray-400 hover:text-error-500 hover:bg-error-50 rounded-md transition-colors flex-shrink-0"
                            title="Remove target"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="h-px w-full bg-gray-100 dark:bg-gray-800" />

          {/* ── Section 3: Messaging ──────────────────────────── */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-4">
              Messaging Configuration
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <Label>Template</Label>
                <Select
                  options={[
                    { value: "", label: "-- No Template --" },
                    ...(isDetailMode && fullCampaign?.templateCode && !activeTemplates.find(t => t.templateCode === fullCampaign.templateCode)
                      ? [{ value: fullCampaign.templateCode, label: `${fullCampaign.templateCode} (Inactive/Deleted)` }]
                      : []),
                    ...activeTemplates.map(t => ({
                      value: t.templateCode,
                      label: `${t.templateCode} - ${t.titleTemplate}`
                    }))
                  ]}
                  error={!!errors.templateCode}
                  hint={errors.templateCode?.message || "Select a predefined notification template."}
                  disabled={isReadOnly}
                  {...register("templateCode")}
                />
              </div>

              <div>
                <Label className="flex justify-between w-full">
                  <span>Title Override</span>
                  <span className="text-[10px] text-gray-400 font-normal">{(watchedTitle || "").length}/255</span>
                </Label>
                <Input
                  type="text"
                  placeholder="Notification title..."
                  maxLength={255}
                  error={!!errors.titleOverride}
                  hint={errors.titleOverride?.message || "Will override Template title (if any)."}
                  disabled={isReadOnly}
                  {...register("titleOverride")}
                />
              </div>

              <div className="sm:col-span-2">
                <Label className="flex justify-between w-full">
                  <span>Message Override</span>
                  <span className="text-[10px] text-gray-400 font-normal">{(watchedMessage || "").length}/500</span>
                </Label>
                <TextArea
                  placeholder="Detailed notification content sent to customers..."
                  rows={4}
                  maxLength={500}
                  error={!!errors.messageOverride}
                  hint={errors.messageOverride?.message || "Will override Template content (if any)."}
                  readOnly={isReadOnly}
                  {...register("messageOverride")}
                />
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-gray-100 dark:bg-gray-800" />

          {/* ── Section 4: Action & Display ───────────────────── */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-4">
              Action &amp; Display
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <Label>Banner / Image URL</Label>
                <Input
                  type="text"
                  placeholder="https://example.com/banner.png"
                  maxLength={500}
                  error={!!errors.imageUrl}
                  hint={errors.imageUrl?.message || "Image URL displayed with notification (optional)."}
                  disabled={isReadOnly}
                  {...register("imageUrl")}
                />
              </div>

              <div>
                <Label>Action Type</Label>
                <Select
                  options={[
                    { value: "", label: "-- No action --" },
                    { value: "OPEN_URL", label: "Open web link (OPEN_URL)" },
                    { value: "OPEN_APP", label: "Open app (OPEN_APP)" },
                    { value: "VOUCHER", label: "View Voucher (VOUCHER)" },
                    { value: "PRODUCT", label: "View Product (PRODUCT)" },
                  ]}
                  error={!!errors.actionType}
                  hint={errors.actionType?.message || "Action when customer clicks the notification."}
                  disabled={isReadOnly}
                  {...register("actionType")}
                />
              </div>

              <div>
                <Label>Action Target</Label>
                <Input
                  type="text"
                  placeholder={
                    watchedActionType === "OPEN_URL" ? "Enter web link (Ex: https://...)" :
                      watchedActionType === "VOUCHER" ? "Enter Voucher code (Ex: TET2026)" :
                        watchedActionType === "PRODUCT" ? "Enter Product ID (Ex: 123)" :
                          "Ex: Voucher Code, URL..."
                  }
                  maxLength={500}
                  error={!!errors.actionTarget}
                  hint={errors.actionTarget?.message || "Value corresponding to the Action Type."}
                  disabled={isReadOnly}
                  {...register("actionTarget")}
                />
              </div>
            </div>
          </div>

          {/* ── Section 5: Detail-only Stats & Meta ───────────── */}
          {isDetailMode && fullCampaign && (
            <>
              <div className="h-px w-full bg-gray-100 dark:bg-gray-800" />
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-4">
                  Delivery Statistics
                </h3>
                {fullCampaign.stat ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { label: "Total Sent", value: fullCampaign.stat.totalSent },
                      { label: "Total Read", value: fullCampaign.stat.totalRead },
                      { label: "Total Clicked", value: fullCampaign.stat.totalClicked },
                    ].map((s) => (
                      <div key={s.label} className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">No statistics available yet.</p>
                )}
              </div>

              {fullCampaign.targets.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-3">
                    Campaign Targets
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {fullCampaign.targets.map((t) => (
                      <span
                        key={t.campaignTargetId}
                        className="text-xs px-3 py-1 rounded-full bg-brand-50 dark:bg-gray-700 border border-brand-100 dark:border-gray-600 text-brand-600 dark:text-brand-400"
                      >
                        {t.targetType}: <strong>{t.targetValue}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {fullCampaign.resolvedReference && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-3">
                    Resolved Reference
                  </h3>
                  <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>Name:</strong> {fullCampaign.resolvedReference.displayName || "N/A"}
                    </p>
                    {Object.entries(fullCampaign.resolvedReference.placeholders || {}).length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1">Placeholders:</p>
                        <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc list-inside">
                          {Object.entries(fullCampaign.resolvedReference.placeholders).map(([key, value]) => (
                            <li key={key}><strong>{key}</strong>: {value as React.ReactNode}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
                <span>Created: <strong className="text-gray-700 dark:text-gray-300">{new Date(fullCampaign.createdAt).toLocaleString("en-US")}</strong></span>
                {fullCampaign.updatedAt && (
                  <span>Updated: <strong className="text-gray-700 dark:text-gray-300">{new Date(fullCampaign.updatedAt).toLocaleString("en-US")}</strong></span>
                )}
              </div>
            </>
          )}

          {/* ── Footer ────────────────────────────────────────── */}
          <div className="flex items-center gap-3 justify-end mt-2 pt-6 border-t border-gray-100 dark:border-gray-800">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              {isReadOnly ? "Close" : "Cancel"}
            </Button>
            {!isReadOnly && (
              <Button variant="primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : isEditMode ? "Update Campaign" : "Create Campaign"}
              </Button>
            )}
          </div>
        </form>
      )}
    </Modal>
  );
};