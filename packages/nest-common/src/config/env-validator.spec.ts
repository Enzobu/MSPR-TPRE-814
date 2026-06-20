import { z } from 'zod';
import { createEnvValidator } from './env-validator';

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  SECRET: z.string().min(4),
});

describe('createEnvValidator', () => {
  it('should return parsed and coerced values for a valid config', () => {
    // Arrange
    const validate = createEnvValidator(schema);

    // Act
    const env = validate({ PORT: '8080', SECRET: 'abcd' });

    // Assert
    expect(env).toEqual({ PORT: 8080, SECRET: 'abcd' });
  });

  it('should apply schema defaults when a variable is absent', () => {
    // Arrange
    const validate = createEnvValidator(schema);

    // Act
    const env = validate({ SECRET: 'abcd' });

    // Assert
    expect(env.PORT).toBe(3000);
  });

  it('should throw a readable error listing every invalid variable', () => {
    // Arrange
    const validate = createEnvValidator(schema);

    // Act / Assert
    expect(() => validate({ SECRET: 'ab' })).toThrow(
      /Invalid environment variables:[\s\S]*SECRET/,
    );
  });
});
