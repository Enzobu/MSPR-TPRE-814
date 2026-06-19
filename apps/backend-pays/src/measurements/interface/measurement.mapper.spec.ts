import type { Measurement, MeasurementBucket } from '../domain/measurement';
import { toBucketResponse, toMeasurementResponse } from './measurement.mapper';

describe('toMeasurementResponse', () => {
  it('should map a domain measurement to the response dto with ISO recordedAt', () => {
    // Arrange
    const measurement: Measurement = {
      id: 'm-1',
      country: 'BR',
      warehouse: 'W1',
      temperatureCelsius: 22.5,
      humidityPercent: 55,
      recordedAt: new Date('2026-06-01T08:00:00.000Z'),
    };

    // Act
    const dto = toMeasurementResponse(measurement);

    // Assert
    expect(dto).toEqual({
      id: 'm-1',
      country: 'BR',
      warehouse: 'W1',
      temperatureCelsius: 22.5,
      humidityPercent: 55,
      recordedAt: '2026-06-01T08:00:00.000Z',
    });
  });
});

describe('toBucketResponse', () => {
  it('should map a domain bucket to the response dto with ISO bucketStart', () => {
    // Arrange
    const bucket: MeasurementBucket = {
      bucketStart: new Date('2026-06-01T00:00:00.000Z'),
      avgTemperatureCelsius: 21.3,
      avgHumidityPercent: 60.5,
      count: 12,
    };

    // Act
    const dto = toBucketResponse(bucket);

    // Assert
    expect(dto).toEqual({
      bucketStart: '2026-06-01T00:00:00.000Z',
      avgTemperatureCelsius: 21.3,
      avgHumidityPercent: 60.5,
      count: 12,
    });
  });
});
