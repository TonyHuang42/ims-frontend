import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  isActive: boolean;
  className?: string;
}

export function StatusBadge({ isActive, className }: StatusBadgeProps) {
  return (
    <Badge
      variant={isActive ? 'default' : 'secondary'}
      className={cn(
        'font-medium',
        isActive ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200',
        className
      )}
    >
      {isActive ? 'Active' : 'Inactive'}
    </Badge>
  );
}
