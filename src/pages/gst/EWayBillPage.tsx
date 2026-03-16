import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { invoicesApi } from "@/lib/api";

export default function EWayBillPage() {
  const { data: invoices = [], isLoading } = useQuery({ queryKey: ["invoices"], queryFn: invoicesApi.list });
  const eligible = invoices.filter((inv: any) => Number(inv.total) >= 50000);

  return (
    <div>
      <PageHeader title="E-Way Bill" subtitle="Transport documents for invoices ≥ ₹50,000" />
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {isLoading ? <div className="p-12 text-center text-muted-foreground">Loading...</div> : eligible.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No invoices ≥ ₹50,000 require E-Way Bills.</div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/50">
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Invoice #</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Customer</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Total</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">E-Way Bill</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Status</th>
            </tr></thead>
            <tbody>{eligible.map((inv: any) => (
              <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-5 py-3 font-medium text-primary">{inv.document_number}</td>
                <td className="px-5 py-3 text-card-foreground">{inv.customer_name || "-"}</td>
                <td className="px-5 py-3 text-right font-medium text-card-foreground">₹{Number(inv.total).toLocaleString()}</td>
                <td className="px-5 py-3 text-muted-foreground text-xs">{inv.eway_bill || "Not generated"}</td>
                <td className="px-5 py-3"><StatusBadge status={inv.eway_bill ? "confirmed" : "draft"} /></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}

