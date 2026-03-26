import { Zap } from 'lucide-react';

export function AtomiseLogo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2 px-2">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20">
        <Zap className="w-5 h-5 text-primary" />
      </div>
      {!collapsed && (
        <span className="font-display font-bold text-lg text-foreground tracking-tight">
          Atomise <span className="text-primary">CRM</span>
        </span>
      )}
    </div>
  );
}
