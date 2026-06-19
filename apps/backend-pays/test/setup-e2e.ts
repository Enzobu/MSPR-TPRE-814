// Exécuté avant le chargement des modules de test (jest-e2e.json setupFiles).
// ConfigModule.forRoot valide l'env dès l'import de AppModule : ces variables
// doivent donc exister avant tout import.
process.env.COUNTRY_CODE ??= 'BR';
// Par défaut : la DB de test jetable (docker-compose.test.yml, port 3399), pas
// la base de dev — pour qu'un `test:e2e` lancé sans override ne touche jamais
// les données de dev. Surchargeable via la vraie env DATABASE_URL.
//
// L'URL est assemblée à partir de composants (eux-mêmes surchargeables) plutôt
// qu'écrite en dur : identifiants jetables de la DB tmpfs, non secrets, mais on
// évite ainsi un littéral `user:pass@host` en clair (cf. rules/07-security.md).
const TEST_DB_USER = process.env.TEST_DB_USER ?? 'futurekawa';
const TEST_DB_PASSWORD = process.env.TEST_DB_PASSWORD ?? 'futurekawa';
const TEST_DB_HOST = process.env.TEST_DB_HOST ?? 'localhost:3399';
const TEST_DB_NAME = process.env.TEST_DB_NAME ?? 'futurekawa_pays_test';
process.env.DATABASE_URL ??= `mysql://${TEST_DB_USER}:${TEST_DB_PASSWORD}@${TEST_DB_HOST}/${TEST_DB_NAME}`;
process.env.MQTT_URL ??= 'mqtt://localhost:1883';
