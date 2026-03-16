import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { recurringInvoicesApi, customersApi } from "@/lib/api";
import { useLocation } from "react-router-dom";
import { PageHeader, DataToolbar } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, RefreshCw } from "lucide-react";
import { CreateDialog } from "@/components/CreateDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function RecurringInvoicesPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ customer_id: "", frequency: "monthly", total: "" });
  const location = useLocation();

  const { data: records = [], isLoading, error } = useQuery({
    queryKey: ["recurring_invoices"],
    queryFn: () => recurringInvoicesApi.list(),
  });

  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: customersApi.list });
  const selectableCustomers = customers.filter((customer: any) => customer?.is_active !== false || customer?.id === form.customer_id);

  const createMut = useMutation({
    mutationFn: () => recurringInvoicesApi.create({
      customer_id: form.customer_id,
      frequency: form.frequency,
      start_date: new Date().toISOString().split("T")[0],
      next_invoice_date: new Date().toISOString().split("T")[0],
      subtotal: Number(form.total) || 0,
      tax_amount: 0,
      total: Number(form.total) || 0,
      is_active: true,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recurring_invoices"] });
      setOpen(false);
      setForm({ customer_id: "", frequency: "monthly", total: "" });
      toast({ title: "Recurring invoice created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => recurringInvoicesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recurring_invoices"] });
      toast({ title: "Recurring invoice deleted" });
    },
  });

  useEffect(() => {
    if (location.pathname.endsWith("/new")) setOpen(true);
  }, [location.pathname]);

  const filtered = records.filter((r: any) =>
    (r.customer_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (r.frequency || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Recurring Invoices" subtitle="Automate repetitive billing">
        <CreateDialog title="New Recurring Invoice" buttonLabel="New Recurring" open={open} onOpenChange={setOpen}>
          <form onSubmit={(e) => { e.preventDefault(); createMut.mutate(); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Customer *</Label>
              <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select Customer" /></SelectTrigger>
                <SelectContent>{selectableCustomers.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input placeholder="0.00" type="number" value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={!form.customer_id || !form.total || createMut.isPending}>
              {createMut.isPending ? "Creating..." : "Create Recurring Invoice"}
            </Button>
          </form>
        </CreateDialog>
      </PageHeader>
      <DataToolbar searchPlaceholder="Search recurring invoices..." onSearch={setSearch} />

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground mt-2">Loading...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-destructive">{(error as Error).message}</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <RefreshCw className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No recurring invoices yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Customer</th>
                  <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Frequency</th>
                  <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Next Date</th>
                  <th className="text-right px-5 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                  <th className="text-left px-5 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-right px-5 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r: any) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-primary/[0.03] transition-colors">
                    <td className="px-5 py-2.5 font-medium text-card-foreground">{r.customer_name || r.customer_id}</td>
                    <td className="px-5 py-2.5 capitalize text-muted-foreground">{r.frequency}</td>
                    <td className="px-5 py-2.5 text-muted-foreground">{r.next_invoice_date}</td>
                    <td className="px-5 py-2.5 text-right font-medium text-card-foreground">Rs{Number(r.total).toLocaleString()}</td>
                    <td className="px-5 py-2.5"><StatusBadge status={r.status || (r.is_active ? "active" : "inactive")} /></td>
                    <td className="px-5 py-2.5 text-right">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => {
                        if (confirm("Delete this recurring invoice?")) deleteMut.mutate(r.id);
                      }}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}




