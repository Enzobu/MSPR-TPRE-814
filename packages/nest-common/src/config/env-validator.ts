import type { ZodType } from 'zod';

// Fabrique un validateur d'env générique : chaque backend déclare SON schéma zod
// (variables spécifiques) et obtient une fonction `validate` à brancher sur
// `ConfigModule.forRoot({ validate })`. Le boot échoue si une variable requise
// manque ou est invalide — rules/07-security.md « Validation d'environnement au boot ».
export function createEnvValidator<T>(
  schema: ZodType<T>,
): (config: Record<string, unknown>) => T {
  return (config: Record<string, unknown>): T => {
    const result = schema.safeParse(config);

    if (!result.success) {
      const issues = result.error.issues
        .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
        .join('\n');
      throw new Error(`Invalid environment variables:\n${issues}`);
    }

    return result.data;
  };
}
