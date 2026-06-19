import { Injectable } from '@nestjs/common';
import type { AlertType, CountryCode } from '@futurekawa/contracts';
import { PrismaService } from '../../infrastructure/persistence/prisma.service';
import type { Alert, NewAlert } from '../domain/alert';
import type {
  AlertRepository,
  AlertsPage,
  FindManyAlertsParams,
} from '../domain/alert.repository';

// update/delete sur un id inexistant.
const PRISMA_RECORD_NOT_FOUND = 'P2025';

interface AlertRow {
  id: string;
  country: string;
  type: string;
  message: string;
  lotId: string | null;
  warehouse: string | null;
  triggeredAt: Date;
  acknowledged: boolean;
}

const addDay = (day: Date): Date =>
  new Date(day.getTime() + 24 * 60 * 60 * 1000);

// Adapter Prisma du port AlertRepository. Mappe la ligne Prisma vers l'entité
// domaine — aucun type Prisma ne franchit cette frontière.
@Injectable()
export class PrismaAlertRepository implements AlertRepository {
  constructor(private readonly prisma: PrismaService) {}

  async existsForWarehouseOnDay(
    type: AlertType,
    warehouse: string,
    dayUtc: Date,
  ): Promise<boolean> {
    const count = await this.prisma.alert.count({
      where: {
        type,
        warehouse,
        // Fenêtre [début de jour UTC, début du jour suivant).
        triggeredAt: { gte: dayUtc, lt: addDay(dayUtc) },
      },
    });
    return count > 0;
  }

  async existsForLotOnDay(
    type: AlertType,
    lotId: string,
    dayUtc: Date,
  ): Promise<boolean> {
    const count = await this.prisma.alert.count({
      where: {
        type,
        lotId,
        // Fenêtre [début de jour UTC, début du jour suivant).
        triggeredAt: { gte: dayUtc, lt: addDay(dayUtc) },
      },
    });
    return count > 0;
  }

  async save(alert: NewAlert): Promise<Alert> {
    const row = await this.prisma.alert.create({
      data: {
        country: alert.country,
        type: alert.type,
        message: alert.message,
        lotId: alert.lotId,
        warehouse: alert.warehouse,
        triggeredAt: alert.triggeredAt,
      },
    });
    return this.toDomain(row);
  }

  async findMany(params: FindManyAlertsParams): Promise<AlertsPage> {
    const where = {
      ...(params.type !== undefined ? { type: params.type } : {}),
      ...(params.acknowledged !== undefined
        ? { acknowledged: params.acknowledged }
        : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.alert.findMany({
        where,
        skip: params.skip,
        take: params.take,
        // `id` en clé secondaire : ordre stable entre pages quand des alertes
        // partagent le même triggeredAt (sinon pagination non déterministe).
        orderBy: [{ triggeredAt: 'desc' }, { id: 'asc' }],
      }),
      this.prisma.alert.count({ where }),
    ]);
    return { data: rows.map((row) => this.toDomain(row)), total };
  }

  async findById(id: string): Promise<Alert | null> {
    const row = await this.prisma.alert.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async acknowledge(id: string): Promise<Alert | null> {
    try {
      const row = await this.prisma.alert.update({
        where: { id },
        data: { acknowledged: true },
      });
      return this.toDomain(row);
    } catch (error) {
      if (this.prismaErrorCode(error) === PRISMA_RECORD_NOT_FOUND) {
        return null;
      }
      throw error;
    }
  }

  private prismaErrorCode(error: unknown): string | undefined {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const code = (error as { code: unknown }).code;
      return typeof code === 'string' ? code : undefined;
    }
    return undefined;
  }

  private toDomain(row: AlertRow): Alert {
    return {
      id: row.id,
      // L'enum Prisma Country est le miroir de l'union contracts CountryCode.
      country: row.country as CountryCode,
      // L'enum Prisma AlertType est le miroir de l'union contracts AlertType.
      type: row.type as AlertType,
      message: row.message,
      lotId: row.lotId ?? undefined,
      warehouse: row.warehouse ?? undefined,
      triggeredAt: row.triggeredAt,
      acknowledged: row.acknowledged,
    };
  }
}
