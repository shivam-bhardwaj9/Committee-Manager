import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-32 space-y-6 animate-in fade-in">
      <h2 className="text-4xl font-bold italic text-foreground">Page Missing</h2>
      <p className="font-mono text-muted-foreground">The page you seek has been torn from the register.</p>
      <Link href="/" className="font-mono text-sm underline hover:text-foreground/80 transition-colors">
        Return to Summary
      </Link>
    </div>
  );
}