import type { Measurement, MeasurementBucket } from '@futurekawa/contracts';
import { toBucket, toMeasurement } from './measurement.mapper';

describe('measurement.mapper', () => {
  describe('toMeasurement', () => {
    it('should copy only the contract fields of a measurement', () => {
      // Arrange — extra field added by a pays backend must be filtered out.
      const measurement = {
        id: 'm-1',
        country: 'BR',
        warehouse: 'wh-1',
        temperatureCelsius: 21.5,
        humidityPercent: 55,
        recordedAt: '2026-06-19T10:00:00.000Z',
        injected: 'should-not-leak',
      } as unknown as Measurement;

      // Act
      const dto = toMeasurement(measurement);

      // Assert
      expect(dto).toEqual({
        id: 'm-1',
        country: 'BR',
        warehouse: 'wh-1',
        temperatureCelsius: 21.5,
        humidityPercent: 55,
        recordedAt: '2026-06-19T10:00:00.000Z',
      });
    });
  });

  describe('toBucket', () => {
    it('should copy only the contract fields of an aggregate bucket', () => {
      // Arrange
      const bucket = {
        bucketStart: '2026-06-19T10:00:00.000Z',
        avgTemperatureCelsius: 20.1,
        avgHumidityPercent: 60.4,
        count: 12,
        injected: 'should-not-leak',
      } as unknown as MeasurementBucket;

      // Act
      const dto = toBucket(bucket);

      // Assert
      expect(dto).toEqual({
        bucketStart: '2026-06-19T10:00:00.000Z',
        avgTemperatureCelsius: 20.1,
        avgHumidityPercent: 60.4,
        count: 12,
      });
    });
  });
});
