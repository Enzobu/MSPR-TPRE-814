import { type ComponentType, type ReactNode } from 'react';
import { Link } from 'react-router';
import { ArrowRight, type LucideProps } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

type QuickAccessCardProps = Readonly<{
  to: string;
  title: string;
  description: string;
  icon: ComponentType<LucideProps>;
  badge?: ReactNode;
}>;

// Grande carte-CTA cliquable du dashboard. Hover : léger soulèvement + ring,
// flèche qui glisse. Lien react-router (a11y native, pas de div onClick).
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
      className="group rounded-xl transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="h-full transition-shadow duration-200 group-hover:ring-2 group-hover:ring-ring/40">
        <CardContent className="flex h-full items-center gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-base font-medium text-foreground">
                {title}
              </h3>
              {badge}
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <ArrowRight
            className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-foreground"
            aria-hidden
          />
        </CardContent>
      </Card>
    </Link>
  );
}
