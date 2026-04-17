import type { CountryCode } from './country';

export type AlertType = 'TEMPERATURE_OUT_OF_RANGE' | 'HUMIDITY_OUT_OF_RANGE' | 'LOT_EXPIRED';

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
