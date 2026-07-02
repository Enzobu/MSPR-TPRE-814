---
title: Tests — index
owner: Yanis
status: in-progress
cdc-ref: "§IV.4.3"
updated: 2026-07-02
---

# Tests (CDC §IV.4.3)

Dossier de tests de la solution : stratégie, plan de test détaillé et process de
gestion des anomalies.

| Document | Contenu |
|---|---|
| [`strategy.md`](strategy.md) | Pyramide, outils par stack, isolation, environnement de test |
| [`test-plan.md`](test-plan.md) | Cas de test critiques par feature, jeux de données, critères de réussite |
| [`manual-tests.md`](manual-tests.md) | Commandes prêtes à copier pour lancer chaque type de test à la main (CDC §IV.6) |
| [`anomalies.md`](anomalies.md) | Process constat → correction → re-test + gabarit de rapport |

La décision de fond est figée par [ADR-0008](../adr/0008-testing-strategy.md) et la
règle transverse [`04-tests.md`](../../.claude/rules/04-tests.md).
