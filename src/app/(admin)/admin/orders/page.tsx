import React, { Suspense } from "react";
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
      <PageBreadcrumb pageTitle="Order Management" />
      <div className="space-y-6">
        <Suspense fallback={<div className="p-10 text-center text-gray-500">Loading orders...</div>}>
          <OrderTable />
        </Suspense>
      </div>
    </div>
  );
}
