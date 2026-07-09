import { useState, useEffect } from 'react';
import { useGetSettings, useUpdateSettings, getGetSettingsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function Settings() {
  const { data: settings, isLoading, isError, refetch } = useGetSettings();
  const updateMut = useUpdateSettings();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (settings) {
      setName(settings.committeeName);
      setAmount(settings.monthlyAmount);
    }
  }, [settings]);

  if (isLoading) return <div className="animate-pulse font-mono text-sm text-muted-foreground">Reading settings...</div>;
  if (isError) return (
    <div className="p-6 border border-destructive/30 bg-destructive/5 rounded-sm font-mono text-sm text-destructive flex items-center justify-between gap-4">
      <span>Failed to load settings.</span>
      <button onClick={() => refetch()} className="underline underline-offset-2 hover:opacity-80">Retry</button>
    </div>
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMut.mutate({ data: { committeeName: name, monthlyAmount: amount } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
        toast.success("Settings preserved in the register.");
      }
    });
  };

  return (
    <div className="max-w-xl space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold italic">Committee Settings</h2>
        <p className="text-muted-foreground font-mono text-sm mt-2">Adjust foundational rules for the ledger.</p>
      </div>
      
      <div className="p-8 border border-border/80 bg-background/50 rounded-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">Committee Name</label>
            <Input 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
              className="font-sans text-xl h-12"
            />
            <p className="text-xs text-muted-foreground mt-2 font-mono italic">Appears on reports and exports</p>
          </div>
          
          <div className="pt-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">Default Monthly Contribution ($)</label>
            <div className="relative max-w-[200px]">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-muted-foreground text-lg">$</span>
              <Input 
                type="number" 
                step="0.01" 
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
                required 
                className="pl-8 text-xl h-12"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-mono italic">This amount will be pre-filled when marking payments.</p>
          </div>
          
          <div className="pt-8 border-t border-border/40">
            <Button type="submit" disabled={updateMut.isPending} className="font-mono uppercase tracking-wider text-sm h-12 px-8">
              {updateMut.isPending ? 'Scribing...' : 'Preserve Settings'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}