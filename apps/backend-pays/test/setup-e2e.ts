// Exécuté avant le chargement des modules de test (jest-e2e.json setupFiles).
// ConfigModule.forRoot valide l'env dès l'import de AppModule : ces variables
// doivent donc exister avant tout import.
process.env.COUNTRY_CODE ??= 'BR';
// Par défaut : la DB de test jetable (docker-compose.test.yml, port 3399), pas
// la base de dev — pour qu'un `test:e2e` lancé sans override ne touche jamais
// les données de dev. Surchargeable via la vraie env DATABASE_URL.
process.env.DATABASE_URL ??=
  'mysql://futurekawa:futurekawa@localhost:3399/futurekawa_pays_test';
process.env.MQTT_URL ??= 'mqtt://localhost:1883';
