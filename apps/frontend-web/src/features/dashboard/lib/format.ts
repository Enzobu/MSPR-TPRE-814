import type { AlertType } from '@futurekawa/contracts';

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

// Formate un écart temporel court (« il y a 3 min ») pour la liste compacte des
// alertes récentes du dashboard. Affichage purement front.
export function formatAgo(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  const diff = Date.now() - date.getTime();
  if (diff < MINUTE_MS) {
    return "à l'instant";
  }
  if (diff < HOUR_MS) {
    return `il y a ${Math.floor(diff / MINUTE_MS)} min`;
  }
  if (diff < DAY_MS) {
    return `il y a ${Math.floor(diff / HOUR_MS)} h`;
  }
  return `il y a ${Math.floor(diff / DAY_MS)} j`;
}

export interface AlertSeverityStyle {
  chip: string;
  label: string;
}

// Mappe le type d'alerte vers son style de chip (sévérité visuelle) et son
// libellé court FR. LOT_EXPIRED = périmé (rouge), hors-plage = alerte (ambre).
const SEVERITY_BY_TYPE: Record<AlertType, AlertSeverityStyle> = {
  TEMPERATURE_OUT_OF_RANGE: {
    chip: 'bg-status-alerte/15 text-status-alerte',
    label: 'Température',
  },
  HUMIDITY_OUT_OF_RANGE: {
    chip: 'bg-status-alerte/15 text-status-alerte',
    label: 'Humidité',
  },
  LOT_EXPIRED: {
    chip: 'bg-status-perime/15 text-status-perime',
    label: 'Péremption',
  },
};

export function alertSeverityStyle(type: AlertType): AlertSeverityStyle {
  return SEVERITY_BY_TYPE[type];
}
