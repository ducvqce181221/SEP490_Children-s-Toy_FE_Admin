import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type Quill from "quill";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import {
  getDescriptionStorageLength,
  MAX_DESCRIPTION_LENGTH,
  ProductFormData,
  ProductFormSchema,
} from "../types/product.schema";
import {
  ProductListItem,
  ProductMutationResult,
  ProductLookupOption,
  ProductPriceRangeLookup,
} from "../types/product";
import { categoryApi } from "@/features/category/services/category-api";
import { brandApi } from "@/features/brand/services/brand-api";
import { CategoryListItem } from "@/features/category/types/category";
import { BrandListItem } from "@/features/brand/types/brand";
import { useCloudinaryUpload } from "../hooks/useCloudinaryUpload";
import Image from "next/image";
import { productApi } from "../services/product-api";

interface ProductFormModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  product: ProductListItem | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (
    data: ProductFormData,
    id: number | null,
  ) => Promise<ProductMutationResult>;
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  mode,
  product,
  isSubmitting,
  onClose,
  onSubmit,
}) => {
  const [categories, setCategories] = useState<CategoryListItem[]>([]);
  const [brands, setBrands] = useState<BrandListItem[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [priceRanges, setPriceRanges] = useState<ProductPriceRangeLookup[]>([]);
  const [materials, setMaterials] = useState<ProductLookupOption[]>([]);
  const [ages, setAges] = useState<ProductLookupOption[]>([]);
  const [sexes, setSexes] = useState<ProductLookupOption[]>([]);
  const [origins, setOrigins] = useState<ProductLookupOption[]>([]);
  const { uploadImage, isUploading } = useCloudinaryUpload();
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const pendingDescriptionRef = useRef("");
  const isApplyingDescriptionRef = useRef(false);
  const toolbarId = `product-description-toolbar-${useId().replace(/:/g, "")}`;

  const normalizeProductStatus = (status: string | null | undefined): string => {
    if (!status) return "Active";
    const normalized = status.replace(/\s+/g, "").toLowerCase();
    if (normalized === "outofstock") return "OutOfStock";
    if (normalized === "comingsoon") return "ComingSoon";
    if (normalized === "discontinued") return "Discontinued";
    if (normalized === "inactive") return "Inactive";
    return "Active";
  };

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(ProductFormSchema),
    mode: "onSubmit", // Validate all fields on submit
    reValidateMode: "onChange", // Re-validate on change after first submit
    defaultValues: {
      productName: "",
      categoryId: 0,
      brandId: null,
      priceRangeId: null,
      price: 0,
      quantity: 0,
      productStatus: "Active",
      launchDate: null,
      stockThreshold: 10,
      lowStockNotificationEnabled: true,
      description: null,
      materialId: null,
      ageId: null,
      sexId: null,
      originId: null,
      weightGram: 1,
      lengthCm: 1,
      widthCm: 1,
      heightCm: 1,
      mainImageUrl: "",
      additionalImageUrls: [],
    },
  });

  const mainImageUrl = useWatch({ control, name: "mainImageUrl" });
  const additionalImageUrls = useWatch({ control, name: "additionalImageUrls" }) ?? [];
  const selectedCategoryId = useWatch({ control, name: "categoryId" });
  const selectedBrandId = useWatch({ control, name: "brandId" });
  const selectedPrice = useWatch({ control, name: "price" });
  const selectedPriceRangeId = useWatch({ control, name: "priceRangeId" });
  const descriptionValue = useWatch({ control, name: "description" });
  const launchDateValue = useWatch({ control, name: "launchDate" });
  const productStatusValue = useWatch({ control, name: "productStatus" });
  const quantityValue = useWatch({ control, name: "quantity" });
  const materialIdValue = useWatch({ control, name: "materialId" });
  const ageIdValue = useWatch({ control, name: "ageId" });
  const sexIdValue = useWatch({ control, name: "sexId" });
  const originIdValue = useWatch({ control, name: "originId" });
  const weightGramValue = useWatch({ control, name: "weightGram" });
  const lengthCmValue = useWatch({ control, name: "lengthCm" });
  const widthCmValue = useWatch({ control, name: "widthCm" });
  const heightCmValue = useWatch({ control, name: "heightCm" });
  const descriptionStorageLength = getDescriptionStorageLength(descriptionValue);
  const isFormDisabled = isSubmitting || isLoadingOptions || isLoadingDetail || isUploading;

  // Live status-rule hints shown below the Status dropdown before submit
  const hintToday = new Date();
  hintToday.setHours(0, 0, 0, 0);
  // Append "T00:00:00" so JS treats the date-only string as LOCAL midnight, not UTC.
  const parsedLaunchDateForHint = launchDateValue ? new Date(launchDateValue.slice(0, 10) + "T00:00:00") : null;
  const isLaunchDateFuture = parsedLaunchDateForHint !== null && parsedLaunchDateForHint > hintToday;
  const isOutOfStockWithQuantity = productStatusValue === "OutOfStock" && (quantityValue ?? 0) > 0;

  const getMatchedPriceRangeId = useCallback(
    (priceValue: number | null | undefined) => {
      if (typeof priceValue !== "number" || Number.isNaN(priceValue) || priceValue < 0) {
        return null;
      }

      const matched = priceRanges.find((range) => priceValue >= range.min && priceValue <= range.max);
      return matched?.id ?? null;
    },
    [priceRanges],
  );

  const normalizeDescriptionHtml = useCallback((rawValue: unknown) => {
    if (typeof rawValue !== "string") {
      return "";
    }

    const trimmed = rawValue.trim();
    if (trimmed.length === 0 || trimmed === "<p><br></p>") {
      return "";
    }

    return trimmed;
  }, []);

  const toDescriptionFormValue = useCallback(
    (html: string): string | null => {
      const normalizedHtml = normalizeDescriptionHtml(html);
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
    [normalizeDescriptionHtml],
  );

  const setDescriptionEditorContent = useCallback(
    (html: string) => {
      const normalizedContent = normalizeDescriptionHtml(html);
      if (!quillRef.current) {
        pendingDescriptionRef.current = normalizedContent;
        return;
      }

      isApplyingDescriptionRef.current = true;
      if (normalizedContent.length === 0) {
        quillRef.current.setText("", "api");
      } else {
        const delta = quillRef.current.clipboard.convert({ html: normalizedContent });
        quillRef.current.setContents(delta, "api");
      }

      setValue("description", toDescriptionFormValue(quillRef.current.root.innerHTML), {
        shouldValidate: true,
      });

      queueMicrotask(() => {
        isApplyingDescriptionRef.current = false;
      });
    },
    [normalizeDescriptionHtml, setValue, toDescriptionFormValue],
  );

  useEffect(() => {
    if (isOpen) {
      const fetchOptions = async () => {
        setIsLoadingOptions(true);
        try {
          const [catRes, brandRes, lookupRes] = await Promise.all([
            categoryApi.getCategories({ pageNumber: 1, pageSize: 100 }),
            brandApi.getBrands({ pageNumber: 1, pageSize: 100 }),
            productApi.getProductLookups(),
          ]);
          setCategories(catRes.items);
          setBrands(brandRes.items);
          setPriceRanges(lookupRes.priceRanges);
          setMaterials(lookupRes.materials);
          setAges(lookupRes.ages);
          setSexes(lookupRes.sexes);
          setOrigins(lookupRes.origins);
        } catch (error) {
          console.error("Failed to load options", error);
        } finally {
          setIsLoadingOptions(false);
        }
      };
      fetchOptions();
    }
  }, [isOpen]);

  useEffect(() => {
    const matchedPriceRangeId = getMatchedPriceRangeId(selectedPrice);
    if ((selectedPriceRangeId ?? null) !== matchedPriceRangeId) {
      setValue("priceRangeId", matchedPriceRangeId, { shouldValidate: true });
    }
  }, [getMatchedPriceRangeId, selectedPrice, selectedPriceRangeId, setValue]);

  useEffect(() => {
    let cancelled = false;

    const initializeDescriptionEditor = async () => {
      if (!isOpen || isLoadingDetail || !editorRef.current || quillRef.current) {
        return;
      }

      const QuillModule = await import("quill");
      if (cancelled || !editorRef.current || quillRef.current) {
        return;
      }

      const Quill = QuillModule.default;
      const quill = new Quill(editorRef.current, {
        theme: "snow",
        modules: {
          toolbar: `#${toolbarId}`,
        },
        placeholder: "Enter product description...",
      });

      quill.on("text-change", (_delta, _oldDelta, source) => {
        if (source !== "user" || isApplyingDescriptionRef.current) {
          return;
        }

        setValue("description", toDescriptionFormValue(quill.root.innerHTML), {
          shouldValidate: true,
        });
      });

      quillRef.current = quill;
      setDescriptionEditorContent(pendingDescriptionRef.current);
    };

    void initializeDescriptionEditor();

    return () => {
      cancelled = true;
    };
  }, [isLoadingDetail, isOpen, setDescriptionEditorContent, setValue, toDescriptionFormValue, toolbarId]);

  useEffect(() => {
    if (!isOpen) {
      quillRef.current = null;
      if (editorRef.current) {
        editorRef.current.innerHTML = "";
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (!quillRef.current) {
      return;
    }

    quillRef.current.enable(!isFormDisabled);
  }, [isFormDisabled]);

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && product) {
        setIsLoadingDetail(true);
        productApi.getProductById(product.productId)
          .then((detail) => {
            reset({
              productName: detail.productName,
              categoryId: detail.categoryId,
              brandId: detail.brandId,
              priceRangeId: detail.priceRangeId,
              price: detail.price,
              quantity: detail.quantity,
              productStatus: normalizeProductStatus(detail.productStatus),
              launchDate: detail.launchDate,
              stockThreshold: detail.stockThreshold,
              lowStockNotificationEnabled: detail.lowStockNotificationEnabled,
              mainImageUrl: detail.mainImageUrl || "",
              additionalImageUrls: detail.additionalImageUrls ?? [],
              description: detail.description,
              materialId: detail.materialId,
              ageId: detail.ageId,
              sexId: detail.sexId,
              originId: detail.originId,
              weightGram: detail.weightGram ?? 1,
              lengthCm: detail.lengthCm ?? 1,
              widthCm: detail.widthCm ?? 1,
              heightCm: detail.heightCm ?? 1,
            });
            pendingDescriptionRef.current = normalizeDescriptionHtml(detail.description);
            setDescriptionEditorContent(pendingDescriptionRef.current);
          })
          .catch((err) => console.error("Failed to load product details", err))
          .finally(() => setIsLoadingDetail(false));
      } else {
        reset({
          productName: "",
          categoryId: 0,
          brandId: null,
          priceRangeId: null,
          price: 0,
          quantity: 0,
          productStatus: "Active",
          launchDate: null,
          stockThreshold: 10,
          lowStockNotificationEnabled: true,
          description: null,
          materialId: null,
          ageId: null,
          sexId: null,
          originId: null,
          weightGram: 1,
          lengthCm: 1,
          widthCm: 1,
          heightCm: 1,
          mainImageUrl: "",
          additionalImageUrls: [],
        });
        pendingDescriptionRef.current = "";
        setDescriptionEditorContent("");
      }
    }
  }, [isOpen, mode, product, reset, normalizeDescriptionHtml, setDescriptionEditorContent]);

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    const formData = data as ProductFormData;
    formData.productStatus = normalizeProductStatus(formData.productStatus);
    
    // Additional validation for create mode
    if (mode === "create") {
      let hasError = false;
      
      if (!formData.mainImageUrl || formData.mainImageUrl.trim() === "") {
        setError("mainImageUrl", {
          type: "manual",
          message: "Main image is required",
        });
        hasError = true;
      }

      const additionalCount = formData.additionalImageUrls?.length ?? 0;
      if (additionalCount < 4) {
        setError("additionalImageUrls", {
          type: "manual",
          message: "At least 4 additional images are required",
        });
        hasError = true;
      } else if (additionalCount > 6) {
        setError("additionalImageUrls", {
          type: "manual",
          message: "Maximum 6 additional images allowed",
        });
        hasError = true;
      }
      
      if (hasError) return;
    }

    const id = mode === "edit" ? product?.productId ?? null : null;
    const result = await onSubmit(formData, id);

    if (!result.success && result.validationErrors) {
      Object.entries(result.validationErrors).forEach(([field, messages]) => {
        const fieldName = field.charAt(0).toLowerCase() + field.slice(1);
        setError(fieldName as keyof ProductFormData, {
          type: "server",
          message: messages[0],
        });
      });
    }
  };

  const handleFormSubmitWrapper = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Pre-validate image fields for create mode before triggering form validation
    if (mode === "create") {
      if (!mainImageUrl || mainImageUrl.trim() === "") {
        setError("mainImageUrl", {
          type: "manual",
          message: "Main image is required",
        });
      }

      const additionalCount = additionalImageUrls.length;
      if (additionalCount < 4) {
        setError("additionalImageUrls", {
          type: "manual",
          message: "At least 4 additional images are required",
        });
      } else if (additionalCount > 6) {
        setError("additionalImageUrls", {
          type: "manual",
          message: "Maximum 6 additional images allowed",
        });
      }
    }
    
    // Trigger form validation and submission
    await handleSubmit(handleFormSubmit)(e);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadImage(file);
    if (url) {
      setValue("mainImageUrl", url, { shouldValidate: true });
    }
  };

  const handleAdditionalImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const currentImages = additionalImageUrls;
    const remainingSlots = 6 - currentImages.length;
    if (remainingSlots <= 0) {
      setError("additionalImageUrls", {
        type: "manual",
        message: "Maximum 6 additional images",
      });
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    const uploadedUrls: string[] = [];
    for (const file of filesToUpload) {
      const url = await uploadImage(file);
      if (url) {
        uploadedUrls.push(url);
      }
    }

    if (uploadedUrls.length > 0) {
      setValue("additionalImageUrls", [...currentImages, ...uploadedUrls], {
        shouldValidate: true,
      });
    }
  };

  const handleRemoveAdditionalImage = (index: number) => {
    const nextImages = additionalImageUrls.filter((_, currentIndex) => currentIndex !== index);
    setValue("additionalImageUrls", nextImages, { shouldValidate: true });
  };

  const categoryOptions = [
    { value: "0", label: "Select Category..." },
    ...categories.map((c) => ({
      value: String(c.categoryId),
      label: c.categoryName,
    })),
  ];

  const brandOptions = [
    { value: "", label: "Select Brand..." },
    ...brands.map((b) => ({
      value: String(b.brandId),
      label: b.brandName,
    })),
  ];

  const priceRangeOptions = [
    { value: "", label: "None" },
    ...priceRanges.map((item) => ({
      value: String(item.id),
      label: item.label,
    })),
  ];

  const materialOptions = [
    { value: "", label: "Select Material..." },
    ...materials.map((item) => ({
      value: String(item.id),
      label: item.label,
    })),
  ];

  const ageOptions = [
    { value: "", label: "Select Age Range..." },
    ...ages.map((item) => ({
      value: String(item.id),
      label: item.label,
    })),
  ];

  const sexOptions = [
    { value: "", label: "Select Sex..." },
    ...sexes.map((item) => ({
      value: String(item.id),
      label: item.label,
    })),
  ];

  const originOptions = [
    { value: "", label: "Select Origin..." },
    ...origins.map((item) => ({
      value: String(item.id),
      label: item.label,
    })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-h-[90vh] max-w-[1150px] overflow-y-auto p-6 sm:p-8"
    >
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
          {mode === "create" ? "Add Product" : "Edit Product"}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {mode === "create"
            ? "Enter information for the new product."
            : "Update product information."}
        </p>
      </div>

      {isLoadingDetail ? (
        <div className="py-10 text-center text-gray-500">Loading product details...</div>
      ) : (
        <form onSubmit={handleFormSubmitWrapper}>
          <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="sm:col-span-2">
              <Label>
                Product Name <span className="text-error-500">*</span>
              </Label>
              <Input
                type="text"
                {...register("productName")}
                placeholder="Enter product name"
                disabled={isFormDisabled}
                error={!!errors.productName}
                hint={errors.productName?.message}
              />
            </div>

            <div>
              <Label>
                Category <span className="text-error-500">*</span>
              </Label>
              <Select
                value={String(selectedCategoryId ?? 0)}
                onChange={(e) =>
                  setValue("categoryId", Number(e.target.value), {
                    shouldValidate: true,
                  })
                }
                options={categoryOptions}
                disabled={isFormDisabled}
              />
              {errors.categoryId && (
                <p className="mt-1.5 text-sm text-error-500">
                  {errors.categoryId.message}
                </p>
              )}
            </div>

            <div>
              <Label>
                Brand <span className="text-error-500">*</span>
              </Label>
              <Select
                value={selectedBrandId === null || selectedBrandId === undefined ? "" : String(selectedBrandId)}
                onChange={(e) =>
                  setValue("brandId", e.target.value === "" ? null : Number(e.target.value), {
                    shouldValidate: true,
                  })
                }
                options={brandOptions}
                disabled={isFormDisabled}
              />
              {errors.brandId && (
                <p className="mt-1.5 text-sm text-error-500">{errors.brandId.message}</p>
              )}
            </div>

            <div>
              <Label>Price Range</Label>
              <Select
                value={selectedPriceRangeId === null || selectedPriceRangeId === undefined ? "" : String(selectedPriceRangeId)}
                options={priceRangeOptions}
                disabled
              />
              {errors.priceRangeId && (
                <p className="mt-1.5 text-sm text-error-500">{errors.priceRangeId.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Price range is auto-selected based on the entered price.
              </p>
            </div>

            <div>
              <Label>
                Price <span className="text-error-500">*</span>
              </Label>
              <Input
                type="number"
                step="any"
                {...register("price", { valueAsNumber: true })}
                placeholder="0.00"
                disabled={isFormDisabled}
                error={!!errors.price}
                hint={errors.price?.message}
              />
            </div>

            <div>
              <Label>
                Quantity <span className="text-error-500">*</span>
              </Label>
              <Input
                type="number"
                {...register("quantity", { valueAsNumber: true })}
                placeholder="0"
                disabled={isFormDisabled}
                error={!!errors.quantity}
                hint={errors.quantity?.message}
              />
            </div>

            <div>
              <Label>Status</Label>
              <Select
                {...register("productStatus")}
                options={[
                  { value: "Active", label: "Active" },
                  { value: "Inactive", label: "Inactive" },
                  { value: "OutOfStock", label: "Out of Stock" },
                  { value: "Discontinued", label: "Discontinued" },
                  { value: "ComingSoon", label: "Coming Soon" },
                ]}
                disabled={isFormDisabled}
              />
              {isLaunchDateFuture && productStatusValue !== "ComingSoon" && !errors.productStatus && (
                <p className="mt-1 text-xs text-warning-500">
                  ⚠ Launch date is in the future. Only &quot;Coming Soon&quot; status is allowed.
                </p>
              )}
              {isOutOfStockWithQuantity && !errors.productStatus && (
                <p className="mt-1 text-xs text-warning-500">
                  ⚠ Cannot set &quot;Out of Stock&quot; when quantity is greater than 0.
                </p>
              )}
              {errors.productStatus && (
                <p className="mt-1.5 text-sm text-error-500">{errors.productStatus.message}</p>
              )}
            </div>

            <div>
              <Label>Stock Threshold</Label>
              <Input
                type="number"
                {...register("stockThreshold", { valueAsNumber: true })}
                placeholder="10"
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>
                Launch Date <span className="text-error-500">*</span>
              </Label>
              <Input
                type="date"
                value={launchDateValue ? launchDateValue.slice(0, 10) : ""}
                onChange={(e) =>
                  setValue("launchDate", e.target.value === "" ? null : e.target.value, {
                    shouldValidate: true,
                  })
                }
                onKeyDown={(e) => {
                  e.preventDefault();
                }}
                onFocus={(e) => {
                  const input = e.currentTarget as HTMLInputElement & {
                    showPicker?: () => void;
                  };
                  input.showPicker?.();
                }}
                disabled={isFormDisabled}
                error={!!errors.launchDate}
                hint={errors.launchDate?.message}
              />
            </div>

            <div>
              <Label>
                Material <span className="text-error-500">*</span>
              </Label>
              <Select
                value={materialIdValue === null || materialIdValue === undefined ? "" : String(materialIdValue)}
                onChange={(e) =>
                  setValue(
                    "materialId",
                    e.target.value === "" ? null : Number(e.target.value),
                    { shouldValidate: true },
                  )
                }
                options={materialOptions}
                disabled={isFormDisabled}
              />
              {errors.materialId && (
                <p className="mt-1.5 text-sm text-error-500">{errors.materialId.message}</p>
              )}
            </div>

            <div>
              <Label>
                Age Range <span className="text-error-500">*</span>
              </Label>
              <Select
                value={ageIdValue === null || ageIdValue === undefined ? "" : String(ageIdValue)}
                onChange={(e) =>
                  setValue("ageId", e.target.value === "" ? null : Number(e.target.value), {
                    shouldValidate: true,
                  })
                }
                options={ageOptions}
                disabled={isFormDisabled}
              />
              {errors.ageId && (
                <p className="mt-1.5 text-sm text-error-500">{errors.ageId.message}</p>
              )}
            </div>

            <div>
              <Label>
                Sex <span className="text-error-500">*</span>
              </Label>
              <Select
                value={sexIdValue === null || sexIdValue === undefined ? "" : String(sexIdValue)}
                onChange={(e) =>
                  setValue("sexId", e.target.value === "" ? null : Number(e.target.value), {
                    shouldValidate: true,
                  })
                }
                options={sexOptions}
                disabled={isFormDisabled}
              />
              {errors.sexId && (
                <p className="mt-1.5 text-sm text-error-500">{errors.sexId.message}</p>
              )}
            </div>

            <div>
              <Label>
                Origin <span className="text-error-500">*</span>
              </Label>
              <Select
                value={originIdValue === null || originIdValue === undefined ? "" : String(originIdValue)}
                onChange={(e) =>
                  setValue(
                    "originId",
                    e.target.value === "" ? null : Number(e.target.value),
                    { shouldValidate: true },
                  )
                }
                options={originOptions}
                disabled={isFormDisabled}
              />
              {errors.originId && (
                <p className="mt-1.5 text-sm text-error-500">{errors.originId.message}</p>
              )}
            </div>

            <div>
              <Label>
                Weight (gram) <span className="text-error-500">*</span>
              </Label>
              <Input
                type="number"
                value={weightGramValue ?? ""}
                onChange={(e) =>
                  setValue("weightGram", Number(e.target.value), {
                    shouldValidate: true,
                  })
                }
                placeholder="1"
                disabled={isFormDisabled}
                error={!!errors.weightGram}
                hint={errors.weightGram?.message}
              />
            </div>

            <div>
              <Label>
                Length (cm) <span className="text-error-500">*</span>
              </Label>
              <Input
                type="number"
                value={lengthCmValue ?? ""}
                onChange={(e) =>
                  setValue("lengthCm", Number(e.target.value), {
                    shouldValidate: true,
                  })
                }
                placeholder="1"
                disabled={isFormDisabled}
                error={!!errors.lengthCm}
                hint={errors.lengthCm?.message}
              />
            </div>

            <div>
              <Label>
                Width (cm) <span className="text-error-500">*</span>
              </Label>
              <Input
                type="number"
                value={widthCmValue ?? ""}
                onChange={(e) =>
                  setValue("widthCm", Number(e.target.value), {
                    shouldValidate: true,
                  })
                }
                placeholder="1"
                disabled={isFormDisabled}
                error={!!errors.widthCm}
                hint={errors.widthCm?.message}
              />
            </div>

            <div>
              <Label>
                Height (cm) <span className="text-error-500">*</span>
              </Label>
              <Input
                type="number"
                value={heightCmValue ?? ""}
                onChange={(e) =>
                  setValue("heightCm", Number(e.target.value), {
                    shouldValidate: true,
                  })
                }
                placeholder="1"
                disabled={isFormDisabled}
                error={!!errors.heightCm}
                hint={errors.heightCm?.message}
              />
            </div>

            <div className="sm:col-span-2">
              <Label>Description</Label>
              <div className="overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700">
                <div id={toolbarId} className="border-b border-gray-300 p-2 dark:border-gray-700">
                  <span className="ql-formats">
                    <button className="ql-bold" />
                    <button className="ql-italic" />
                    <button className="ql-underline" />
                    <button className="ql-strike" />
                  </span>
                  <span className="ql-formats">
                    <select className="ql-color" />
                    <select className="ql-background" />
                  </span>
                  <span className="ql-formats">
                    <button className="ql-list" value="ordered" />
                    <button className="ql-list" value="bullet" />
                  </span>
                  <span className="ql-formats">
                    <button className="ql-clean" />
                  </span>
                </div>
                <div
                  ref={editorRef}
                  className="min-h-[140px] bg-white text-sm text-gray-800 dark:bg-gray-900 dark:text-white/90"
                />
                <div className="border-t border-gray-200 px-3 py-2 text-right text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  {descriptionStorageLength}/{MAX_DESCRIPTION_LENGTH}
                </div>
              </div>
              <input type="hidden" {...register("description")} />
              {errors.description && (
                <p className="mt-1.5 text-sm text-error-500">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <Label>
                Main Image {mode === "create" && <span className="text-error-500">*</span>}
              </Label>
              <div className="mt-2 flex items-center gap-4">
                {mainImageUrl ? (
                  <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                    <Image
                      src={mainImageUrl}
                      alt="Preview"
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                    <span className="text-xs text-gray-400">No Image</span>
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isFormDisabled}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-gray-800 dark:file:text-gray-300"
                  />
                  {isUploading && (
                    <p className="mt-2 text-xs text-brand-500">Uploading image...</p>
                  )}
                  {errors.mainImageUrl && (
                    <p className="mt-2 text-sm text-error-500">{errors.mainImageUrl.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="sm:col-span-2">
              <Label>
                Additional Images {mode === "create" && <span className="text-error-500">*</span>}
              </Label>
              <p className="mt-1 text-xs text-gray-500">
                Upload 4-6 additional images (total with main image: 5-7).
              </p>
              <div className="mt-3">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleAdditionalImageUpload}
                  disabled={isFormDisabled || additionalImageUrls.length >= 6}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-gray-800 dark:file:text-gray-300"
                />
              </div>

              {additionalImageUrls.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {additionalImageUrls.map((url, index) => (
                    <div
                      key={`${url}-${index}`}
                      className="relative h-24 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <Image
                        src={url}
                        alt={`Additional ${index + 1}`}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveAdditionalImage(index)}
                        className="absolute right-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white"
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {errors.additionalImageUrls && (
                <p className="mt-2 text-sm text-error-500">
                  {errors.additionalImageUrls.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isFormDisabled}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isFormDisabled}
            >
              {mode === "create" ? "Add Product" : "Update"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default ProductFormModal;
