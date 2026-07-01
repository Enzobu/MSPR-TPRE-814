import type { CountryCode } from '@futurekawa/contracts';
import type {
  Measurement,
  MeasurementBucket,
  NewMeasurement,
} from './measurement';

// Port (ADR-0001 dependency rule) : l'application parle à cette interface,
// l'infrastructure (Prisma) l'implémente.
export const MEASUREMENT_REPOSITORY = Symbol('MEASUREMENT_REPOSITORY');

// Bornes temporelles optionnelles d'une requête (historique ou agrégat).
export interface TimeRange {
  from?: Date;
  to?: Date;
}

export interface FindHistoryParams extends TimeRange {
  warehouse: string;
  skip: number;
  take: number;
}

export interface AggregateParams extends TimeRange {
  warehouse: string;
  // Taille de la fenêtre d'agrégation en secondes (1h = 3600, 1d = 86400).
  bucketSeconds: number;
}

export interface Page<T> {
  data: T[];
  total: number;
}

export interface MeasurementRepository {
  // Insertion d'un relevé (utilisée par le subscriber MQTT #28).
  save(measurement: NewMeasurement): Promise<Measurement>;
  // Historique paginé d'un entrepôt, trié recordedAt décroissant.
  findHistory(params: FindHistoryParams): Promise<Page<Measurement>>;
  // Moyennes T°/humidité par fenêtre temporelle, triées chronologiquement.
  aggregate(params: AggregateParams): Promise<MeasurementBucket[]>;
  // Relevé le plus récent (null si aucun) : alimente la vue « dernier relevé par
  // région » du siège (#143). `country` optionnel scope la recherche : no-op en
  // déploiement réel (1 pays/instance), mais évite en démo mono-instance (1 DB
  // multi-pays) que chaque région renvoie le même relevé global (cf. #144).
  findLatest(country?: CountryCode): Promise<Measurement | null>;
}
