import { Injectable } from '@nestjs/common';
import type { CountryCode } from '@futurekawa/contracts';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/persistence/prisma.service';
import type {
  Measurement,
  MeasurementBucket,
  NewMeasurement,
} from '../domain/measurement';
import type {
  AggregateParams,
  FindHistoryParams,
  MeasurementRepository,
  Page,
  TimeRange,
} from '../domain/measurement.repository';

interface MeasurementRow {
  id: string;
  country: string;
  warehouse: string;
  temperatureCelsius: number;
  humidityPercent: number;
  recordedAt: Date;
}

// Ligne brute renvoyée par l'agrégat SQL. MariaDB renvoie AVG en string et
// FLOOR/COUNT en BigInt selon le driver — la conversion vit dans toBucket.
interface BucketRow {
  bucketIndex: bigint | number | string;
  avgTemperatureCelsius: string | number;
  avgHumidityPercent: string | number;
  count: bigint | number | string;
}

// Adapter Prisma du port MeasurementRepository. Mappe la ligne Prisma vers
// l'entité domaine — aucun type Prisma ne franchit cette frontière.
@Injectable()
export class PrismaMeasurementRepository implements MeasurementRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(measurement: NewMeasurement): Promise<Measurement> {
    const row = await this.prisma.measurement.create({
      data: {
        country: measurement.country,
        warehouse: measurement.warehouse,
        temperatureCelsius: measurement.temperatureCelsius,
        humidityPercent: measurement.humidityPercent,
        recordedAt: measurement.recordedAt,
      },
    });
    return this.toDomain(row);
  }

  async findHistory(params: FindHistoryParams): Promise<Page<Measurement>> {
    const where = {
      warehouse: params.warehouse,
      recordedAt: this.recordedAtFilter(params),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.measurement.findMany({
        where,
        skip: params.skip,
        take: params.take,
        // Plus récent d'abord ; `id` en clé secondaire pour un ordre stable
        // entre pages quand des mesures partagent le même recordedAt.
        orderBy: [{ recordedAt: 'desc' }, { id: 'asc' }],
      }),
      this.prisma.measurement.count({ where }),
    ]);
    return { data: rows.map((row) => this.toDomain(row)), total };
  }

  async findLatest(country?: CountryCode): Promise<Measurement | null> {
    // `id` en clé secondaire : ordre déterministe si deux relevés partagent le
    // même recordedAt (rule : pas de findFirst sans orderBy stable). `country`
    // scope la démo mono-instance (cf. #144), no-op en déploiement réel.
    const row = await this.prisma.measurement.findFirst({
      where: country ? { country } : {},
      orderBy: [{ recordedAt: 'desc' }, { id: 'asc' }],
    });
    return row ? this.toDomain(row) : null;
  }

  async aggregate(params: AggregateParams): Promise<MeasurementBucket[]> {
    // bucketSeconds est lié en paramètre (jamais interpolé) : pas d'injection.
    // FLOOR(UNIX_TIMESTAMP/bucket) regroupe les relevés par fenêtre temporelle.
    const rows = await this.prisma.$queryRaw<BucketRow[]>`
      SELECT
        FLOOR(UNIX_TIMESTAMP(recordedAt) / ${params.bucketSeconds}) AS bucketIndex,
        AVG(temperatureCelsius) AS avgTemperatureCelsius,
        AVG(humidityPercent) AS avgHumidityPercent,
        COUNT(*) AS count
      FROM measurements
      WHERE warehouse = ${params.warehouse}
        ${this.rawRecordedAtFilter(params)}
      GROUP BY bucketIndex
      ORDER BY bucketIndex ASC
    `;
    return rows.map((row) => this.toBucket(row, params.bucketSeconds));
  }

  private recordedAtFilter(range: TimeRange):
    | {
        gte?: Date;
        lte?: Date;
      }
    | undefined {
    if (!range.from && !range.to) {
      return undefined;
    }
    return {
      ...(range.from ? { gte: range.from } : {}),
      ...(range.to ? { lte: range.to } : {}),
    };
  }

  private rawRecordedAtFilter(range: TimeRange): Prisma.Sql {
    const clauses: Prisma.Sql[] = [];
    if (range.from) {
      clauses.push(Prisma.sql`AND recordedAt >= ${range.from}`);
    }
    if (range.to) {
      clauses.push(Prisma.sql`AND recordedAt <= ${range.to}`);
    }
    return clauses.length ? Prisma.join(clauses, ' ') : Prisma.empty;
  }

  private toDomain(row: MeasurementRow): Measurement {
    return {
      id: row.id,
      // L'enum Prisma Country est le miroir de l'union contracts CountryCode.
      country: row.country as CountryCode,
      warehouse: row.warehouse,
      temperatureCelsius: row.temperatureCelsius,
      humidityPercent: row.humidityPercent,
      recordedAt: row.recordedAt,
    };
  }

  private toBucket(row: BucketRow, bucketSeconds: number): MeasurementBucket {
    const bucketIndex = Number(row.bucketIndex);
    return {
      bucketStart: new Date(bucketIndex * bucketSeconds * 1000),
      avgTemperatureCelsius: Number(row.avgTemperatureCelsius),
      avgHumidityPercent: Number(row.avgHumidityPercent),
      count: Number(row.count),
    };
  }
}
