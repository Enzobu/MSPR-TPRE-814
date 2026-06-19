import { Injectable } from '@nestjs/common';
import type { AlertType, CountryCode } from '@futurekawa/contracts';
import { PrismaService } from '../../infrastructure/persistence/prisma.service';
import type { Alert, NewAlert } from '../domain/alert';
import type { AlertRepository } from '../domain/alert.repository';

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
