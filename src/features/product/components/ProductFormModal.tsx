import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import {
  ProductFormData,
  ProductFormSchema,
} from "../types/product.schema";
import {
  ProductListItem,
  ProductMutationResult,
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
  const { uploadImage, isUploading } = useCloudinaryUpload();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(ProductFormSchema),
    defaultValues: {
      productName: "",
      categoryId: 0,
      brandId: null,
      price: 0,
      quantity: 0,
      productStatus: "Active",
      stockThreshold: 10,
      lowStockNotificationEnabled: true,
      mainImageUrl: "",
    },
  });

  const mainImageUrl = watch("mainImageUrl");

  useEffect(() => {
    if (isOpen) {
      const fetchOptions = async () => {
        setIsLoadingOptions(true);
        try {
          const [catRes, brandRes] = await Promise.all([
            categoryApi.getCategories({ pageNumber: 1, pageSize: 100 }),
            brandApi.getBrands({ pageNumber: 1, pageSize: 100 }),
          ]);
          setCategories(catRes.items);
          setBrands(brandRes.items);
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
    if (isOpen) {
      if (mode === "edit" && product) {
        setIsLoadingDetail(true);
        productApi.getProductById(product.productId)
          .then((detail) => {
            reset({
              productName: detail.productName,
              categoryId: detail.categoryId,
              brandId: detail.brandId,
              price: detail.price,
              quantity: detail.quantity,
              productStatus: detail.productStatus,
              stockThreshold: detail.stockThreshold,
              lowStockNotificationEnabled: detail.lowStockNotificationEnabled,
              mainImageUrl: detail.mainImageUrl || "",
              description: detail.description || "",
            });
          })
          .catch((err) => console.error("Failed to load product details", err))
          .finally(() => setIsLoadingDetail(false));
      } else {
        reset({
          productName: "",
          categoryId: 0,
          brandId: null,
          price: 0,
          quantity: 0,
          productStatus: "Active",
          stockThreshold: 10,
          lowStockNotificationEnabled: true,
          mainImageUrl: "",
        });
      }
    }
  }, [isOpen, mode, product, reset]);

  const handleFormSubmit = async (data: ProductFormData) => {
    const id = mode === "edit" ? product?.productId ?? null : null;
    const result = await onSubmit(data, id);

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadImage(file);
    if (url) {
      setValue("mainImageUrl", url, { shouldValidate: true });
    }
  };

  const categoryOptions = [
    { value: 0, label: "Select Category..." },
    ...categories.map((c) => ({
      value: c.categoryId,
      label: c.categoryName,
    })),
  ];

  const brandOptions = [
    { value: "", label: "None" },
    ...brands.map((b) => ({
      value: b.brandId,
      label: b.brandName,
    })),
  ];

  const isFormDisabled = isSubmitting || isLoadingOptions || isLoadingDetail || isUploading;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[700px] p-6 sm:p-10"
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
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                {...register("categoryId", { valueAsNumber: true })}
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
              <Label>Brand</Label>
              <Select
                {...register("brandId", { 
                  setValueAs: (v) => v === "" ? null : Number(v) 
                })}
                options={brandOptions}
                disabled={isFormDisabled}
              />
            </div>

            <div>
              <Label>
                Price <span className="text-error-500">*</span>
              </Label>
              <Input
                type="number"
                step="0.01"
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
                  { value: "Out of Stock", label: "Out of Stock" },
                ]}
                disabled={isFormDisabled}
              />
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

            <div className="sm:col-span-2">
              <Label>Product Image</Label>
              <div className="mt-2 flex items-center gap-4">
                {mainImageUrl ? (
                  <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                    <Image
                      src={mainImageUrl}
                      alt="Preview"
                      fill
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
                </div>
              </div>
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
              isLoading={isSubmitting}
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
