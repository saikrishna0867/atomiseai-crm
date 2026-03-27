import { Zap } from 'lucide-react';
import { useAppSettings } from '@/hooks/useAppSettings';

export function AtomiseLogo({ collapsed = false }: { collapsed?: boolean }) {
  const { crmName } = useAppSettings();
  
  // Split name to highlight last word in accent color
  const words = crmName.trim().split(/\s+/);
  const lastWord = words.length > 1 ? words.pop() : null;
  const firstPart = words.join(' ');

  return (
    <div className="flex items-center gap-2.5">
      <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-purple-muted shadow-[0_0_16px_rgba(124,58,237,0.3)]">
        <Zap className="w-5 h-5 text-white" />
      </div>
      {!collapsed && (
        <span className="font-display font-bold text-lg text-foreground tracking-tight">
          {firstPart}{lastWord && <> <span className="text-purple-bright">{lastWord}</span></>}
        </span>
      )}
    </div>
  );
}
