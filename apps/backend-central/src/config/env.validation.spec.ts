import { validateEnv } from './env.validation';

const baseEnv = {
  DATABASE_URL: 'mysql://user:pass@localhost:3306/futurekawa_central',
  BACKEND_PAYS_BR_URL: 'http://localhost:3010',
  BACKEND_PAYS_EC_URL: 'http://localhost:3011',
  BACKEND_PAYS_CO_URL: 'http://localhost:3012',
};

describe('validateEnv', () => {
  it('should accept a valid environment and apply resilience defaults', () => {
    // Act
    const env = validateEnv(baseEnv);

    // Assert
    expect(env.PORT).toBe(3000);
    expect(env.PAYS_REQUEST_TIMEOUT_MS).toBe(3000);
    expect(env.PAYS_REQUEST_RETRIES).toBe(2);
    expect(env.PAYS_BREAKER_FAILURE_THRESHOLD).toBe(5);
    expect(env.PAYS_BREAKER_COOLDOWN_MS).toBe(30_000);
  });

  it('should coerce numeric resilience variables from strings', () => {
    // Act
    const env = validateEnv({ ...baseEnv, PAYS_REQUEST_TIMEOUT_MS: '1500' });

    // Assert
    expect(env.PAYS_REQUEST_TIMEOUT_MS).toBe(1500);
  });

  it('should reject a missing pays URL', () => {
    // Act / Assert
    expect(() =>
      validateEnv({
        DATABASE_URL: baseEnv.DATABASE_URL,
        BACKEND_PAYS_BR_URL: baseEnv.BACKEND_PAYS_BR_URL,
        BACKEND_PAYS_EC_URL: baseEnv.BACKEND_PAYS_EC_URL,
      }),
    ).toThrow(/BACKEND_PAYS_CO_URL/);
  });

  it('should reject a malformed pays URL', () => {
    // Act / Assert
    expect(() =>
      validateEnv({ ...baseEnv, BACKEND_PAYS_BR_URL: 'not-a-url' }),
    ).toThrow(/BACKEND_PAYS_BR_URL/);
  });
});
