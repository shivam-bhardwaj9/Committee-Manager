import { useMemo, useState } from 'react';
import { useListMembers, useListMonths, useListPayments, useCreateMonth, useUpdateMonth, useUpsertPayment, useGetSettings, getListMonthsQueryKey, getListPaymentsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Plus, Check, Clock, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function Ledger() {
  const { data: members, isError: membersError, refetch: refetchMembers } = useListMembers();
  const { data: months, isError: monthsError, refetch: refetchMonths } = useListMonths();
  const { data: payments, isError: paymentsError, refetch: refetchPayments } = useListPayments();
  const { data: settings, isError: settingsError, refetch: refetchSettings } = useGetSettings();
  const hasError = membersError || monthsError || paymentsError || settingsError;

  const paymentMap = useMemo(() => {
    const map = new Map();
    for (const p of payments ?? []) {
      map.set(`${p.memberId}_${p.monthId}`, p);
    }
    return map;
  }, [payments]);

  const sortedMonths = useMemo(
    () => [...(months ?? [])].sort((a, b) => a.sortKey.localeCompare(b.sortKey)),
    [months],
  );

  const recentMonths = useMemo(() => sortedMonths.slice(-2), [sortedMonths]);

  const missedTwoMap = useMemo(() => {
    const map = new Map();
    if (recentMonths.length < 2 || !members) return map;
    for (const m of members) {
      let missedCount = 0;
      for (const rm of recentMonths) {
        const p = paymentMap.get(`${m.id}_${rm.id}`);
        if (!p || !p.isPaid) missedCount++;
      }
      if (missedCount >= 2) map.set(m.id, true);
    }
    return map;
  }, [members, recentMonths, paymentMap]);

  if (hasError) return (
    <div className="p-6 border border-destructive/30 bg-destructive/5 rounded-sm font-mono text-sm text-destructive flex items-center justify-between gap-4">
      <span>Failed to load ledger data.</span>
      <button
        onClick={() => { refetchMembers(); refetchMonths(); refetchPayments(); refetchSettings(); }}
        className="underline underline-offset-2 hover:opacity-80"
      >
        Retry
      </button>
    </div>
  );

  if (!members || !months || !payments || !settings) return <div className="animate-pulse font-mono text-sm text-muted-foreground">Opening ledger...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold italic">Payment Ledger</h2>
        <AddMonthModal>
          <Button variant="outline" className="gap-2 font-mono uppercase tracking-wide text-xs"><Plus className="w-3 h-3" /> Track Month</Button>
        </AddMonthModal>
      </div>

      <div className="overflow-x-auto border border-border/80 bg-background rounded-sm shadow-sm relative scrollbar-thin">
        <table className="w-full text-left text-sm border-collapse min-w-max">
          <thead className="bg-muted/30 font-mono text-xs uppercase tracking-wider">
            <tr>
              <th className="p-4 border-b border-r border-border/80 sticky left-0 bg-background z-10 w-48 shadow-[1px_0_0_0_rgba(0,0,0,0.1)]">Member</th>
              {sortedMonths.map(month => (
                <th key={month.id} className="p-4 border-b border-border/80 text-center min-w-[140px]">
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-foreground text-[13px]">{month.label}</span>
                    <PotWinnerSelector month={month} members={members} />
                  </div>
                </th>
              ))}
              {sortedMonths.length === 0 && (
                <th className="p-4 border-b border-border/80 text-muted-foreground italic normal-case">No months tracked yet.</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {members.map(member => {
              const isWarning = missedTwoMap.has(member.id);
              return (
                <tr key={member.id} className="hover:bg-muted/5 transition-colors group">
                  <td className={cn(
                    "p-4 border-r border-border/80 sticky left-0 bg-background group-hover:bg-[#eeeadb] transition-colors z-10 font-sans font-medium text-lg shadow-[1px_0_0_0_rgba(0,0,0,0.1)] flex items-center justify-between gap-2",
                    isWarning && "text-destructive"
                  )}>
                    <span>{member.name}</span>
                    {isWarning && <div className="w-2 h-2 rounded-full bg-destructive animate-pulse shrink-0" title="Missed recent 2+ months" />}
                  </td>
                  {sortedMonths.map(month => {
                    const payment = paymentMap.get(`${member.id}_${month.id}`);
                    return (
                      <td key={month.id} className="p-2 border-r border-border/40 last:border-r-0">
                        <PaymentCell 
                          member={member} 
                          month={month} 
                          payment={payment} 
                          defaultAmount={settings.monthlyAmount} 
                        />
                      </td>
                    );
                  })}
                  {sortedMonths.length === 0 && <td className="p-4"></td>}
                </tr>
              )
            })}
            {members.length === 0 && (
              <tr>
                <td colSpan={Math.max(2, sortedMonths.length + 1)} className="p-8 text-center text-muted-foreground italic">
                  Roster is empty.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PotWinnerSelector({ month, members }: any) {
  const queryClient = useQueryClient();
  const updateMut = useUpdateMonth();

  const handleSelect = (memberId: number | null) => {
    updateMut.mutate({ id: month.id, data: { potWinnerMemberId: memberId } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMonthsQueryKey() });
        toast.success(memberId ? "Winner recorded" : "Winner cleared");
      }
    });
  };

  if (month.potWinnerMemberId) {
    const winner = members.find((m: any) => m.id === month.potWinnerMemberId);
    return (
      <div 
        className="mt-2 flex items-center gap-1 text-[10px] font-sans font-medium text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded cursor-pointer hover:bg-amber-500/20 border border-amber-500/20 transition-colors"
        onClick={() => handleSelect(null)}
        title="Click to clear winner"
      >
        <Trophy className="w-3 h-3" /> {winner?.name || 'Unknown'}
      </div>
    );
  }

  return (
    <select 
      className="mt-2 text-[10px] font-sans bg-transparent border border-dashed border-border/60 hover:border-foreground/30 rounded px-1 py-0.5 text-muted-foreground outline-none cursor-pointer transition-colors"
      onChange={(e) => handleSelect(e.target.value ? Number(e.target.value) : null)}
      value=""
    >
      <option value="" disabled>Set Winner...</option>
      {members.map((m: any) => (
        <option key={m.id} value={m.id}>{m.name}</option>
      ))}
    </select>
  );
}

function PaymentCell({ member, month, payment, defaultAmount }: any) {
  const [open, setOpen] = useState(false);
  const isPaid = payment?.isPaid;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className={cn(
          "w-full h-14 flex flex-col items-center justify-center rounded-sm font-mono text-sm transition-all border border-transparent",
          isPaid 
            ? "text-success hover:bg-success/5 border-success/10 bg-success/5" 
            : "text-destructive/70 hover:bg-destructive/5 hover:text-destructive"
        )}>
          {isPaid ? (
            <>
              <span className="flex items-center gap-1.5 font-bold"><Check className="w-3.5 h-3.5"/> ${payment.amountPaid}</span>
              {payment.datePaid && <span className="text-[10px] opacity-70 mt-0.5 tracking-wider">{format(new Date(payment.datePaid), 'MMM d')}</span>}
            </>
          ) : (
            <span className="flex items-center gap-1.5 text-xs tracking-wider opacity-60"><Clock className="w-3 h-3"/> PEND</span>
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-xs">
        <PaymentForm 
          member={member} 
          month={month} 
          payment={payment} 
          defaultAmount={defaultAmount} 
          onClose={() => setOpen(false)} 
        />
      </DialogContent>
    </Dialog>
  );
}

function PaymentForm({ member, month, payment, defaultAmount, onClose }: any) {
  const queryClient = useQueryClient();
  const upsertMut = useUpsertPayment();
  const [isPaid, setIsPaid] = useState(payment?.isPaid ?? true);
  const [amount, setAmount] = useState(payment?.amountPaid || defaultAmount);
  const [date, setDate] = useState(payment?.datePaid ? payment.datePaid.split('T')[0] : new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsertMut.mutate({
      data: {
        memberId: member.id,
        monthId: month.id,
        isPaid,
        amountPaid: isPaid ? amount : "0",
        datePaid: isPaid ? new Date(date).toISOString() : null
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPaymentsQueryKey() });
        toast.success(`Record updated for ${member.name}`);
        onClose();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border-b border-border pb-4">
        <h3 className="text-xl font-bold italic text-foreground">{member.name}</h3>
        <p className="text-sm font-mono text-muted-foreground uppercase tracking-widest mt-1">{month.label}</p>
      </div>
      
      <div className="flex gap-6">
        <label className="flex items-center gap-2 font-mono text-sm cursor-pointer hover:opacity-80 transition-opacity">
          <input type="radio" checked={isPaid} onChange={() => setIsPaid(true)} className="w-4 h-4 accent-success" />
          Paid
        </label>
        <label className="flex items-center gap-2 font-mono text-sm cursor-pointer hover:opacity-80 transition-opacity">
          <input type="radio" checked={!isPaid} onChange={() => setIsPaid(false)} className="w-4 h-4 accent-destructive" />
          Pending
        </label>
      </div>

      <div className={cn("space-y-5 transition-opacity duration-300", !isPaid && "opacity-30 pointer-events-none")}>
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-muted-foreground">$</span>
            <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required={isPaid} className="pl-7 h-10 text-lg" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">Date Received</label>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} required={isPaid} className="h-10 text-base" />
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <Button type="submit" disabled={upsertMut.isPending} className="font-mono uppercase text-xs tracking-wider h-10 px-6 w-full">
          Seal Record
        </Button>
      </div>
    </form>
  );
}

function AddMonthModal({ children }: any) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const createMut = useCreateMonth();
  
  const currentDt = new Date();
  const defaultLabel = format(currentDt, 'MMMM yyyy');
  const defaultSort = format(currentDt, 'yyyy-MM');
  
  const [label, setLabel] = useState(defaultLabel);
  const [sortKey, setSortKey] = useState(defaultSort);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMut.mutate({ data: { label, sortKey } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMonthsQueryKey() });
        toast.success(`Commenced tracking for ${label}`);
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-xs">
        <h3 className="text-2xl font-bold italic border-b border-border pb-3 mb-6">Track New Month</h3>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">Display Label</label>
            <Input value={label} onChange={e => setLabel(e.target.value)} required placeholder="e.g. February 2026" className="font-sans text-lg h-10" />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">Sort Key <span className="opacity-60 text-[10px]">(YYYY-MM)</span></label>
            <Input value={sortKey} onChange={e => setSortKey(e.target.value)} required placeholder="2026-02" className="h-10" />
          </div>
          <div className="pt-6 flex justify-end">
            <Button type="submit" disabled={createMut.isPending} className="font-mono uppercase text-xs tracking-wider h-10 px-6 w-full">
              Add to Ledger
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}