## Résumé

<!-- 1 à 3 lignes. Pourquoi, pas le quoi (le diff dit le quoi). -->

## Ticket lié

<!-- Remplace NN. Utilise "Closes" pour les features/fix, "Refs" pour un lien simple. -->
Closes #

## Type de changement

- [ ] `feat` — nouvelle fonctionnalité
- [ ] `fix` — correction de bug
- [ ] `refactor` — refactor sans changement de comportement
- [ ] `docs` — documentation uniquement
- [ ] `test` — tests uniquement
- [ ] `chore` / `ci` — maintenance / pipeline

## Checklist DoD

<!-- Voir .claude/rules/03-feature.md et .claude/rules/05-documentation.md -->

### Qualité code
- [ ] Code respecte les règles (`/rules` — clean archi, DTO in/out, SRP, TS strict)
- [ ] Pas de type Prisma exposé dans un contrôleur
- [ ] Types partagés via `@futurekawa/contracts`

### Tests
- [ ] Tests unitaires ajoutés (règles métier critiques)
- [ ] Tests d'intégration si traversée DB / MQTT / HTTP / mailer
- [ ] Tests e2e si nouveau parcours utilisateur
- [ ] `pnpm -r test` passe localement

### Documentation
- [ ] `docs/features/<feature>.md` créé ou mis à jour (status, updated)
- [ ] Swagger à jour (backends — `@ApiProperty`, `@ApiOperation`, `@ApiResponse`)
- [ ] **Bruno** à jour (`bruno/<scope>/*.bru` avec `docs` + `tests`) pour chaque route nouvelle/modifiée
- [ ] `.env.example` à jour si nouvelle variable
- [ ] Doc utilisateur (`docs/user/`) à jour si parcours métier touché
- [ ] ADR créé si choix d'architecture

### Parité assistants IA
- [ ] Config **Claude Code** et **Codex** synchronisées si touchées (`.claude/` ↔ `.codex/`, `CLAUDE.md` ↔ `AGENTS.md`) — voir règle `10-ai-parity`

### CI
- [ ] Lint passe (`pnpm -r lint`)
- [ ] Build passe (`pnpm -r build`)
- [ ] CI Jenkins verte

## Comment tester

<!-- Étapes reproductibles. Exemple :
1. docker compose up
2. pnpm --filter backend-pays start:dev
3. Lancer POST central/auth/login dans Bruno (env local-central)
4. Vérifier que ...
-->

## Captures / preuves

<!-- Screenshots UI, logs serveur pertinents, réponse Bruno, etc. Optionnel mais apprécié. -->

## Breaking changes

<!-- Oui / Non. Si oui, lister ce qui change et comment migrer. -->

## Notes pour le reviewer

<!-- Points d'attention, zones à regarder en priorité, alternatives envisagées. -->
