import React from "react";
import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import OrderDetailPage from "@/features/order/components/OrderDetailPage";

export const metadata: Metadata = {
  title: "Chi tiết Đơn hàng | Toy Store Admin",
  description: "Quản lý chi tiết đơn hàng, xử lý vận chuyển và trạng thái.",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailRoute({ params }: Props) {
  const { id } = await params;
  const orderId = parseInt(id, 10);

  if (isNaN(orderId)) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-gray-500">Mã đơn hàng không hợp lệ</p>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb
        pageTitle="Chi tiết Đơn hàng"
        breadcrumbs={[{ label: "Đơn hàng", href: "/admin/orders" }]}
      />
      <OrderDetailPage orderId={orderId} />
    </div>
  );
}
