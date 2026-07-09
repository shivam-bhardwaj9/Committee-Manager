import { useGetDashboardSummary } from '@workspace/api-client-react';
import { AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const { data: summary, isLoading, isError, refetch } = useGetDashboardSummary();

  if (isLoading) return <div className="animate-pulse space-y-4 font-mono text-sm text-muted-foreground">Reading latest figures...</div>;
  if (isError || !summary) return (
    <div className="p-6 border border-destructive/30 bg-destructive/5 rounded-sm font-mono text-sm text-destructive flex items-center justify-between gap-4">
      <span>Failed to load summary. The ledger may be unreachable.</span>
      <button onClick={() => refetch()} className="underline underline-offset-2 hover:opacity-80">Retry</button>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-6 border border-border/80 bg-background/50 rounded-sm">
          <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider mb-2">Collected ({summary.currentMonthLabel || 'N/A'})</p>
          <p className="text-4xl sm:text-5xl font-mono text-success">${summary.totalCollectedThisMonth}</p>
        </div>
        <div className="p-6 border border-border/80 bg-background/50 rounded-sm">
          <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider mb-2">Pending ({summary.currentMonthLabel || 'N/A'})</p>
          <p className="text-4xl sm:text-5xl font-mono text-destructive">${summary.totalPendingAmountThisMonth}</p>
        </div>
      </div>

      {summary.pendingMemberCount > 0 && (
        <div className="p-6 border border-destructive/30 bg-destructive/5 rounded-sm">
          <h3 className="text-lg font-bold italic flex items-center gap-2 text-destructive">
            <AlertCircle className="w-5 h-5" />
            {summary.pendingMemberCount} Member(s) Pending
          </h3>
          <ul className="mt-4 space-y-2 list-disc list-inside pl-2 font-mono text-sm text-foreground/80">
            {summary.pendingMemberNames.map((name, i) => (
              <li key={i}>{name}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-6 border border-border/80 bg-background/50 rounded-sm flex flex-col justify-center items-center">
          <p className="text-5xl font-mono text-foreground/80">{summary.totalMembers}</p>
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mt-3">Active Members</p>
        </div>
        <div className="p-6 border border-border/80 bg-background/50 rounded-sm flex flex-col justify-center items-center">
          <p className="text-5xl font-mono text-foreground/80">{summary.totalMonthsTracked}</p>
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mt-3">Months Tracked</p>
        </div>
      </div>
    </div>
  );
}