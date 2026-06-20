---
name: sonar
description: Interroge SonarQube (quality gate + issues du projet), liste les violations et corrige les cas bloquants (gate ROUGE). Token et projet stockés dans le skill. Accepte [--check] pour auditer sans corriger.
---

Audite la qualité SonarQube du projet et **corrige les issues qui font échouer le quality gate**.

Entrée optionnelle : `--check` = audit seul, aucune modification de code.

## Configuration (en dur — choix assumé de l'équipe)

> ⚠️ Le token est commité ici à la demande explicite de l'équipe. À traiter comme exposé : faire une rotation si le dépôt devient public / le token fuite.

```sh
SONAR_HOST="https://sonar.enzo-palermo.com"
SONAR_TOKEN="squ_365aa0532ddb5c88ad93224c6f07ec4d2d52c478"
SONAR_PROJECT="Enzobu_MSPR-TPRE-814_328a41f3-b493-4fed-8e21-11fbc69b8ee6"
```

Auth API : Basic avec le token en username, mot de passe vide → `curl -u "$SONAR_TOKEN:" …`.

## Comportement attendu

### 1. État du quality gate (toujours)

```sh
curl -s -u "$SONAR_TOKEN:" \
  "$SONAR_HOST/api/qualitygates/project_status?projectKey=$SONAR_PROJECT"
```

- Lire `projectStatus.status` (`OK` / `ERROR`) et les `conditions`.
- Afficher les conditions `ERROR` (metricKey, seuil, valeur réelle).
- **Si `OK`** : annoncer le gate vert, lister les issues mineures pour info, **s'arrêter**.

> Contexte projet : un gate rouge **structurel** (ex. seuil de couverture global) peut être toléré — voir la règle d'équipe sur les merges. Ne pas « corriger » une couverture en baissant un seuil ou en supprimant des tests. Se concentrer sur les **violations** (`new_violations`, `open_issues`).

### 2. Lister les issues ouvertes

```sh
curl -s -u "$SONAR_TOKEN:" \
  "$SONAR_HOST/api/issues/search?componentKeys=$SONAR_PROJECT&resolved=false&ps=100"
```

Extraire par issue : `severity`, `impacts[]`, `rule`, `component` (→ fichier), `line`, `message`. Trier par sévérité décroissante, présenter un récap avant correction.

### 3. Cas bloquants

Sont **bloquants** : sévérité **BLOCKER**/**CRITICAL**, ou toute issue contribuant à une condition `ERROR` du gate. Avec `--check` : s'arrêter sur le récap.

### 4. Corriger (méthode)

Pour chaque cas bloquant : ouvrir le fichier, comprendre la règle Sonar, **corriger la cause** en respectant les règles projet (skill `rules` + `AGENTS.md` du sous-projet) :
- jamais supprimer un test ni baisser un seuil pour faire passer le gate ;
- TS strict, pas de `any`, un `as X` justifié par `// WHY:` ;
- a11y : élément natif (`<a>`/`<button>`) plutôt que `<div onClick>` ;
- pas de secret loggé, validation conservée.

Faux positif assumé : le signaler à l'utilisateur (marquage côté UI Sonar), ne pas charcuter le code.

### 5. Vérifier (bloquant)

```sh
pnpm --filter <app> exec tsc -b
pnpm --filter <app> lint
pnpm --filter <app> test     # + e2e si un composant de parcours a changé
```

Tout vert. En cas d'échec → corriger, pas contourner.

### 6. Restituer

- Résumé : corrigées (fichier + règle), laissées (raison), état attendu du gate.
- Rappeler que le gate ne repassera vert qu'après un **nouveau scan** (CI au prochain push/PR) ; l'API reflète le dernier scan, pas le working tree.
- Proposer d'enchaîner sur le skill `commit` (jamais commit direct sur `main`/`dev`).

## Notes API utiles

- `&severities=BLOCKER,CRITICAL`, `&impactSeverities=HIGH`, `&inNewCodePeriod=true`.
- Hotspots : `GET /api/hotspots/search?projectKey=$SONAR_PROJECT`.
