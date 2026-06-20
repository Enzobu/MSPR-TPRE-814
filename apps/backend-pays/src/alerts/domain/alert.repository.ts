import type { AlertType } from '@futurekawa/contracts';
import type { Alert, NewAlert } from './alert';

// Port (ADR-0001 dependency rule) : l'application parle à cette interface,
// l'infrastructure (Prisma) l'implémente.
export const ALERT_REPOSITORY = Symbol('ALERT_REPOSITORY');

// Filtres + pagination de findMany. `type`/`acknowledged` optionnels (absents =
// pas de filtre). `skip`/`take` calculés par l'application depuis page/pageSize.
export interface FindManyAlertsParams {
  type?: AlertType;
  acknowledged?: boolean;
  skip: number;
  take: number;
}

export interface AlertsPage {
  data: Alert[];
  total: number;
}

export interface AlertRepository {
  // Déduplication (ADR-0004) : existe-t-il déjà une alerte de ce type pour cet
  // entrepôt sur la journée calendaire UTC débutant à `dayUtc` ?
  existsForWarehouseOnDay(
    type: AlertType,
    warehouse: string,
    dayUtc: Date,
  ): Promise<boolean>;
  // Déduplication péremption (ADR-0004) : l'entité de dédup est le `lotId` (et
  // non l'entrepôt). Existe-t-il déjà une alerte de ce type pour ce lot sur la
  // journée calendaire UTC débutant à `dayUtc` ?
  existsForLotOnDay(
    type: AlertType,
    lotId: string,
    dayUtc: Date,
  ): Promise<boolean>;
  // Insertion d'une alerte (acknowledged=false posé en base).
  save(alert: NewAlert): Promise<Alert>;
  // Liste paginée (#35) : tri triggeredAt desc, clé secondaire id asc pour une
  // pagination stable. Filtres optionnels type/acknowledged.
  findMany(params: FindManyAlertsParams): Promise<AlertsPage>;
  findById(id: string): Promise<Alert | null>;
  // Passe acknowledged=true ; renvoie null si l'alerte n'existe pas.
  acknowledge(id: string): Promise<Alert | null>;
}
