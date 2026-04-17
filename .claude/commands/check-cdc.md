---
description: Audit de conformité de la solution au Cahier Des Charges FutureKawa. Délègue au subagent cdc-reviewer.
argument-hint: [section optionnelle, ex. "III.2" pour cibler l'IoT]
---

Lance un audit de conformité au cahier des charges FutureKawa via le subagent **cdc-reviewer**.

$ARGUMENTS

## Comportement attendu

1. Relis `consigne-structuree.md` (CDC).
2. Cartographie les exigences (✅ fait / 🟡 partiel / ❌ manquant / ⏭️ hors scope).
3. Pour chaque exigence couverte, cite le fichier/chemin.
4. Pour chaque exigence partielle/manquante, propose la plus petite action concrète pour avancer.
5. Termine par une **synthèse** (score global, risques majeurs, priorités).

Si un argument est passé (ex. `/check-cdc III.2`), restreins l'audit à cette section.

Invoke : `cdc-reviewer` subagent.
