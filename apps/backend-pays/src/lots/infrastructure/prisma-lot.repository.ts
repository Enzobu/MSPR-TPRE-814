import { Injectable } from '@nestjs/common';
import type { CountryCode, LotStatus } from '@futurekawa/contracts';
import { PrismaService } from '../../infrastructure/persistence/prisma.service';
import type { Lot, NewLot } from '../domain/lot';
import { LotAlreadyExistsError } from '../domain/lot.errors';
import type {
  FindManyParams,
  LotRepository,
  Page,
} from '../domain/lot.repository';

// Codes d'erreur Prisma connus.
const PRISMA_UNIQUE_VIOLATION = 'P2002'; // insert violant une contrainte unique
const PRISMA_RECORD_NOT_FOUND = 'P2025'; // update/delete sur un id inexistant

interface LotRow {
  id: string;
  country: string;
  farm: string;
  warehouse: string;
  storedAt: Date;
  status: string;
}

// Adapter Prisma du port LotRepository. Mappe la ligne Prisma vers l'entité
// domaine — aucun type Prisma ne franchit cette frontière.
@Injectable()
export class PrismaLotRepository implements LotRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(lot: NewLot): Promise<Lot> {
    try {
      const row = await this.prisma.lot.create({
        data: {
          id: lot.id,
          country: lot.country,
          farm: lot.farm,
          warehouse: lot.warehouse,
          storedAt: lot.storedAt,
        },
      });
      return this.toDomain(row);
    } catch (error) {
      // Filet anti-race : si un doublon concurrent franchit le pré-check
      // existsById, la contrainte d'unicité lève P2002 → 409 (pas 500).
      if (this.prismaErrorCode(error) === PRISMA_UNIQUE_VIOLATION) {
        throw new LotAlreadyExistsError(lot.id);
      }
      throw error;
    }
  }

  async existsById(id: string): Promise<boolean> {
    const count = await this.prisma.lot.count({ where: { id } });
    return count > 0;
  }

  async findById(id: string): Promise<Lot | null> {
    const row = await this.prisma.lot.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findManyByStoredAt(params: FindManyParams): Promise<Page<Lot>> {
    const where = params.country ? { country: params.country } : {};
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.lot.findMany({
        where,
        skip: params.skip,
        take: params.take,
        // `id` en clé secondaire : ordre stable entre pages quand des lots
        // partagent le même storedAt (sinon pagination non déterministe).
        orderBy: [{ storedAt: params.direction }, { id: 'asc' }],
      }),
      this.prisma.lot.count({ where }),
    ]);
    return { data: rows.map((row) => this.toDomain(row)), total };
  }

  async findExpirable(cutoff: Date): Promise<Lot[]> {
    const rows = await this.prisma.lot.findMany({
      where: {
        storedAt: { lt: cutoff },
        // Les lots déjà PERIME sont définitifs : inutile de les rescanner.
        status: { not: 'PERIME' },
      },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async updateStatus(id: string, status: LotStatus): Promise<Lot | null> {
    try {
      const row = await this.prisma.lot.update({
        where: { id },
        data: { status },
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

  private toDomain(row: LotRow): Lot {
    return {
      id: row.id,
      // Les enums Prisma Country/LotStatus sont les miroirs des unions contracts.
      country: row.country as CountryCode,
      farm: row.farm,
      warehouse: row.warehouse,
      storedAt: row.storedAt,
      status: row.status as LotStatus,
    };
  }
}
