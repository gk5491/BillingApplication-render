import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { billsApi } from "@/lib/api";
import { DocumentDetailView } from "@/components/DocumentDetailView";
import { useToast } from "@/hooks/use-toast";

export default function BillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bill, isLoading } = useQuery({
    queryKey: ["bill", id],
    queryFn: () => billsApi.get(id!),
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => billsApi.updateStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bill", id] });
      toast({ title: "Status updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => billsApi.delete(id!),
    onSuccess: () => {
      toast({ title: "Bill deleted" });
      navigate("/purchase/bills");
    },
  });

  const items = (bill?.items || []).map((li: any) => ({
    name: li.item_name || li.description || "",
    hsn: li.hsn_code || "",
    quantity: Number(li.quantity),
    rate: Number(li.rate),
    amount: Number(li.amount),
    taxAmount: Number(li.tax_amount || li.taxAmount),
  }));

  return (
    <DocumentDetailView
      title="Bill"
      document={bill}
      partyLabel="Vendor"
      partyName={bill?.vendor_name || ""}
      partyGstin={bill?.vendor_gstin}
      partyAddress={bill?.vendor_address}
      partyState={bill?.vendor_state}
      items={items}
      subtotal={Number(bill?.subtotal || 0)}
      taxAmount={Number(bill?.tax_amount || bill?.taxAmount || 0)}
      total={Number(bill?.total || 0)}
      balanceDue={Number(bill?.balance_due || bill?.balanceDue || 0)}
      backPath="/purchase/bills"
      status={bill?.status || "draft"}
      onStatusChange={(s) => updateStatusMutation.mutate(s)}
      statusOptions={["draft", "sent", "partial", "paid", "overdue", "cancelled"]}
      onDelete={() => deleteMutation.mutate()}
      onEdit={() => navigate(`/purchase/bills/${id}/edit`)}
      isLoading={isLoading}
    />
  );
}
