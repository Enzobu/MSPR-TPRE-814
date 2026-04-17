---
description: Refactor sans changement de comportement. Exige une couverture de test préalable pour garantir la non-régression.
argument-hint: <#numéro d'issue | description du refacto et de la cible>
---

Refactor **sans modifier le comportement observable**.

Entrée : $ARGUMENTS

## Pré-requis

- **Un ticket GitHub Issue** décrivant la cible du refacto, la motivation (dette, lisibilité, perf, conformité aux rules), et le périmètre exact. Si absent, proposer `/create-ticket` d'abord.

## Workflow

1. **Lire** le ticket et la zone de code ciblée.
2. **Évaluer la couverture de tests** actuelle sur la zone (unit + intégration). Si **insuffisante** :
   - proposer d'abord d'ajouter des tests caractérisation (qui figent le comportement actuel) avant de refacto.
   - ne **pas** procéder au refacto si la zone n'est pas couverte — c'est une règle non négociable.
3. **Créer une branche** `refacto/<scope>-<desc-kebab>` depuis `dev`.
4. **Refactor par petites étapes**, en gardant tous les tests verts à chaque étape (idéalement un commit par étape).
5. Vérifier à la fin : `pnpm --filter <app> lint && pnpm --filter <app> test && pnpm --filter <app> build`.
6. Vérifier que **le comportement observable n'a pas changé** :
   - mêmes endpoints, mêmes status codes, mêmes shapes de réponses
   - mêmes écrans, mêmes interactions utilisateur
   - mêmes contrats côté `@futurekawa/contracts` (sauf si le ticket l'autorise explicitement)
7. **Mettre à jour** `docs/features/<feature>.md` (section implémentation, `updated`) pour refléter les nouveaux chemins.
8. Bruno et Swagger **ne doivent pas changer** (sinon c'est plus un refacto).
9. **Proposer `/commit`**.

## Règles spécifiques refacto

- **Pas de nouvelle feature, pas de fix** mélangés. Si tu en trouves → ticket séparé.
- **Commits atomiques** : un commit = une transformation compréhensible.
- **Commit message** : `refactor(scope): <description> (#<issue>)`.
- **Couverture minimale** : si le refacto touche une règle métier critique (alertes, FIFO, seuils), la couverture doit être > 80 % sur cette zone avant de commencer.

## Anti-patterns à refuser

- Refacto sans tests préalables
- Refacto qui change subtilement le comportement ("ça serait mieux comme ça")
- Refacto qui casse les contrats publics (API, types `contracts`)
- "Méga refacto" en un seul commit
