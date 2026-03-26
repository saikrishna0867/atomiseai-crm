import { cn } from '@/lib/utils';

const stageColors: Record<string, string> = {
  'Lead': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Qualified': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  'Proposal': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'Negotiation': 'bg-red-500/10 text-red-400 border-red-500/20',
  'Closed Won': 'bg-green-500/10 text-green-400 border-green-500/20',
  'Closed Lost': 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

const priorityColors: Record<string, string> = {
  'High': 'bg-red-500/10 text-red-400 border-red-500/20',
  'Medium': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'Low': 'bg-green-500/10 text-green-400 border-green-500/20',
};

const statusColors: Record<string, string> = {
  'Scheduled': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Completed': 'bg-green-500/10 text-green-400 border-green-500/20',
  'Cancelled': 'bg-red-500/10 text-red-400 border-red-500/20',
  'No Show': 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  'Pending': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  'In Progress': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Draft': 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  'Sending': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 animate-pulse',
  'Sent': 'bg-green-500/10 text-green-400 border-green-500/20',
  'Failed': 'bg-red-500/10 text-red-400 border-red-500/20',
  'Positive': 'bg-green-500/10 text-green-400 border-green-500/20',
  'Neutral': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  'Needs Attention': 'bg-red-500/10 text-red-400 border-red-500/20',
};

interface BadgeProps {
  type: 'stage' | 'priority' | 'status';
  value: string;
  className?: string;
}

export function StatusBadge({ type, value, className }: BadgeProps) {
  const colors = type === 'stage' ? stageColors : type === 'priority' ? priorityColors : statusColors;
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
      colors[value] || 'bg-muted text-muted-foreground border-border',
      className
    )}>
      {value}
    </span>
  );
}
