import type { PinoLogger } from 'nestjs-pino';
import type { CountryCode } from '@futurekawa/contracts';
import type { Alert, NewAlert } from '../domain/alert';
import type { AlertRepository } from '../domain/alert.repository';
import { RaiseMeasurementAlertsUseCase } from './raise-measurement-alerts.use-case';
import type { MeasurementForAlerting } from './raise-measurement-alerts.use-case';

// WHY: seul `warn` est appelé ; on type vers PinoLogger pour éviter un `any`.
const silentLogger = { warn: jest.fn() } as unknown as PinoLogger;

describe('RaiseMeasurementAlertsUseCase', () => {
  let existsForWarehouseOnDay: jest.Mock<Promise<boolean>>;
  let save: jest.Mock<Promise<Alert>, [NewAlert]>;
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
    useCase = new RaiseMeasurementAlertsUseCase(alerts, silentLogger);
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
  });

  it('should not persist when an alert of the same type already exists today (dedup)', async () => {
    // Arrange
    existsForWarehouseOnDay.mockResolvedValue(true);

    // Act
    await useCase.execute(outOfRange);

    // Assert
    expect(save).not.toHaveBeenCalled();
  });

  it('should neither check nor persist when the measurement is in range', async () => {
    // Act
    await useCase.execute(inRange);

    // Assert
    expect(existsForWarehouseOnDay).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });
});
