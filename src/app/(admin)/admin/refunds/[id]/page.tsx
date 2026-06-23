import { RefundEditView } from "@/features/refund/components/RefundEditView";

export default async function RefundDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { id } = await params;
  const { view } = await searchParams;
  const isViewOnly = view === "true";
  const refundId = parseInt(id, 10);

  if (isNaN(refundId)) {
    return <div className="p-10 text-center text-error-500">Invalid Refund ID</div>;
  }

  return <RefundEditView refundId={refundId} isViewOnly={isViewOnly} />;
}


