import type { CountryCode } from './country';

export const ALERT_TYPES = ['TEMPERATURE_OUT_OF_RANGE', 'HUMIDITY_OUT_OF_RANGE', 'LOT_EXPIRED'] as const;
export type AlertType = (typeof ALERT_TYPES)[number];

export interface Alert {
  id: string;
  country: CountryCode;
  type: AlertType;
  message: string;
  lotId?: string;
  warehouse?: string;
  triggeredAt: string;
  acknowledged: boolean;
}
