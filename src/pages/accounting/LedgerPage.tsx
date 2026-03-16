import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { accountsApi } from "@/lib/api";
import { formatCurrency } from "./accounting-utils";

export default function LedgerPage() {
  const { data: accounts = [], isLoading } = useQuery({ queryKey: ["accounts"], queryFn: accountsApi.list });

  return (
    <div>
      <PageHeader title="General Ledger" subtitle="Account-wise transaction details" />
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {isLoading ? <div className="p-12 text-center text-muted-foreground">Loading...</div> : accounts.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No accounts yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/50">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Code</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Account Name</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Type</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">Balance</th>
              </tr></thead>
              <tbody>
                {accounts.map((acc: any) => (
                  <tr key={acc.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{acc.code}</td>
                    <td className="px-5 py-3 font-medium text-card-foreground">{acc.name}</td>
                    <td className="px-5 py-3 text-muted-foreground capitalize">{acc.account_type}</td>
                    <td className="px-5 py-3 text-right font-medium text-card-foreground">{formatCurrency(Number(acc.balance || 0))}</td>
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
