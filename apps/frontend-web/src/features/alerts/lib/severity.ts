import {
  Droplets,
  OctagonAlert,
  Thermometer,
  type LucideIcon,
} from 'lucide-react';
import type { AlertType } from '@futurekawa/contracts';

// Le type `Alert` de contracts ne porte PAS de champ sévérité ni de valeur
// déclenchante : la « gravité » visuelle est dérivée du seul `type`. Hors-plage
// T°/humidité = alerte (ambre), lot périmé = perime (rouge). Mapping cohérent
// avec le dashboard (RecentAlerts).
export interface AlertSeverity {
  // Libellé court de la pill (Température / Humidité / Péremption).
  label: string;
  // Classe de la pill colorée (token statut, jamais de hex en dur).
  pillClassName: string;
  // Classe du chip carré teinté (entête détail / icône).
  chipClassName: string;
  // Icône lucide associée au type.
  Icon: LucideIcon;
  // Métrique mesure liée, ou null pour les alertes sans courbe (péremption).
  metric: 'temperature' | 'humidity' | null;
}

const OUT_OF_RANGE_PILL = 'bg-status-alerte/15 text-status-alerte';
const OUT_OF_RANGE_CHIP = 'bg-status-alerte/15 text-status-alerte';
const EXPIRED_PILL = 'bg-status-perime/15 text-status-perime';
const EXPIRED_CHIP = 'bg-status-perime/15 text-status-perime';

const SEVERITY_BY_TYPE: Record<AlertType, AlertSeverity> = {
  TEMPERATURE_OUT_OF_RANGE: {
    label: 'Température',
    pillClassName: OUT_OF_RANGE_PILL,
    chipClassName: OUT_OF_RANGE_CHIP,
    Icon: Thermometer,
    metric: 'temperature',
  },
  HUMIDITY_OUT_OF_RANGE: {
    label: 'Humidité',
    pillClassName: OUT_OF_RANGE_PILL,
    chipClassName: OUT_OF_RANGE_CHIP,
    Icon: Droplets,
    metric: 'humidity',
  },
  LOT_EXPIRED: {
    label: 'Péremption',
    pillClassName: EXPIRED_PILL,
    chipClassName: EXPIRED_CHIP,
    Icon: OctagonAlert,
    metric: null,
  },
};

export function alertSeverity(type: AlertType): AlertSeverity {
  return SEVERITY_BY_TYPE[type];
}
