import type { AlertType } from '@futurekawa/contracts';
import type { Alert, NewAlert } from './alert';

// Port (ADR-0001 dependency rule) : l'application parle à cette interface,
// l'infrastructure (Prisma) l'implémente.
export const ALERT_REPOSITORY = Symbol('ALERT_REPOSITORY');

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
}
