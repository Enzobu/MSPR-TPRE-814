// Token d'injection partagé du code pays de l'instance (env COUNTRY_CODE).
// Le code reçoit une valeur (`CountryCode`) plutôt que ConfigService : il reste
// pur. Partagé par l'ingestion MQTT (#28) et le fallback REST POST. Le module
// Lots conserve son propre token (lots/application/country.token.ts) inchangé.
export const COUNTRY_CODE = Symbol('COUNTRY_CODE');
