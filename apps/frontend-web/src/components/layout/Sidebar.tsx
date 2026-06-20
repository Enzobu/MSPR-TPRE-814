import { Coffee } from 'lucide-react';
import { Link } from 'react-router';
import { SidebarNav } from '@/components/layout/SidebarNav';
import { SidebarCountryNav } from '@/components/layout/SidebarCountryNav';
import { SidebarThemeToggle } from '@/components/layout/SidebarThemeToggle';
import { UserCard } from '@/components/layout/UserCard';

const SECTION_LABEL =
  'px-2.5 pb-2 pt-1 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground';

type SidebarProps = Readonly<{
  // Appelé après une navigation (mobile : referme le panneau off-canvas).
  onNavigate?: () => void;
}>;

// Contenu de la sidebar (réutilisé desktop sticky + mobile off-canvas).
export function Sidebar({ onNavigate }: SidebarProps) {
  return (
    <div className="flex h-full w-full flex-col gap-1 bg-sidebar px-3.5 py-4.5">
      <Link
        to="/"
        onClick={onNavigate}
        className="flex items-center gap-2.5 rounded-lg px-2 pb-4 pt-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex size-[30px] shrink-0 items-center justify-center rounded-lg bg-primary">
          <Coffee className="size-[17px] text-primary-foreground" aria-hidden />
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight">
            FutureKawa
          </span>
          <span className="text-[11px] text-muted-foreground">Stocks · IoT</span>
        </span>
      </Link>

      <p className={SECTION_LABEL}>Navigation</p>
      <SidebarNav onNavigate={onNavigate} />

      <p className={`${SECTION_LABEL} mt-5`}>Pays</p>
      <SidebarCountryNav onNavigate={onNavigate} />

      <div className="flex-1" />

      <div className="flex flex-col gap-2">
        <SidebarThemeToggle />
        <UserCard />
      </div>
    </div>
  );
}
