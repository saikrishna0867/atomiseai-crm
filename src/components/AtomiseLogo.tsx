export function AtomiseLogo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <img src="/atomise-logo.png" alt="Atomise AI" className="object-contain" style={{ width: 44, height: 44, borderRadius: 8 }} />
      {!collapsed && (
        <span className="font-display font-bold text-lg tracking-tight">
          <span className="text-white">Atomise</span>{' '}
          <span style={{ color: '#c9a96e' }}>CRM</span>
        </span>
      )}
    </div>
  );
}