import { Link, useLocation } from 'wouter';
import { BookOpen, Users, LayoutDashboard, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import React from 'react';

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const links = [
    { href: '/', label: 'Summary', icon: LayoutDashboard },
    { href: '/ledger', label: 'Ledger', icon: BookOpen },
    { href: '/members', label: 'Members', icon: Users },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col mx-auto max-w-5xl border-x border-border/50 bg-card/30 shadow-2xl shadow-black/5 relative z-10">
      <header className="px-4 sm:px-8 py-8 border-b border-border/80 flex flex-col gap-6 bg-background">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight italic">Committee Register</h1>
            <p className="text-muted-foreground font-mono text-sm mt-1">EST. 2024</p>
          </div>
        </div>
        <nav className="flex gap-4 sm:gap-8 overflow-x-auto pb-2 scrollbar-none font-mono uppercase tracking-wider text-xs sm:text-sm">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={cn(
              "flex items-center gap-2 pb-1 border-b-2 transition-colors whitespace-nowrap",
              location === l.href ? "border-foreground text-foreground font-bold" : "border-transparent text-muted-foreground hover:text-foreground"
            )}>
              <l.icon className="w-4 h-4" />
              <span>{l.label}</span>
            </Link>
          ))}
        </nav>
      </header>
      <main className="flex-1 p-4 sm:p-8 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}