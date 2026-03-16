import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { api } from "@/lib/api-client";
import { formatCurrency } from "@/pages/accounting/accounting-utils";

export default function HSNSummaryPage() {
  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ["hsn_summary"],
    queryFn: () => api.get<any[]>("/gst/hsn-summary"),
  });

  const totalQty = rows.reduce((sum: number, row: any) => sum + Number(row.qty || 0), 0);
  const totalTaxable = rows.reduce((sum: number, row: any) => sum + Number(row.taxable_value || 0), 0);
  const totalTax = rows.reduce((sum: number, row: any) => sum + Number(row.tax_value || 0), 0);
  const grandTotal = rows.reduce((sum: number, row: any) => sum + Number(row.total_value || 0), 0);

  return (
    <div>
      <PageHeader title="HSN Summary" subtitle="HSN-wise tax summary from posted invoices" />
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {isLoading ? <div className="p-12 text-center text-muted-foreground">Loading...</div> : error ? (
          <div className="p-12 text-center text-destructive">{(error as Error).message}</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No invoice data to summarize.</div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/50">
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">HSN Code</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Item Name</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Qty</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Taxable Value</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Tax</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Total</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Invoices</th>
            </tr></thead>
            <tbody>
              {rows.map((row: any) => (
                <tr key={row.hsn} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-5 py-3 font-medium text-card-foreground">{row.hsn}</td>
                  <td className="px-5 py-3 text-muted-foreground">{row.item_names || "Unknown Item"}</td>
                  <td className="px-5 py-3 text-right text-muted-foreground">{Number(row.qty || 0).toLocaleString()}</td>
                  <td className="px-5 py-3 text-right text-card-foreground">{formatCurrency(Number(row.taxable_value || 0))}</td>
                  <td className="px-5 py-3 text-right text-muted-foreground">{formatCurrency(Number(row.tax_value || 0))}</td>
                  <td className="px-5 py-3 text-right font-medium text-card-foreground">{formatCurrency(Number(row.total_value || 0))}</td>
                  <td className="px-5 py-3 text-right text-muted-foreground">{Number(row.invoice_count || 0).toLocaleString()}</td>
                </tr>
              ))}
              <tr className="bg-muted/40 font-semibold">
                <td className="px-5 py-3 text-card-foreground">Total</td>
                <td className="px-5 py-3 text-card-foreground">-</td>
                <td className="px-5 py-3 text-right text-card-foreground">{Number(totalQty).toLocaleString()}</td>
                <td className="px-5 py-3 text-right text-card-foreground">{formatCurrency(totalTaxable)}</td>
                <td className="px-5 py-3 text-right text-card-foreground">{formatCurrency(totalTax)}</td>
                <td className="px-5 py-3 text-right text-card-foreground">{formatCurrency(grandTotal)}</td>
                <td className="px-5 py-3 text-right text-card-foreground">-</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

