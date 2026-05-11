import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { ProductListItem } from "../types/product";
import { PencilIcon, EyeIcon } from "@/icons";
import { format } from "date-fns";
import Badge from "@/components/ui/badge/Badge";
import Image from "next/image";

interface ProductRowProps {
  product: ProductListItem;
  rowNumber: number;
  onEdit: (product: ProductListItem) => void;
  onViewDetails: (product: ProductListItem) => void;
}

export const ProductRow = React.memo(
  ({ product, rowNumber, onEdit, onViewDetails }: ProductRowProps) => {
    const formattedDate = format(new Date(product.createdAt), "dd/MM/yyyy HH:mm");
    const isInactive =
      product.status === "Inactive" ||
      product.productStatus.toLowerCase() === "inactive";
    const formattedPrice = new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(product.price);

    const getStatusBadge = (status: string) => {
      switch (status.toLowerCase()) {
        case "active":
          return <Badge size="sm" color="success">Active</Badge>;
        case "inactive":
          return <Badge size="sm" color="error">Inactive</Badge>;
        case "outofstock":
          return <Badge size="sm" color="warning">Out of Stock</Badge>;
        default:
          return <Badge size="sm" color="light">{status}</Badge>;
      }
    };

    return (
      <TableRow className={isInactive ? "opacity-50" : undefined}>
        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-300">
          {rowNumber}
        </TableCell>
        <TableCell className="px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            {product.mainImageUrl ? (
              <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                <Image
                  src={product.mainImageUrl}
                  alt={product.productName}
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <span className="text-xs text-gray-400">No Img</span>
              </div>
            )}
            <div className="flex flex-col gap-1">
              <span className="font-medium text-gray-800 dark:text-white/90">
                {product.productName}
              </span>
              <span className="text-xs text-gray-500">
                {product.categoryName} {product.brandName ? `• ${product.brandName}` : ""}
              </span>
            </div>
          </div>
        </TableCell>
        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
          {formattedPrice}
        </TableCell>
        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
          {product.quantity}
        </TableCell>
        <TableCell className="px-4 py-3 text-start">
          {getStatusBadge(product.productStatus)}
        </TableCell>
        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
          {formattedDate}
        </TableCell>
        <TableCell className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => onViewDetails(product)}
              aria-label={`View details of ${product.productName}`}
              className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:border-blue-400 hover:text-blue-500 dark:border-gray-700 dark:text-gray-300"
              title="View product details"
            >
              <EyeIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => onEdit(product)}
              aria-label={`Edit product ${product.productName}`}
              className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-gray-700 dark:text-gray-300"
              title="Edit product"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
          </div>
        </TableCell>
      </TableRow>
    );
  },
);

ProductRow.displayName = "ProductRow";
