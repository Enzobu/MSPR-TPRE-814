import type { CountryCode } from './country';

// Source unique de vérité des statuts de lot : le type dérive du tableau, qui
// sert aussi de référentiel runtime (validation `@IsIn`, enums Swagger).
export const LOT_STATUSES = ['CONFORME', 'EN_ALERTE', 'PERIME'] as const;
export type LotStatus = (typeof LOT_STATUSES)[number];

// Source unique de vérité de la péremption (ADR-0004, CDC §III.4) : un lot
// stocké depuis plus de `LOT_MAX_AGE_DAYS` jours est considéré périmé. Ne jamais
// recoder cette valeur en dur ailleurs.
export const LOT_MAX_AGE_DAYS = 365;

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

export interface UpdateLotStatusDto {
  status: LotStatus;
}
