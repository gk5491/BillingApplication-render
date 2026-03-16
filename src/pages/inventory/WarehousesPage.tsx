import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { warehousesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function WarehousesPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ warehouse_name: "", address: "" });

  const { data: warehouses = [], isLoading } = useQuery({
    queryKey: ["warehouses"],
    queryFn: () => warehousesApi.list(),
  });

  const createMut = useMutation({
    mutationFn: () => warehousesApi.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["warehouses"] }); setOpen(false); toast({ title: "Warehouse created" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => warehousesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["warehouses"] }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Warehouses</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> New Warehouse</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Warehouse</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Warehouse Name" value={form.warehouse_name} onChange={(e) => setForm({ ...form, warehouse_name: e.target.value })} />
              <Input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              <Button onClick={() => createMut.mutate()} disabled={!form.warehouse_name} className="w-full">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Address</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow> :
            warehouses.length === 0 ? <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No warehouses</TableCell></TableRow> :
            warehouses.map((w: any) => (
              <TableRow key={w.id}>
                <TableCell className="font-medium">{w.warehouse_name || w.warehouseName}</TableCell>
                <TableCell className="text-muted-foreground">{w.address}</TableCell>
                <TableCell><Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(w.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
