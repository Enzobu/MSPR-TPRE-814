---
description: Interroge SonarQube (quality gate + issues du projet), liste les violations et corrige les cas bloquants (gate ROUGE). Token et projet stockés dans le skill.
argument-hint: [--check pour auditer sans corriger]
---

Audite la qualité SonarQube du projet et **corrige les issues qui font échouer le quality gate**.

Entrée optionnelle : $ARGUMENTS (`--check` = audit seul, aucune modification de code).

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

- Lire `projectStatus.status` (`OK` / `ERROR`) et la liste des `conditions`.
- Afficher un tableau des conditions `ERROR` (metricKey, seuil, valeur réelle).
- **Si `OK`** : annoncer que le gate est vert, lister les éventuelles issues mineures pour info, **s'arrêter** (rien à corriger).

> Contexte projet : un gate rouge **structurel** (ex. seuil de couverture global) peut être toléré — voir la règle d'équipe sur les merges. Ne pas « corriger » une couverture en baissant un seuil ou en supprimant des tests. Se concentrer sur les **violations** (`new_violations`, `open_issues`).

### 2. Lister les issues ouvertes

```sh
curl -s -u "$SONAR_TOKEN:" \
  "$SONAR_HOST/api/issues/search?componentKeys=$SONAR_PROJECT&resolved=false&ps=100"
```

Pour chaque issue, extraire : `severity` (BLOCKER/CRITICAL/MAJOR/MINOR/INFO), `impacts[]` (softwareQuality:severity), `rule`, `component` (→ chemin fichier), `line`, `message`.

Trier par sévérité décroissante. Présenter un récap clair avant toute correction.

### 3. Définir les « cas bloquants »

Sont **bloquants** (à corriger) :
- toute issue de sévérité **BLOCKER** ou **CRITICAL** ;
- toute issue qui contribue à une condition `ERROR` du gate (`new_violations`, `open_issues`, `*_security_*`, etc.).

Si `--check` est passé : **s'arrêter ici** sur le récap, ne rien modifier.

### 4. Corriger (méthode)

Pour chaque cas bloquant :

1. **Ouvrir le fichier** au chemin/ligne indiqués, comprendre la règle (`rule` Sonar, ex. `typescript:S1186`).
2. **Corriger la cause, pas le symptôme.** Respecter les règles projet (`/rules` + `CLAUDE.md` du sous-projet) :
   - jamais supprimer un test ni baisser un seuil pour faire passer le gate ;
   - TS strict, pas de `any` ; un `as X` se justifie par un commentaire `// WHY:` ;
   - a11y : préférer un élément natif (`<a>`/`<button>`) à un `<div onClick>` ;
   - pas de secret loggé, validation conservée.
3. Si une issue est un **faux positif** assumé : ne pas charcuter le code — le signaler à l'utilisateur (marquage *won't fix* / *false positive* à faire côté UI Sonar), ne pas l'imposer.

### 5. Vérifier (bloquant)

Sur la portée touchée :

```sh
pnpm --filter <app> exec tsc -b
pnpm --filter <app> lint
pnpm --filter <app> test            # + e2e si un composant de parcours a changé
```

Tout doit être vert. En cas d'échec → corriger, ne pas contourner.

### 6. Restituer

- Résumé : issues corrigées (fichier + règle), issues laissées (avec raison), état attendu du gate après re-scan.
- Rappeler que **le gate ne repassera vert qu'après un nouveau scan Sonar** (déclenché par la CI au prochain push/PR) — l'API ci-dessus reflète le **dernier** scan, pas l'état du working tree.
- Proposer d'enchaîner sur `/commit` (jamais commit direct sur `main`/`dev`).

## Notes API utiles

- Filtrer par sévérité : `&severities=BLOCKER,CRITICAL` ou par impact : `&impactSeverities=HIGH`.
- Issues sur du code neuf seulement : `&inNewCodePeriod=true`.
- Hotspots de sécurité : `GET /api/hotspots/search?projectKey=$SONAR_PROJECT`.
