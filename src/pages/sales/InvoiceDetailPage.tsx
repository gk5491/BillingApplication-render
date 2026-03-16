import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoicesApi } from "@/lib/api";
import { DocumentDetailView } from "@/components/DocumentDetailView";
import { useToast } from "@/hooks/use-toast";

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoice", id],
    queryFn: () => invoicesApi.get(id!),
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => invoicesApi.updateStatus(id!, status),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["invoice", id] }); toast({ title: "Status updated" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: () => invoicesApi.delete(id!),
    onSuccess: () => { toast({ title: "Invoice deleted" }); navigate("/sales/invoices"); },
  });

  const items = (invoice?.items || []).map((li: any) => ({
    name: li.item_name || li.description || "",
    hsn: li.hsn_code || "",
    quantity: Number(li.quantity),
    rate: Number(li.rate),
    amount: Number(li.amount),
    taxAmount: Number(li.tax_amount || li.taxAmount),
  }));

  return (
    <DocumentDetailView
      title="Invoice"
      document={invoice}
      partyLabel="Customer"
      partyName={invoice?.customer_name || ""}
      partyGstin={invoice?.customer_gstin}
      partyAddress={invoice?.customer_address}
      items={items}
      subtotal={Number(invoice?.subtotal || 0)}
      taxAmount={Number(invoice?.tax_amount || invoice?.taxAmount || 0)}
      total={Number(invoice?.total || 0)}
      balanceDue={Number(invoice?.balance_due || invoice?.balanceDue || 0)}
      backPath="/sales/invoices"
      status={invoice?.status || "draft"}
      onStatusChange={(s) => updateStatusMutation.mutate(s)}
      statusOptions={["draft", "sent", "partial", "paid", "overdue", "cancelled"]}
      onDelete={() => deleteMutation.mutate()}
      onEdit={() => navigate(`/sales/invoices/${id}/edit`)}
      isLoading={isLoading}
    />
  );
}
