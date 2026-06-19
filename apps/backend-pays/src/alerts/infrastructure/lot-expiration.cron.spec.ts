import type { PinoLogger } from 'nestjs-pino';
import type { ExpireLotsUseCase } from '../application/expire-lots.use-case';
import { LotExpirationCron } from './lot-expiration.cron';

describe('LotExpirationCron', () => {
  let execute: jest.Mock;
  let error: jest.Mock;
  let cron: LotExpirationCron;

  beforeEach(() => {
    execute = jest.fn().mockResolvedValue(undefined);
    error = jest.fn();
    const expireLots = { execute } as unknown as ExpireLotsUseCase;
    const logger = { error } as unknown as PinoLogger;
    cron = new LotExpirationCron(expireLots, logger);
  });

  it('should trigger the expire lots use case with the current date', async () => {
    // Act
    await cron.handleDailyExpiration();

    // Assert
    expect(execute).toHaveBeenCalledTimes(1);
    // WHY: jest.Mock.calls is typed `any[]` — on indexe via unknown[] pour rester type-safe.
    expect((execute.mock.calls[0] as unknown[])[0]).toBeInstanceOf(Date);
    expect(error).not.toHaveBeenCalled();
  });

  it('should log and swallow errors so the scheduler keeps running', async () => {
    // Arrange
    const failure = new Error('db down');
    execute.mockRejectedValue(failure);

    // Act
    await cron.handleDailyExpiration();

    // Assert
    expect(error).toHaveBeenCalledWith(
      { err: failure },
      'Cron péremption en échec',
    );
  });
});
