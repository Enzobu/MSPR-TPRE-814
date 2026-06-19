// Auto-refresh du dashboard (rules front : KPI temps réel). Les stocks ne
// disposent pas de polling natif côté liste lots : on rafraîchit ici toutes
// les minutes pour garder la vue siège à jour sans intervention.
export const DASHBOARD_REFETCH_INTERVAL_MS = 60_000;
