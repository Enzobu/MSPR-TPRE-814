// Exécuté avant le chargement des modules de test (jest-e2e.json setupFiles).
// ConfigModule.forRoot valide l'env dès l'import de AppModule : ces variables
// doivent donc exister avant tout import.
process.env.COUNTRY_CODE ??= 'BR';
process.env.DATABASE_URL ??= 'mysql://user:pass@localhost:3306/futurekawa_pays';
process.env.MQTT_URL ??= 'mqtt://localhost:1883';
