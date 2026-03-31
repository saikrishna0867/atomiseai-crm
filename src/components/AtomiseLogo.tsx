export function AtomiseLogo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <img src="/atomise-logo.png" alt="Automise AI" className="w-9 h-9 object-contain" />
      {!collapsed && (
        <span className="font-display font-bold text-lg tracking-tight">
          <span style={{ color: '#c9a96e' }}>Automise</span>{' '}
          <span style={{ color: '#c9a96e' }}>AI</span>{' '}
          <span className="text-foreground">CRM</span>
        </span>
      )}
    </div>
  );
}