import { useQuery } from "@tanstack/react-query";
import { posOrdersApi } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";

export default function POSOrdersPage() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["pos_orders"],
    queryFn: () => posOrdersApi.list(),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">POS Orders</h1>
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Order #</TableHead><TableHead>Customer</TableHead><TableHead>Total</TableHead>
            <TableHead>Status</TableHead><TableHead>Date</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow> :
            orders.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No POS orders</TableCell></TableRow> :
            orders.map((o: any) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">{o.order_number || o.orderNumber}</TableCell>
                <TableCell>{o.customer_name || o.customerName || "Walk-in"}</TableCell>
                <TableCell>Rs {Number(o.total || 0).toLocaleString()}</TableCell>
                <TableCell><StatusBadge status={o.status === "completed" ? "paid" : o.status} /></TableCell>
                <TableCell>{new Date(o.created_at || o.createdAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
