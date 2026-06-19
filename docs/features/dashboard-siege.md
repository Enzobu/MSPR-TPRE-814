---
title: Dashboard consolidé siège (front)
owner: Yanis
status: implemented
cdc-ref: "§III.3"
adr-refs: [0005, 0007]
updated: 2026-06-20
related: ["aggregation-siege.md", "alerts.md", "lots.md"]
---

# Dashboard consolidé siège (front)

## Objectif métier

Offrir au cadre siège une page d'accueil qui montre **en un coup d'œil** l'état
des stocks et des alertes des 3 pays (Brésil / Équateur / Colombie), avec la
possibilité de **filtrer par pays**. CDC §III.3 (sélection pays + vue
consolidée).

## Scope

**Inclus (#37) :**
- **Sélecteur pays global** porté par l'URL (`?country=BR`), bookmarkable et
  rechargeable : « Tous » (agrégation) + une option par pays (libellés FR).
- **KPI scopables** par le pays sélectionné : lots en stock, alertes non
  acquittées, pays indisponibles.
- **Banner « données partielles »** quand le backend-central signale des pays
  injoignables (`unavailable`, ADR-0007).
- **Auto-refresh** : rafraîchissement périodique des KPI (stocks toutes les 60 s,
  alertes sur leur polling existant) via TanStack Query.
- Les **dernières alertes** du dashboard suivent aussi le pays sélectionné.

**Déjà livré (#102) :** hero, cartes KPI, accès rapides, liste des dernières
alertes (versions non scopées).

**Hors scope :** breakdown simultané des 3 pays sur une même vue (le sélecteur
scope une vue à la fois) ; la vue détaillée lots/mesures (features dédiées).

## Parcours utilisateur

- En tant que cadre siège, je veux voir les totaux stocks/alertes consolidés afin
  d'évaluer la situation globale.
- En tant que cadre siège, je veux filtrer le dashboard sur un pays afin d'isoler
  son état, et partager l'URL filtrée.
- En tant que cadre siège, je veux être prévenu qu'un pays est injoignable afin de
  savoir que les chiffres affichés sont partiels.

## Règles métier

- Le front consomme **exclusivement** le backend-central (jamais un backend pays
  direct). La résilience `unavailable` vient de l'agrégation siège
  ([`aggregation-siege.md`](aggregation-siege.md), ADR-0007).
- `country` absent = agrégation BR+EC+CO. Une valeur de pays inconnue dans l'URL
  est ignorée (retour à « Tous »).
- Libellés pays FR = concern d'affichage front (`COUNTRY_LABELS`) ; les codes ISO
  restent la source de vérité dans `@futurekawa/contracts`.

## Architecture technique

État du filtre dans l'URL (`useSearchParams`). Les KPI et le banner partagent la
**même** query stocks (`queryKey ['stocks','summary',country]`) → TanStack Query
dédoublonne, **pas de double-fetch**. Chaque carte gère son propre
chargement/erreur (skeletons shadcn, message métier `role="alert"`).

## Implémentation

- **Page** : `apps/frontend-web/src/pages/HomePage.tsx`
- **État pays (URL)** :
  `apps/frontend-web/src/features/dashboard/hooks/useDashboardCountry.ts`
- **Sélecteur** :
  `apps/frontend-web/src/features/dashboard/components/CountrySelector.tsx`
- **Banner indispo** :
  `apps/frontend-web/src/features/dashboard/components/DashboardUnavailableBanner.tsx`
- **KPI** : `apps/frontend-web/src/features/dashboard/components/DashboardKpis.tsx`
  (prop `country`)
- **Hooks data scopés** : `useStocksSummary(country)` (lots, auto-refresh 60 s),
  `useUnacknowledgedCount(country)` (alertes), `useRecentAlerts(country)`.
- **Constantes / libellés** : `dashboard/lib/constants.ts`
  (`DASHBOARD_REFETCH_INTERVAL_MS`), `dashboard/lib/country.ts` (`COUNTRY_LABELS`).

## Contrats API

Consomme le backend-central (voir [`aggregation-siege.md`](aggregation-siege.md)) :

| Type | Contrat | Usage dashboard |
|---|---|---|
| REST | `GET /api/v1/stocks?country&page&pageSize&sort` | total lots + `unavailable` |
| REST | `GET /api/v1/alerts?country&acknowledged&page&pageSize` | compteur non acquittées + dernières alertes |

## Tests

| Niveau | Fichier | Couvre |
|---|---|---|
| Unit (hook) | `apps/frontend-web/tests/features/dashboard/hooks/useDashboardCountry.test.tsx` | lecture/écriture du param URL, valeur inconnue ignorée |
| UI | `apps/frontend-web/tests/features/dashboard/components/CountrySelector.test.tsx` | options FR, `aria-pressed`, `onChange` |
| UI | `apps/frontend-web/tests/features/dashboard/components/DashboardUnavailableBanner.test.tsx` | vide → rien, singulier/pluriel FR |
| UI | `apps/frontend-web/tests/pages/HomePage.test.tsx` | rendu du dashboard (inchangé) |

## Évolutions / TODO

- [ ] Vue comparative simultanée des 3 pays (au-delà du scope #37).
- [ ] Doc utilisateur (`docs/user/`) du parcours dashboard si besoin jury.
