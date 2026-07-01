import type { PinoLogger } from 'nestjs-pino';
import type { CountryCode, LotStatus } from '@futurekawa/contracts';
import type { Lot } from '../../lots/domain/lot';
import type { LotRepository } from '../../lots/domain/lot.repository';
import type { Alert, NewAlert } from '../domain/alert';
import type { AlertNotifier } from '../domain/alert-notifier';
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
  let notify: jest.Mock<Promise<void>, [Alert]>;
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
    notify = jest.fn<Promise<void>, [Alert]>().mockResolvedValue(undefined);
    const notifier: AlertNotifier = { notify };
    useCase = new ExpireLotsUseCase(lots, alerts, notifier, silentLogger);
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
    expect(notify).toHaveBeenCalledWith({ id: 'a1' });
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

  it('should scope the dedup lookup by country (country first argument)', async () => {
    // Arrange
    findExpirable.mockResolvedValue([buildLot({ id: 'L-400', country: 'BR' })]);

    // Act
    await useCase.execute(now);

    // Assert — sans le pays, deux lots homonymes partageraient la dédup (#147).
    expect(existsForLotOnDay).toHaveBeenCalledWith(
      'BR',
      'LOT_EXPIRED',
      'L-400',
      expect.any(Date),
    );
  });

  it('should raise two distinct alerts for homonym lots of different countries on the same day (#147)', async () => {
    // Arrange — dédup réaliste keyée par (pays, type, lot) : reproduit la démo
    // mono-instance où BR et EC partagent la même DB et un id de lot homonyme.
    findExpirable.mockResolvedValue([
      buildLot({ id: 'L-1', country: 'BR' }),
      buildLot({ id: 'L-1', country: 'EC' }),
    ]);
    const raised = new Set<string>();
    existsForLotOnDay.mockImplementation(
      (country: CountryCode, type: string, lotId: string) =>
        Promise.resolve(raised.has(`${country}|${type}|${lotId}`)),
    );
    save.mockImplementation((alert: NewAlert) => {
      raised.add(`${alert.country}|${alert.type}|${alert.lotId}`);
      return Promise.resolve({ id: `a-${raised.size}` } as Alert);
    });

    // Act
    await useCase.execute(now);

    // Assert — deux alertes distinctes, une par pays.
    expect(save).toHaveBeenCalledTimes(2);
    expect(save.mock.calls.map((call) => call[0].country)).toEqual([
      'BR',
      'EC',
    ]);
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
