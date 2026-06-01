"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Checkbox from "@/components/form/input/Checkbox";
import {
  InventoryReportDateField,
  InventoryReportFormat,
  InventoryReportRequest,
  ProductLookupsResponse,
  ProductSortBy,
} from "../types/product";
import { productApi } from "../services/product-api";

interface ProductExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  lookups: ProductLookupsResponse | null;
  isLoadingLookups: boolean;
  currentFilters: {
    searchTerm: string;
    sortBy: ProductSortBy;
    sortDesc: boolean;
    status: string;
    categoryId: number | null;
    brandId: number | null;
  };
}

const DEFAULT_FILTERS = {
  searchTerm: "",
  status: "all",
  categoryId: null as number | null,
  brandId: null as number | null,
  priceRangeId: null as number | null,
  materialId: null as number | null,
  ageId: null as number | null,
  originId: null as number | null,
  lowStockOnly: false,
  dateFrom: "",
  dateTo: "",
  dateField: "createdat" as InventoryReportDateField,
};

const ProductExportReportModal = ({
  isOpen,
  onClose,
  lookups,
  isLoadingLookups,
  currentFilters,
}: ProductExportReportModalProps) => {
  const [mode, setMode] = useState<"current" | "custom">("current");
  const [format, setFormat] = useState<InventoryReportFormat>("pdf");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setMode("current");
    setFormat("pdf");
    setFilters(DEFAULT_FILTERS);
    setPreviewUrl(null);
  }, [isOpen]);

  useEffect(() => {
    if (format !== "pdf" && previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [format, previewUrl]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const categoryOptions = useMemo(
    () =>
      [
        { value: "all", label: "All" },
        ...(lookups?.categories.map((category) => ({
          value: String(category.id),
          label: category.label,
        })) ?? []),
      ],
    [lookups?.categories],
  );

  const brandOptions = useMemo(
    () =>
      [
        { value: "all", label: "All" },
        ...(lookups?.brands.map((brand) => ({
          value: String(brand.id),
          label: brand.label,
        })) ?? []),
      ],
    [lookups?.brands],
  );

  const priceRangeOptions = useMemo(
    () =>
      [
        { value: "all", label: "All" },
        ...(lookups?.priceRanges.map((range) => ({
          value: String(range.id),
          label: range.label,
        })) ?? []),
      ],
    [lookups?.priceRanges],
  );

  const materialOptions = useMemo(
    () =>
      [
        { value: "all", label: "All" },
        ...(lookups?.materials.map((material) => ({
          value: String(material.id),
          label: material.label,
        })) ?? []),
      ],
    [lookups?.materials],
  );

  const ageOptions = useMemo(
    () =>
      [
        { value: "all", label: "All" },
        ...(lookups?.ages.map((age) => ({
          value: String(age.id),
          label: age.label,
        })) ?? []),
      ],
    [lookups?.ages],
  );

  const originOptions = useMemo(
    () =>
      [
        { value: "all", label: "All" },
        ...(lookups?.origins.map((origin) => ({
          value: String(origin.id),
          label: origin.label,
        })) ?? []),
      ],
    [lookups?.origins],
  );

  const buildRequest = (overrideFormat?: InventoryReportFormat): InventoryReportRequest => {
    if (mode === "current") {
      return {
        format: overrideFormat ?? format,
        searchTerm: currentFilters.searchTerm || undefined,
        sortBy: currentFilters.sortBy,
        sortDesc: currentFilters.sortDesc,
        status: currentFilters.status || undefined,
        categoryId: currentFilters.categoryId ?? undefined,
        brandId: currentFilters.brandId ?? undefined,
      };
    }

    return {
      format: overrideFormat ?? format,
      searchTerm: filters.searchTerm || undefined,
      status: filters.status && filters.status !== "all" ? filters.status : undefined,
      categoryId: filters.categoryId ?? undefined,
      brandId: filters.brandId ?? undefined,
      priceRangeId: filters.priceRangeId ?? undefined,
      materialId: filters.materialId ?? undefined,
      ageId: filters.ageId ?? undefined,
      originId: filters.originId ?? undefined,
      lowStockOnly: filters.lowStockOnly,
      dateField: filters.dateField,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      sortBy: currentFilters.sortBy,
      sortDesc: currentFilters.sortDesc,
    };
  };

  const resolveExportError = async (error: unknown): Promise<string> => {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data;
      if (data instanceof Blob) {
        try {
          const text = await data.text();
          const parsed = JSON.parse(text) as { message?: string };
          return parsed.message ?? "Export failed";
        } catch {
          return "Export failed";
        }
      }

      return (data as { message?: string } | undefined)?.message ?? "Export failed";
    }

    return "Export failed";
  };

  const handlePreview = async () => {
    if (format !== "pdf") {
      toast.error("PDF preview is available only for PDF export.");
      return;
    }

    setIsPreviewLoading(true);
    try {
      const blob = await productApi.exportInventoryReport(buildRequest("pdf"));
      const url = URL.createObjectURL(blob);
      setPreviewUrl((prev) => {
        if (prev) {
          URL.revokeObjectURL(prev);
        }
        return url;
      });
    } catch (error) {
      const message = await resolveExportError(error);
      toast.error(message);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await productApi.exportInventoryReport(buildRequest());
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      link.href = url;
      link.download = `product-quantity-report-${timestamp}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Report exported successfully");
    } catch (error) {
      const message = await resolveExportError(error);
      toast.error(message);
    } finally {
      setIsExporting(false);
    }
  };

  const isCustomMode = mode === "custom";
  const isDisabled = isLoadingLookups || isPreviewLoading || isExporting;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-h-[90vh] w-full max-w-6xl overflow-y-auto overflow-x-hidden p-0"
    >
      <div className="border-b border-gray-200 px-6 py-4 sm:px-8 dark:border-white/[0.05]">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Export Product Quantity Report</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Generate a professional product quantity report with the filters you need.
        </p>
      </div>

      <div className="grid min-w-0 gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-5">
          <div>
            <Label>Export mode</Label>
            <Select
              options={[
                { value: "current", label: "Use current product filters" },
                { value: "custom", label: "Use custom report filters" },
              ]}
              value={mode}
              onChange={(e) => setMode(e.target.value as "current" | "custom")}
            />
          </div>

          <div>
            <Label>Format</Label>
            <Select
              options={[
                { value: "pdf", label: "PDF (preview supported)" },
                { value: "xlsx", label: "Excel (.xlsx)" },
                { value: "csv", label: "CSV" },
              ]}
              value={format}
              onChange={(e) => setFormat(e.target.value as InventoryReportFormat)}
            />
          </div>

          <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-500 dark:border-white/[0.05] dark:text-gray-400">
            <p className="font-medium text-gray-700 dark:text-gray-200">Current filters</p>
            <ul className="mt-2 space-y-1">
              <li>Search: {currentFilters.searchTerm || "All"}</li>
              <li>Status: {currentFilters.status || "All"}</li>
              <li>Category: {currentFilters.categoryId ?? "All"}</li>
              <li>Brand: {currentFilters.brandId ?? "All"}</li>
            </ul>
          </div>

          <div className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-white/[0.05]">
            <div className="flex items-center justify-between">
              <p className="font-medium text-gray-700 dark:text-gray-200">Custom filters</p>
              <Checkbox
                label="Enable"
                checked={isCustomMode}
                onChange={(checked) => setMode(checked ? "custom" : "current")}
              />
            </div>

            <div className={isCustomMode ? "space-y-4" : "space-y-4 opacity-50"}>
              <div>
                <Label>Search term</Label>
                <Input
                  value={filters.searchTerm}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, searchTerm: e.target.value }))
                  }
                  disabled={!isCustomMode}
                />
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  options={[
                    { value: "all", label: "All" },
                    { value: "Active", label: "Active" },
                    { value: "Inactive", label: "Inactive" },
                    { value: "OutOfStock", label: "Out of Stock" },
                    { value: "Discontinued", label: "Discontinued" },
                    { value: "ComingSoon", label: "Coming Soon" },
                  ]}
                  value={filters.status}
                  onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                  disabled={!isCustomMode}
                />
              </div>

              <div>
                <Label>Category</Label>
                <Select
                  options={categoryOptions}
                  value={filters.categoryId ? String(filters.categoryId) : "all"}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      categoryId: e.target.value === "all" ? null : Number(e.target.value),
                    }))
                  }
                  placeholder="All categories"
                  disabled={!isCustomMode}
                />
              </div>

              <div>
                <Label>Brand</Label>
                <Select
                  options={brandOptions}
                  value={filters.brandId ? String(filters.brandId) : "all"}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      brandId: e.target.value === "all" ? null : Number(e.target.value),
                    }))
                  }
                  placeholder="All brands"
                  disabled={!isCustomMode}
                />
              </div>

              <div>
                <Label>Price range</Label>
                <Select
                  options={priceRangeOptions}
                  value={filters.priceRangeId ? String(filters.priceRangeId) : "all"}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      priceRangeId: e.target.value === "all" ? null : Number(e.target.value),
                    }))
                  }
                  placeholder="All price ranges"
                  disabled={!isCustomMode}
                />
              </div>

              <div>
                <Label>Material</Label>
                <Select
                  options={materialOptions}
                  value={filters.materialId ? String(filters.materialId) : "all"}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      materialId: e.target.value === "all" ? null : Number(e.target.value),
                    }))
                  }
                  placeholder="All materials"
                  disabled={!isCustomMode}
                />
              </div>

              <div>
                <Label>Age range</Label>
                <Select
                  options={ageOptions}
                  value={filters.ageId ? String(filters.ageId) : "all"}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      ageId: e.target.value === "all" ? null : Number(e.target.value),
                    }))
                  }
                  placeholder="All age ranges"
                  disabled={!isCustomMode}
                />
              </div>

              <div>
                <Label>Origin</Label>
                <Select
                  options={originOptions}
                  value={filters.originId ? String(filters.originId) : "all"}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      originId: e.target.value === "all" ? null : Number(e.target.value),
                    }))
                  }
                  placeholder="All origins"
                  disabled={!isCustomMode}
                />
              </div>

              <div>
                <Label>Date field</Label>
                <Select
                  options={[
                    { value: "createdat", label: "Created date" },
                    { value: "updatedat", label: "Updated date" },
                  ]}
                  value={filters.dateField}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      dateField: e.target.value as InventoryReportDateField,
                    }))
                  }
                  disabled={!isCustomMode}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Date from</Label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))
                    }
                    disabled={!isCustomMode}
                  />
                </div>
                <div>
                  <Label>Date to</Label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, dateTo: e.target.value }))
                    }
                    disabled={!isCustomMode}
                  />
                </div>
              </div>

              <Checkbox
                label="Low stock only"
                checked={filters.lowStockOnly}
                onChange={(checked) =>
                  setFilters((prev) => ({ ...prev, lowStockOnly: checked }))
                }
                disabled={!isCustomMode}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={handlePreview}
              disabled={isDisabled || format !== "pdf"}
            >
              {isPreviewLoading ? "Generating..." : "Preview PDF"}
            </Button>
            <Button onClick={handleExport} disabled={isDisabled}>
              {isExporting ? "Exporting..." : "Export"}
            </Button>
          </div>
        </div>

        <div className="min-w-0 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-white/[0.05] dark:bg-gray-900">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">PDF Preview</h3>
            {format !== "pdf" && (
              <span className="text-xs text-gray-500">Preview available for PDF only</span>
            )}
          </div>

          <div className="mt-4 min-h-[200px] h-[min(540px,calc(90vh-18rem))] overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-gray-950">
            {previewUrl ? (
              <iframe
                title="Product quantity report preview"
                src={previewUrl}
                className="h-full w-full"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                {isPreviewLoading ? "Generating preview..." : "Click Preview PDF to generate a preview."}
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ProductExportReportModal;
