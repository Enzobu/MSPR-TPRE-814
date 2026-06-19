import {
  ALERT_TYPES,
  COUNTRY_CODES,
  COUNTRY_CONDITIONS,
  HUMIDITY_PERCENT_MAX,
  HUMIDITY_PERCENT_MIN,
  LOT_MAX_AGE_DAYS,
  LOT_STATUSES,
  MEASUREMENT_TOPIC_SUFFIX,
  MQTT_TOPIC_ROOT,
  ROLES,
  TEMPERATURE_CELSIUS_MAX,
  TEMPERATURE_CELSIUS_MIN,
  measurementSubscriptionTopic,
  measurementTopic,
} from './index';

describe('measurementTopic', () => {
  it('should build the per-warehouse measurement topic (ADR-0003)', () => {
    // Act
    const topic = measurementTopic('BR', 'W1');

    // Assert
    expect(topic).toBe('futurekawa/BR/warehouse/W1/measurement');
  });
});

describe('measurementSubscriptionTopic', () => {
  it('should build the country-scoped wildcard subscription topic', () => {
    // Act
    const topic = measurementSubscriptionTopic('EC');

    // Assert
    expect(topic).toBe('futurekawa/EC/warehouse/+/measurement');
  });
});

describe('contracts constants', () => {
  it('should expose the MQTT topic building blocks', () => {
    expect(MQTT_TOPIC_ROOT).toBe('futurekawa');
    expect(MEASUREMENT_TOPIC_SUFFIX).toBe('measurement');
  });

  it('should expose coherent measurement validation bounds', () => {
    expect(TEMPERATURE_CELSIUS_MIN).toBeLessThan(TEMPERATURE_CELSIUS_MAX);
    expect(HUMIDITY_PERCENT_MIN).toBe(0);
    expect(HUMIDITY_PERCENT_MAX).toBe(100);
  });

  it('should list the three alert types', () => {
    expect(ALERT_TYPES).toEqual([
      'TEMPERATURE_OUT_OF_RANGE',
      'HUMIDITY_OUT_OF_RANGE',
      'LOT_EXPIRED',
    ]);
  });

  it('should define conditions for every country code', () => {
    expect(COUNTRY_CODES).toEqual(['BR', 'EC', 'CO']);
    for (const code of COUNTRY_CODES) {
      expect(COUNTRY_CONDITIONS[code]).toBeDefined();
    }
  });

  it('should expose lot rules and roles', () => {
    expect(LOT_MAX_AGE_DAYS).toBe(365);
    expect(LOT_STATUSES).toContain('PERIME');
    expect(ROLES).toContain('ADMIN');
  });
});
