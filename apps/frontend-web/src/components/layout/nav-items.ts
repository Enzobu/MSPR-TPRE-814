import { type ComponentType } from 'react';
import { Bell, Boxes, LayoutDashboard, type LucideProps } from 'lucide-react';

export interface SidebarNavItem {
  to: string;
  label: string;
  icon: ComponentType<LucideProps>;
  // `/` doit être actif uniquement sur l'index (end), sinon il matcherait
  // toutes les routes enfants via NavLink.
  end?: boolean;
}

export const SIDEBAR_NAV_ITEMS: readonly SidebarNavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/lots', label: 'Lots', icon: Boxes },
  { to: '/alerts', label: 'Alertes', icon: Bell },
];
