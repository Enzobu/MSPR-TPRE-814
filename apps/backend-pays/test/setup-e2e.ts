import { existsSync } from 'node:fs';
import { join } from 'node:path';

// Exécuté avant le chargement des modules de test (jest-e2e.json setupFiles).
// ConfigModule.forRoot valide l'env dès l'import de AppModule : ces variables
// doivent donc exister avant tout import.
//
// Les valeurs viennent d'un fichier d'env dédié (jamais de défaut en dur ici) :
// `.env.test` (local, gitignoré) prioritaire sur `.env.test.example` (committé,
// valeurs jetables de la DB de test tmpfs). `process.loadEnvFile` n'écrase PAS
// les variables déjà définies → l'env réel (CI, override manuel) reste prioritaire.
const ENV_DIR = join(__dirname, '..');
for (const file of ['.env.test', '.env.test.example']) {
  const path = join(ENV_DIR, file);
  if (existsSync(path)) {
    process.loadEnvFile(path);
  }
}
