import { validateEnv } from './env.validation';

const baseEnv = {
  COUNTRY_CODE: 'BR',
  DATABASE_URL: 'mysql://user:pass@localhost:3306/futurekawa_pays',
  MQTT_URL: 'mqtt://localhost:1883',
};

describe('validateEnv', () => {
  it('should accept a valid environment and apply defaults', () => {
    // Act
    const env = validateEnv(baseEnv);

    // Assert
    expect(env.COUNTRY_CODE).toBe('BR');
    expect(env.PORT).toBe(3000);
    expect(env.LOG_LEVEL).toBe('info');
    expect(env.THROTTLE_LIMIT).toBe(100);
  });

  it('should coerce numeric variables from strings', () => {
    // Act
    const env = validateEnv({ ...baseEnv, PORT: '3010' });

    // Assert
    expect(env.PORT).toBe(3010);
  });

  it('should reject a missing required variable', () => {
    // Act / Assert
    expect(() =>
      validateEnv({ COUNTRY_CODE: 'BR', MQTT_URL: 'mqtt://localhost:1883' }),
    ).toThrow(/Invalid environment variables/);
  });

  it('should reject an invalid COUNTRY_CODE', () => {
    // Act / Assert
    expect(() => validateEnv({ ...baseEnv, COUNTRY_CODE: 'FR' })).toThrow(
      /COUNTRY_CODE/,
    );
  });

  it('should reject a malformed DATABASE_URL', () => {
    // Act / Assert
    expect(() =>
      validateEnv({ ...baseEnv, DATABASE_URL: 'not-a-url' }),
    ).toThrow(/DATABASE_URL/);
  });
});
