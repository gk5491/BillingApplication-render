import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { itemCategoriesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function CategoriesPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["item_categories"],
    queryFn: () => itemCategoriesApi.list(),
  });

  const createMut = useMutation({
    mutationFn: () => itemCategoriesApi.create({ name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["item_categories"] }); setOpen(false); setName(""); toast({ title: "Category created" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => itemCategoriesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["item_categories"] }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Item Categories</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> New Category</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Category</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Category Name" value={name} onChange={(e) => setName(e.target.value)} />
              <Button onClick={() => createMut.mutate()} disabled={!name} className="w-full">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={2} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow> :
            categories.length === 0 ? <TableRow><TableCell colSpan={2} className="text-center py-8 text-muted-foreground">No categories</TableCell></TableRow> :
            categories.map((c: any) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell><Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(c.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
