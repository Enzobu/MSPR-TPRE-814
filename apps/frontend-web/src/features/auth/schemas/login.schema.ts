import { z } from 'zod';

// Politique de mot de passe ADR-0006 : ≥ 12 caractères, au moins une minuscule,
// une majuscule, un chiffre. Validée côté front pour l'UX ; le backend re-valide
// systématiquement (never trust the client — rules 07).
const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_LENGTH = 128;

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email requis')
    .email('Adresse email invalide'),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Au moins ${PASSWORD_MIN_LENGTH} caractères`)
    .max(PASSWORD_MAX_LENGTH, 'Mot de passe trop long')
    .regex(/[a-z]/, 'Au moins une minuscule')
    .regex(/[A-Z]/, 'Au moins une majuscule')
    .regex(/[0-9]/, 'Au moins un chiffre'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
