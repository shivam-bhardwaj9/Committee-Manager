import { useState } from 'react';
import { useListMembers, useCreateMember, useUpdateMember, useDeleteMember, getListMembersQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { Trash2, Edit2, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function Members() {
  const { data: members, isLoading, isError, refetch } = useListMembers();
  const [isAddOpen, setIsAddOpen] = useState(false);

  if (isLoading) return <div className="animate-pulse font-mono text-sm text-muted-foreground">Fetching roster...</div>;
  if (isError) return (
    <div className="p-6 border border-destructive/30 bg-destructive/5 rounded-sm font-mono text-sm text-destructive flex items-center justify-between gap-4">
      <span>Failed to load members.</span>
      <button onClick={() => refetch()} className="underline underline-offset-2 hover:opacity-80">Retry</button>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold italic">Member Roster</h2>
        <MemberFormModal open={isAddOpen} onOpenChange={setIsAddOpen}>
          <Button variant="outline" className="gap-2 font-mono uppercase tracking-wide text-xs"><Plus className="w-3 h-3"/> New Member</Button>
        </MemberFormModal>
      </div>

      <div className="border border-border/80 rounded-sm overflow-x-auto bg-background">
        <table className="w-full text-left text-sm whitespace-nowrap min-w-[600px]">
          <thead className="bg-muted/30 border-b border-border/80 font-mono text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-4 font-normal w-1/3">Name</th>
              <th className="px-4 py-4 font-normal w-1/4">Phone</th>
              <th className="px-4 py-4 font-normal w-1/4">Joined</th>
              <th className="px-4 py-4 font-normal text-right w-[100px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 font-mono">
            {members?.map(m => (
              <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-sans font-medium text-lg">{m.name}</td>
                <td className="px-4 py-3 opacity-80">{m.phoneNumber}</td>
                <td className="px-4 py-3 opacity-80">{format(new Date(m.dateJoined), 'MMM yyyy')}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <MemberFormModal member={m}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Edit2 className="w-4 h-4 opacity-70"/></Button>
                  </MemberFormModal>
                  <DeleteMemberModal id={m.id} name={m.name}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive"><Trash2 className="w-4 h-4 opacity-70"/></Button>
                  </DeleteMemberModal>
                </td>
              </tr>
            ))}
            {members?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground font-sans italic">
                  No members recorded yet. Add the first member to begin.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MemberFormModal({ children, member, open, onOpenChange }: any) {
  const queryClient = useQueryClient();
  const createMut = useCreateMember();
  const updateMut = useUpdateMember();
  const [name, setName] = useState(member?.name || '');
  const [phone, setPhone] = useState(member?.phoneNumber || '');
  const [dateJoined, setDateJoined] = useState(member?.dateJoined ? member.dateJoined.split('T')[0] : new Date().toISOString().split('T')[0]);
  const [isOpen, setIsOpen] = useState(open);

  const isControlled = open !== undefined;
  const actualOpen = isControlled ? open : isOpen;
  const setActualOpen = isControlled ? onOpenChange : setIsOpen;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (member) {
      updateMut.mutate({ id: member.id, data: { name, phoneNumber: phone, dateJoined: new Date(dateJoined).toISOString() } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMembersQueryKey() });
          toast.success("Member updated");
          setActualOpen(false);
        }
      });
    } else {
      createMut.mutate({ data: { name, phoneNumber: phone, dateJoined: new Date(dateJoined).toISOString() } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMembersQueryKey() });
          toast.success("Member added");
          setActualOpen(false);
          setName(''); setPhone('');
        }
      });
    }
  };

  return (
    <Dialog open={actualOpen} onOpenChange={setActualOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <h3 className="text-2xl font-bold italic border-b border-border pb-3 mb-6">{member ? 'Edit Member' : 'Add Member'}</h3>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">Full Name</label>
            <Input value={name} onChange={e => setName(e.target.value)} required placeholder="Jane Doe" className="font-sans text-lg h-10" />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">Phone Number</label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} required placeholder="+1 (555) 000-0000" className="h-10" />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">Date Joined</label>
            <Input type="date" value={dateJoined} onChange={e => setDateJoined(e.target.value)} required className="h-10" />
          </div>
          <div className="pt-6 flex justify-end">
            <Button type="submit" disabled={createMut.isPending || updateMut.isPending} className="font-mono uppercase tracking-wider text-xs h-10 px-6">
              {member ? 'Save Record' : 'Inscribe'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteMemberModal({ children, id, name }: { children: React.ReactNode, id: number, name: string }) {
  const queryClient = useQueryClient();
  const deleteMut = useDeleteMember();
  const [open, setOpen] = useState(false);

  const confirm = () => {
    deleteMut.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMembersQueryKey() });
        toast.success(`Removed ${name}`);
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <h3 className="text-xl font-bold text-destructive italic border-b border-destructive/20 pb-2 mb-4">Confirm Deletion</h3>
        <p className="mb-6 font-mono text-sm leading-relaxed">Are you sure you want to strike <strong className="font-sans font-bold text-base">{name}</strong> from the roster? This cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)} className="font-mono uppercase text-xs tracking-wider">Cancel</Button>
          <Button variant="destructive" onClick={confirm} disabled={deleteMut.isPending} className="font-mono uppercase text-xs tracking-wider">Remove</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}