import type { PinoLogger } from 'nestjs-pino';
import type { CountryCode, LotStatus } from '@futurekawa/contracts';
import type { Lot } from '../../lots/domain/lot';
import type { LotRepository } from '../../lots/domain/lot.repository';
import type { Alert, NewAlert } from '../domain/alert';
import type { AlertRepository } from '../domain/alert.repository';
import { ExpireLotsUseCase } from './expire-lots.use-case';

// WHY: seuls info/warn sont appelés ; on type vers PinoLogger pour éviter un `any`.
const silentLogger = {
  info: jest.fn(),
  warn: jest.fn(),
} as unknown as PinoLogger;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const buildLot = (over: Partial<Lot> = {}): Lot => ({
  id: 'L-400',
  country: 'BR' as CountryCode,
  farm: 'Fazenda',
  warehouse: 'W1',
  storedAt: new Date(Date.now() - 400 * MS_PER_DAY),
  status: 'CONFORME',
  ...over,
});

describe('ExpireLotsUseCase', () => {
  const now = new Date('2026-06-19T02:00:00.000Z');

  let findExpirable: jest.Mock<Promise<Lot[]>>;
  let updateStatus: jest.Mock<Promise<Lot | null>, [string, LotStatus]>;
  let existsForLotOnDay: jest.Mock<Promise<boolean>>;
  let save: jest.Mock<Promise<Alert>, [NewAlert]>;
  let useCase: ExpireLotsUseCase;

  beforeEach(() => {
    findExpirable = jest.fn<Promise<Lot[]>, never>().mockResolvedValue([]);
    updateStatus = jest
      .fn<Promise<Lot | null>, [string, LotStatus]>()
      .mockResolvedValue(null);
    existsForLotOnDay = jest
      .fn<Promise<boolean>, never>()
      .mockResolvedValue(false);
    save = jest
      .fn<Promise<Alert>, [NewAlert]>()
      .mockResolvedValue({ id: 'a1' } as Alert);

    const lots = {
      findExpirable,
      updateStatus,
    } as unknown as LotRepository;
    const alerts = {
      existsForLotOnDay,
      save,
    } as unknown as AlertRepository;
    useCase = new ExpireLotsUseCase(lots, alerts, silentLogger);
  });

  it('should mark an expirable lot as PERIME and raise a LOT_EXPIRED alert', async () => {
    // Arrange
    findExpirable.mockResolvedValue([buildLot({ id: 'L-400' })]);

    // Act
    await useCase.execute(now);

    // Assert
    expect(updateStatus).toHaveBeenCalledWith('L-400', 'PERIME');
    expect(save).toHaveBeenCalledTimes(1);
    const saved = save.mock.calls[0][0];
    expect(saved).toMatchObject({
      type: 'LOT_EXPIRED',
      lotId: 'L-400',
      country: 'BR',
      warehouse: 'W1',
    });
    expect(saved.triggeredAt).toBe(now);
  });

  it('should not raise a second alert when one already exists today (idempotent)', async () => {
    // Arrange
    findExpirable.mockResolvedValue([buildLot({ id: 'L-400' })]);
    existsForLotOnDay.mockResolvedValue(true);

    // Act
    await useCase.execute(now);

    // Assert : le statut est (re)posé mais aucune nouvelle alerte.
    expect(updateStatus).toHaveBeenCalledWith('L-400', 'PERIME');
    expect(save).not.toHaveBeenCalled();
  });

  it('should do nothing when no lot is expirable', async () => {
    // Arrange
    findExpirable.mockResolvedValue([]);

    // Act
    await useCase.execute(now);

    // Assert
    expect(updateStatus).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  it('should continue scanning when one lot fails', async () => {
    // Arrange : le 1er lot échoue à l'update, le 2e doit quand même être traité.
    findExpirable.mockResolvedValue([
      buildLot({ id: 'L-fail' }),
      buildLot({ id: 'L-ok' }),
    ]);
    updateStatus.mockImplementation((id: string) => {
      if (id === 'L-fail') {
        throw new Error('boom');
      }
      return Promise.resolve(null);
    });

    // Act
    await useCase.execute(now);

    // Assert
    expect(updateStatus).toHaveBeenCalledWith('L-ok', 'PERIME');
    expect(save).toHaveBeenCalledTimes(1);
    expect(save.mock.calls[0][0].lotId).toBe('L-ok');
  });
});
