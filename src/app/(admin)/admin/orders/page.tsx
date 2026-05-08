import React from "react";
import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import OrderTable from "@/features/order/components/OrderTable";

export const metadata: Metadata = {
  title: "Order Management | Admin Dashboard",
  description: "Order Management page for Admin Dashboard",
};

export default function OrdersPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Quản lý Đơn hàng" />
      <div className="space-y-6">
        <OrderTable />
      </div>
    </div>
  );
}
