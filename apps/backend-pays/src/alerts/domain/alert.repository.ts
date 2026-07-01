import type { AlertType, CountryCode } from '@futurekawa/contracts';
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
  // Filtre pays optionnel. En déploiement réel, une instance pays ne détient
  // qu'un pays (filtre sans effet) ; en démo mono-instance (1 DB multi-pays),
  // il évite que le siège agrège/affiche les alertes d'un pays via ses 3 URLs.
  country?: CountryCode;
}

export interface AlertsPage {
  data: Alert[];
  total: number;
}

export interface AlertRepository {
  // Déduplication (ADR-0004) : existe-t-il déjà une alerte de ce type pour cet
  // entrepôt sur la journée calendaire UTC débutant à `dayUtc` ? La clé inclut
  // `country` : en démo mono-instance (1 DB multi-pays), deux entrepôts
  // homonymes de pays différents ne doivent pas partager la dédup (#147).
  existsForWarehouseOnDay(
    country: CountryCode,
    type: AlertType,
    warehouse: string,
    dayUtc: Date,
  ): Promise<boolean>;
  // Déduplication péremption (ADR-0004) : l'entité de dédup est le `lotId` (et
  // non l'entrepôt), scopée par `country` pour la même raison (#147). Existe-t-il
  // déjà une alerte de ce type pour ce lot sur la journée calendaire UTC ?
  existsForLotOnDay(
    country: CountryCode,
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
