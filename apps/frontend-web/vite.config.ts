import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { sentryVitePlugin } from '@sentry/vite-plugin';

// Upload des sourcemaps vers Sentry au build (ADR-0011) — UNIQUEMENT si un auth
// token est fourni (CI / build Dokploy). Absent en dev → pas d'upload, build normal.
// Région EU : url de.sentry.io (sinon le plugin tape la région US par défaut).
const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    ...(sentryAuthToken
      ? [
          sentryVitePlugin({
            org: process.env.SENTRY_ORG ?? 'mspr-sd',
            project: process.env.SENTRY_PROJECT ?? 'frontend-web',
            authToken: sentryAuthToken,
            url: process.env.SENTRY_URL ?? 'https://de.sentry.io/',
            // Upload puis suppression : les .map ne sont jamais servis par nginx.
            sourcemaps: { filesToDeleteAfterUpload: ['./dist/assets/*.map'] },
          }),
        ]
      : []),
  ],
  // 'hidden' : génère les sourcemaps (lisibilité Sentry) SANS référence
  // //# sourceMappingURL dans le JS livré → pas chargées par le navigateur.
  build: {
    sourcemap: 'hidden',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // @futurekawa/contracts est un package workspace bundlé en CJS (barrel
  // `__exportStar`). Sans pré-bundle, Vite sert le dist CJS tel quel et n'expose
  // pas ses exports nommés *valeurs* en ESM (ex. ALERT_TYPES, COUNTRY_CONDITIONS)
  // → SyntaxError au runtime. On force l'optimisation pour que esbuild convertisse
  // le CJS en ESM avec exports nommés détectés.
  optimizeDeps: {
    include: ['@futurekawa/contracts'],
  },
});
