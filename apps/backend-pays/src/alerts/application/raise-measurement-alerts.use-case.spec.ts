import type { PinoLogger } from 'nestjs-pino';
import type { CountryCode } from '@futurekawa/contracts';
import type { Alert, NewAlert } from '../domain/alert';
import type { AlertNotifier } from '../domain/alert-notifier';
import type { AlertRepository } from '../domain/alert.repository';
import { RaiseMeasurementAlertsUseCase } from './raise-measurement-alerts.use-case';
import type { MeasurementForAlerting } from './raise-measurement-alerts.use-case';

// WHY: seul `warn` est appelé ; on type vers PinoLogger pour éviter un `any`.
const silentLogger = { warn: jest.fn() } as unknown as PinoLogger;

describe('RaiseMeasurementAlertsUseCase', () => {
  let existsForWarehouseOnDay: jest.Mock<Promise<boolean>>;
  let save: jest.Mock<Promise<Alert>, [NewAlert]>;
  let notify: jest.Mock<Promise<void>, [Alert]>;
  let useCase: RaiseMeasurementAlertsUseCase;

  const outOfRange: MeasurementForAlerting = {
    country: 'BR' as CountryCode,
    warehouse: 'W1',
    temperatureCelsius: 40,
    humidityPercent: 55,
  };
  const inRange: MeasurementForAlerting = {
    country: 'BR' as CountryCode,
    warehouse: 'W1',
    temperatureCelsius: 29,
    humidityPercent: 55,
  };

  beforeEach(() => {
    existsForWarehouseOnDay = jest.fn<Promise<boolean>, never>();
    save = jest
      .fn<Promise<Alert>, [NewAlert]>()
      .mockResolvedValue({ id: 'a1' } as Alert);
    const alerts: AlertRepository = {
      existsForWarehouseOnDay,
      // Non utilisé ici (dédup mesure par entrepôt) ; présent pour le contrat.
      existsForLotOnDay: jest.fn<Promise<boolean>, never>(),
      save,
    };
    notify = jest.fn<Promise<void>, [Alert]>().mockResolvedValue(undefined);
    const notifier: AlertNotifier = { notify };
    useCase = new RaiseMeasurementAlertsUseCase(alerts, notifier, silentLogger);
  });

  it('should persist an alert when out of range and none raised today', async () => {
    // Arrange
    existsForWarehouseOnDay.mockResolvedValue(false);

    // Act
    await useCase.execute(outOfRange);

    // Assert
    expect(save).toHaveBeenCalledTimes(1);
    const savedAlert = save.mock.calls[0][0];
    expect(savedAlert).toMatchObject({
      country: 'BR',
      type: 'TEMPERATURE_OUT_OF_RANGE',
      warehouse: 'W1',
    });
    expect(savedAlert.triggeredAt).toBeInstanceOf(Date);
    expect(notify).toHaveBeenCalledWith({ id: 'a1' });
  });

  it('should not persist when an alert of the same type already exists today (dedup)', async () => {
    // Arrange
    existsForWarehouseOnDay.mockResolvedValue(true);

    // Act
    await useCase.execute(outOfRange);

    // Assert
    expect(save).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();
  });

  it('should neither check nor persist when the measurement is in range', async () => {
    // Act
    await useCase.execute(inRange);

    // Assert
    expect(existsForWarehouseOnDay).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  it('should scope the dedup lookup by country (country first argument)', async () => {
    // Arrange
    existsForWarehouseOnDay.mockResolvedValue(false);

    // Act
    await useCase.execute(outOfRange);

    // Assert — sans le pays, deux entrepôts homonymes partageraient la dédup (#147).
    expect(existsForWarehouseOnDay).toHaveBeenCalledWith(
      'BR',
      'TEMPERATURE_OUT_OF_RANGE',
      'W1',
      expect.any(Date),
    );
  });

  it('should raise two distinct alerts for homonym warehouses of different countries on the same day (#147)', async () => {
    // Arrange — dédup réaliste keyée par (pays, type, entrepôt) : reproduit la
    // démo mono-instance où BR et EC partagent la même DB et un entrepôt homonyme.
    const raised = new Set<string>();
    existsForWarehouseOnDay.mockImplementation(
      (country: CountryCode, type: string, warehouse: string) =>
        Promise.resolve(raised.has(`${country}|${type}|${warehouse}`)),
    );
    save.mockImplementation((alert: NewAlert) => {
      raised.add(`${alert.country}|${alert.type}|${alert.warehouse}`);
      return Promise.resolve({ id: `a-${raised.size}` } as Alert);
    });

    // Act — même entrepôt "W1", pays différents, même jour. Humidité dans la
    // plage de chaque pays pour n'isoler que l'alerte température (seuils par pays).
    await useCase.execute({
      country: 'BR' as CountryCode,
      warehouse: 'W1',
      temperatureCelsius: 40,
      humidityPercent: 55,
    });
    await useCase.execute({
      country: 'EC' as CountryCode,
      warehouse: 'W1',
      temperatureCelsius: 40,
      humidityPercent: 60,
    });

    // Assert — deux alertes distinctes, une par pays.
    expect(save).toHaveBeenCalledTimes(2);
    expect(save.mock.calls.map((call) => call[0].country)).toEqual([
      'BR',
      'EC',
    ]);
  });
});
