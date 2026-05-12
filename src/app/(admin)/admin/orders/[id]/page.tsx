import React from "react";
import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import OrderDetailPage from "@/features/order/components/OrderDetailPage";

export const metadata: Metadata = {
  title: "Order Details | Toy Store Admin",
  description: "Manage order details, shipping, and status.",
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
        <p className="text-gray-500">Invalid Order ID</p>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb
        pageTitle="Order Details"
        breadcrumbs={[{ label: "Orders", href: "/admin/orders" }]}
      />
      <OrderDetailPage orderId={orderId} />
    </div>
  );
}
