// Exécuté avant le chargement des modules de test (jest-e2e.json setupFiles).
// ConfigModule.forRoot valide l'env dès l'import de AppModule : ces variables
// doivent donc exister avant tout import.
process.env.DATABASE_URL ??=
  'mysql://user:pass@localhost:3306/futurekawa_central';
process.env.BACKEND_PAYS_BR_URL ??= 'http://localhost:3010';
process.env.BACKEND_PAYS_EC_URL ??= 'http://localhost:3011';
process.env.BACKEND_PAYS_CO_URL ??= 'http://localhost:3012';
// Ping de debug rapide en e2e (aucun pays lancé) : pas de retry, timeout court.
process.env.PAYS_REQUEST_RETRIES ??= '0';
process.env.PAYS_REQUEST_TIMEOUT_MS ??= '300';
// Secret JWT requis au boot (env.validation) : valeur de test déterministe.
process.env.JWT_SECRET ??= 'test-secret-at-least-32-characters-long';
