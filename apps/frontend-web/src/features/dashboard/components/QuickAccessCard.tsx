import { type ComponentType, type ReactNode } from 'react';
import { Link } from 'react-router';
import { ChevronRight, type LucideProps } from 'lucide-react';

type QuickAccessCardProps = Readonly<{
  to: string;
  title: string;
  description: string;
  icon: ComponentType<LucideProps>;
  badge?: ReactNode;
}>;

// Ligne d'accès rapide du dashboard (design L674-680) : chip icône + titre +
// sous-titre + chevron. Lien react-router (a11y native, pas de div onClick).
export function QuickAccessCard({
  to,
  title,
  description,
  icon: Icon,
  badge,
}: QuickAccessCardProps) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-[9px] border bg-card p-[11px] text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold">{title}</span>
          {badge}
        </div>
        <p className="truncate text-[11.5px] text-muted-foreground">
          {description}
        </p>
      </div>
      <ChevronRight
        className="size-4 shrink-0 text-muted-foreground"
        aria-hidden
      />
    </Link>
  );
}
