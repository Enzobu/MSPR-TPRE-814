import {
  AlertTriangle,
  Check,
  OctagonAlert,
  type LucideIcon,
} from 'lucide-react';
import type { LotStatus } from '@futurekawa/contracts';

export interface LotStatusConfig {
  label: string;
  icon: LucideIcon;
  // Pill teintée : fond léger (token /15) + texte sur la teinte de statut.
  className: string;
  // Couleur du dot des chips de filtre statut.
  dotClassName: string;
}

export const LOT_STATUS_CONFIG: Record<LotStatus, LotStatusConfig> = {
  CONFORME: {
    label: 'Conforme',
    icon: Check,
    className: 'bg-status-conforme/15 text-status-conforme-foreground',
    dotClassName: 'bg-status-conforme',
  },
  EN_ALERTE: {
    label: 'En alerte',
    icon: AlertTriangle,
    className: 'bg-status-alerte/15 text-status-alerte-foreground',
    dotClassName: 'bg-status-alerte',
  },
  PERIME: {
    label: 'Périmé',
    icon: OctagonAlert,
    className: 'bg-status-perime/15 text-status-perime-foreground',
    dotClassName: 'bg-status-perime',
  },
};
