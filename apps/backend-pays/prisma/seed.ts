import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../src/generated/prisma/client';

// Seed idempotent : ~20 lots de café vert répartis BR/EC/CO, avec des dates de
// stockage étalées pour exercer le FIFO (CDC §III.1) et couvrir les trois
// statuts (CONFORME / EN_ALERTE / PERIME, dont au moins un lot > 365j).
// Identifiants métier lisibles (`<PAYS>-<ANNEE>-<NNN>`) plutôt que cuid.

type Country = 'BR' | 'EC' | 'CO';
type LotStatus = 'CONFORME' | 'EN_ALERTE' | 'PERIME';

interface SeedLot {
  id: string;
  country: Country;
  farm: string;
  warehouse: string;
  daysAgoStored: number;
  status: LotStatus;
  daysAgoHarvest: number;
  qualityGrade: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Date de référence figée pour un seed reproductible (indépendant du jour).
const REFERENCE_DATE = new Date('2026-06-19T00:00:00.000Z');

function daysAgo(days: number): Date {
  return new Date(REFERENCE_DATE.getTime() - days * DAY_MS);
}

const SEED_LOTS: SeedLot[] = [
  // Brésil — Minas Gerais / São Paulo.
  { id: 'BR-2025-001', country: 'BR', farm: 'Fazenda Santa Clara', warehouse: 'Entrepôt Sul-1', daysAgoStored: 410, status: 'PERIME', daysAgoHarvest: 450, qualityGrade: 'Type 4/5' },
  { id: 'BR-2025-002', country: 'BR', farm: 'Fazenda Boa Vista', warehouse: 'Entrepôt Sul-1', daysAgoStored: 372, status: 'PERIME', daysAgoHarvest: 405, qualityGrade: 'Type 2' },
  { id: 'BR-2025-003', country: 'BR', farm: 'Fazenda Sertão', warehouse: 'Entrepôt Sul-2', daysAgoStored: 280, status: 'EN_ALERTE', daysAgoHarvest: 320, qualityGrade: 'Type 4/5' },
  { id: 'BR-2025-004', country: 'BR', farm: 'Fazenda Santa Clara', warehouse: 'Entrepôt Sul-2', daysAgoStored: 190, status: 'CONFORME', daysAgoHarvest: 225, qualityGrade: 'Type 2' },
  { id: 'BR-2026-005', country: 'BR', farm: 'Fazenda Aurora', warehouse: 'Entrepôt Sul-1', daysAgoStored: 95, status: 'CONFORME', daysAgoHarvest: 140, qualityGrade: 'Type 3' },
  { id: 'BR-2026-006', country: 'BR', farm: 'Fazenda Boa Vista', warehouse: 'Entrepôt Sul-3', daysAgoStored: 40, status: 'CONFORME', daysAgoHarvest: 70, qualityGrade: 'Type 2' },
  { id: 'BR-2026-007', country: 'BR', farm: 'Fazenda Aurora', warehouse: 'Entrepôt Sul-3', daysAgoStored: 12, status: 'CONFORME', daysAgoHarvest: 35, qualityGrade: 'Type 2' },

  // Équateur — Loja / Zamora.
  { id: 'EC-2025-001', country: 'EC', farm: 'Finca El Mirador', warehouse: 'Bodega Loja-A', daysAgoStored: 395, status: 'PERIME', daysAgoHarvest: 430, qualityGrade: 'Grade A' },
  { id: 'EC-2025-002', country: 'EC', farm: 'Finca La Esperanza', warehouse: 'Bodega Loja-A', daysAgoStored: 305, status: 'EN_ALERTE', daysAgoHarvest: 345, qualityGrade: 'Grade B' },
  { id: 'EC-2025-003', country: 'EC', farm: 'Finca El Mirador', warehouse: 'Bodega Loja-B', daysAgoStored: 210, status: 'CONFORME', daysAgoHarvest: 250, qualityGrade: 'Grade A' },
  { id: 'EC-2026-004', country: 'EC', farm: 'Finca Andina', warehouse: 'Bodega Loja-B', daysAgoStored: 120, status: 'CONFORME', daysAgoHarvest: 160, qualityGrade: 'Grade A' },
  { id: 'EC-2026-005', country: 'EC', farm: 'Finca La Esperanza', warehouse: 'Bodega Loja-A', daysAgoStored: 58, status: 'EN_ALERTE', daysAgoHarvest: 95, qualityGrade: 'Grade B' },
  { id: 'EC-2026-006', country: 'EC', farm: 'Finca Andina', warehouse: 'Bodega Loja-C', daysAgoStored: 21, status: 'CONFORME', daysAgoHarvest: 55, qualityGrade: 'Grade A' },
  { id: 'EC-2026-007', country: 'EC', farm: 'Finca El Mirador', warehouse: 'Bodega Loja-C', daysAgoStored: 5, status: 'CONFORME', daysAgoHarvest: 30, qualityGrade: 'Grade A' },

  // Colombie — Huila / Nariño.
  { id: 'CO-2025-001', country: 'CO', farm: 'Hacienda La Pradera', warehouse: 'Almacén Huila-1', daysAgoStored: 388, status: 'PERIME', daysAgoHarvest: 420, qualityGrade: 'Supremo' },
  { id: 'CO-2025-002', country: 'CO', farm: 'Hacienda El Roble', warehouse: 'Almacén Huila-1', daysAgoStored: 260, status: 'EN_ALERTE', daysAgoHarvest: 300, qualityGrade: 'Excelso' },
  { id: 'CO-2025-003', country: 'CO', farm: 'Hacienda La Pradera', warehouse: 'Almacén Huila-2', daysAgoStored: 175, status: 'CONFORME', daysAgoHarvest: 215, qualityGrade: 'Supremo' },
  { id: 'CO-2026-004', country: 'CO', farm: 'Hacienda Monteverde', warehouse: 'Almacén Nariño-1', daysAgoStored: 88, status: 'CONFORME', daysAgoHarvest: 125, qualityGrade: 'Supremo' },
  { id: 'CO-2026-005', country: 'CO', farm: 'Hacienda El Roble', warehouse: 'Almacén Nariño-1', daysAgoStored: 33, status: 'CONFORME', daysAgoHarvest: 68, qualityGrade: 'Excelso' },
  { id: 'CO-2026-006', country: 'CO', farm: 'Hacienda Monteverde', warehouse: 'Almacén Huila-2', daysAgoStored: 8, status: 'CONFORME', daysAgoHarvest: 40, qualityGrade: 'Supremo' },
];

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var for seed: ${key}`);
  }
  return value;
}

async function main(): Promise<void> {
  const databaseUrl = requireEnv('DATABASE_URL');
  const prisma = new PrismaClient({
    adapter: new PrismaMariaDb(databaseUrl),
  });

  try {
    for (const lot of SEED_LOTS) {
      const data = {
        country: lot.country,
        farm: lot.farm,
        warehouse: lot.warehouse,
        storedAt: daysAgo(lot.daysAgoStored),
        status: lot.status,
        harvestDate: daysAgo(lot.daysAgoHarvest),
        qualityGrade: lot.qualityGrade,
      };
      await prisma.lot.upsert({
        where: { id: lot.id },
        update: data,
        create: { id: lot.id, ...data },
      });
    }
    console.log(`Seeded ${SEED_LOTS.length} lots`);
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
