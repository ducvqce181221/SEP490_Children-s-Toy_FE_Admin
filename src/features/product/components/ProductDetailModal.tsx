"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { ProductDetail } from "../types/product";
import { productApi } from "../services/product-api";
import { format } from "date-fns";
import Image from "next/image";
import Badge from "@/components/ui/badge/Badge";
import Link from "next/link";
import { promotionApi } from "@/features/promotion/services/promotion-api";
import { ProductPromotionInfoDto } from "@/features/promotion/types/promotion";
import { formatDisplayDate } from "@/utils/date-utils";

interface ProductDetailModalProps {
  isOpen: boolean;
  productId: number;
  onClose: () => void;
}

const ProductDetailModal = ({
  isOpen,
  productId,
  onClose,
}: ProductDetailModalProps) => {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [promotions, setPromotions] = useState<ProductPromotionInfoDto[]>([]);
  const [isPromotionsLoading, setIsPromotionsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !productId) return;

    const fetchProductDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await productApi.getProductById(productId);
        setProduct(data);
      } catch (err) {
        setError("Failed to load product details");
        console.error("[ProductDetailModal] Failed to fetch product:", err);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchAppliedPromotions = async () => {
      setIsPromotionsLoading(true);
      try {
        const response = await promotionApi.getPromotionsByProductId(productId) as unknown as ProductPromotionInfoDto[];
        setPromotions(response || []);
      } catch (err) {
        console.error("[ProductDetailModal] Failed to fetch applied promotions:", err);
      } finally {
        setIsPromotionsLoading(false);
      }
    };

    fetchProductDetails();
    fetchAppliedPromotions();
  }, [isOpen, productId]);

  const getPromotionStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return <Badge size="sm" color="success">Active</Badge>;
      case "scheduled":
      case "upcoming":
        return <Badge size="sm" color="warning">Scheduled</Badge>;
      case "inactive":
        return <Badge size="sm" color="error">Inactive</Badge>;
      case "expired":
        return <Badge size="sm" color="light">Expired</Badge>;
      default:
        return <Badge size="sm" color="light">{status}</Badge>;
    }
  };

  if (!isOpen) return null;

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return <Badge size="sm" color="success">Active</Badge>;
      case "inactive":
        return <Badge size="sm" color="error">Inactive</Badge>;
      case "outofstock":
        return <Badge size="sm" color="warning">Out of Stock</Badge>;
      case "comingsoon":
        return <Badge size="sm" color="info">Coming Soon</Badge>;
      default:
        return <Badge size="sm" color="light">{status}</Badge>;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-h-[90vh] w-full max-w-5xl overflow-y-auto p-0">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-white/[0.05] dark:bg-gray-900">
        <h2
          id="product-detail-title"
          className="text-xl font-semibold text-gray-800 dark:text-white"
        >
          Product Details
        </h2>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading product details...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-error-500">{error}</div>
          </div>
        ) : product ? (
          <div className="space-y-6">
            {/* Product Images */}
            <div className="flex flex-col gap-4 sm:flex-row">
              {product.mainImageUrl ? (
                <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 sm:w-64">
                  <Image
                    src={product.mainImageUrl}
                    alt={product.productName}
                    fill
                    sizes="(max-width: 640px) 100vw, 256px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex aspect-square w-full items-center justify-center rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800 sm:w-64">
                  <span className="text-gray-400">No Image</span>
                </div>
              )}

              {product.additionalImageUrls &&
                product.additionalImageUrls.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 sm:flex-1">
                    {product.additionalImageUrls.map((url, index) => (
                      <div
                        key={index}
                        className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <Image
                          src={url}
                          alt={`${product.productName} - ${index + 1}`}
                          fill
                          sizes="100px"
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
            </div>

            {/* Product Information */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
                  Basic Information
                </h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Product Name
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {product.productName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Category
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {product.categoryName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Brand
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {product.brandName || "N/A"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Status
                    </dt>
                    <dd className="mt-1">
                      {getStatusBadge(product.productStatus)}
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
                  Pricing & Inventory
                </h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Price
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                      {formatPrice(product.price)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Price Range
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {product.priceRangeMin != null && product.priceRangeMax != null
                        ? `${formatPrice(product.priceRangeMin)} - ${formatPrice(product.priceRangeMax)}`
                        : "N/A"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Quantity
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {product.quantity}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Stock Threshold
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {product.stockThreshold}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Low Stock Notification
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {product.lowStockNotificationEnabled ? "Enabled" : "Disabled"}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Product Details */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
                Product Details
              </h3>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Material
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {product.materialName || "N/A"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Age Range
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {product.ageRange || "N/A"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Gender
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {product.sexName || "N/A"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Origin
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {product.originName || "N/A"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Weight
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {product.weightGram ? `${product.weightGram} g` : "N/A"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Length
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {product.lengthCm ? `${product.lengthCm} cm` : "N/A"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Width
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {product.widthCm ? `${product.widthCm} cm` : "N/A"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Height
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {product.heightCm ? `${product.heightCm} cm` : "N/A"}
                  </dd>
                </div>
                {product.launchDate && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Launch Date
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {format(new Date(product.launchDate), "dd/MM/yyyy")}
                    </dd>
                  </div>
                )}
                {product.lastLowStockNotifiedAt && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Last Low Stock Notified
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {format(new Date(product.lastLowStockNotifiedAt), "dd/MM/yyyy HH:mm")}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
                  Description
                </h3>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <div
                    className="whitespace-normal"
                    dangerouslySetInnerHTML={{ __html: product.description || "<p>--</p>" }}
                  />
                </div>
              </div>
            )}

            {/* Applied Promotions */}
            <div className="border-t border-gray-200 pt-6 dark:border-gray-700">
              <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
                Applied Promotions
              </h3>
              {isPromotionsLoading ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">Loading applied promotions...</div>
              ) : promotions && promotions.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/[0.05]">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-white/[0.05]">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
                          Promotion Name
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
                          Type
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
                          Duration
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
                          Sale Price (VND)
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
                          Discount
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
                          Sold
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-white/[0.05]">
                      {promotions.map((promo, index) => (
                        <tr key={`${promo.promotionId}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                            <Link
                              href={`/admin/promotions/${promo.promotionId}`}
                              onClick={onClose}
                              className="text-brand-500 hover:underline hover:text-brand-600 transition-colors"
                            >
                              {promo.promotionName}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {promo.promotionType === "FLASH_SALE" ? "Flash Sale" : "Discount"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs">From: {formatDisplayDate(promo.startDate)}</span>
                              <span className="text-xs">To: {formatDisplayDate(promo.endDate)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                            {promo.salePrice.toLocaleString("vi-VN")}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                            {promo.discountPercent !== null && promo.discountPercent !== undefined
                              ? `${promo.discountPercent}%`
                              : "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {promo.soldQuantity} / {promo.saleQuantity !== null && promo.saleQuantity !== undefined ? promo.saleQuantity : "∞"}
                          </td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            {getPromotionStatusBadge(promo.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/40 rounded-lg p-4 text-center">
                  This product is not currently applied to any promotions.
                </div>
              )}
            </div>

            {/* Metadata */}
            <div>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Created At
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {format(new Date(product.createdAt), "dd/MM/yyyy HH:mm")}
                  </dd>
                </div>
                {product.updatedAt && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Updated At
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {format(new Date(product.updatedAt), "dd/MM/yyyy HH:mm")}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Product not found</div>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 flex justify-end border-t border-gray-200 bg-white px-6 py-4 dark:border-white/[0.05] dark:bg-gray-900">
        <button
          onClick={onClose}
          className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Close
        </button>
      </div>
    </Modal>
  );
};

export default ProductDetailModal;
