import type { CountryCode } from './country';

export type LotStatus = 'CONFORME' | 'EN_ALERTE' | 'PERIME';

export interface Lot {
  id: string;
  country: CountryCode;
  farm: string;
  warehouse: string;
  storedAt: string;
  status: LotStatus;
}

export interface CreateLotDto {
  id: string;
  country: CountryCode;
  farm: string;
  warehouse: string;
  storedAt: string;
}
