import React from "react";
import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import OrderQueuePage from "@/features/order-queue/components/OrderQueuePage";

export const metadata: Metadata = {
  title: "Order Queue | Admin Dashboard",
  description: "Assign orders waiting in the auto-assign queue",
};

export default function OrderQueueRoutePage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Order Queue" />
      <OrderQueuePage />
    </div>
  );
}
