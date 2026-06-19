import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
