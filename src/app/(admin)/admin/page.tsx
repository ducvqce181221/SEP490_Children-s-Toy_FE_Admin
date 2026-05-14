import type { Metadata } from "next";
import React from "react";
import { AdminDashboardView } from "@/features/dashboard/components/AdminDashboardView";

export const metadata: Metadata = {
  title: "Admin Dashboard | ToyStore",
  description: "System analytics overview for the admin dashboard",
};

export default function Ecommerce() {
  return <AdminDashboardView />;
}
