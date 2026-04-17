---
description: Ferme un ticket GitHub Issue après vérification complète de la Definition of Done. Refuse la fermeture si la DoD n'est pas respectée.
argument-hint: <#numéro d'issue>
---

Ferme un ticket **uniquement si** la Definition of Done est respectée.

Entrée : $ARGUMENTS

## Workflow

1. **Lire le ticket** : `gh issue view <id>` — récupérer critères d'acceptance et DoD.
2. **Vérifier chaque critère d'acceptance** en inspectant le code, les tests, la doc. Pour chacun : ✅ vérifié / ❌ manquant.
3. **Vérifier la Definition of Done** point par point :
   - [ ] Code respecte `/rules` (clean archi, DTO in/out, SRP)
   - [ ] Tests écrits et **passants** (`pnpm -r test`)
   - [ ] `docs/features/<feature>.md` `status: implemented` et `updated` à jour
   - [ ] Swagger exhaustif sur les endpoints touchés
   - [ ] Bruno à jour (`bruno/<scope>/*.bru` avec `docs` + `tests`) pour chaque route nouvelle/modifiée
   - [ ] `.env.example` à jour si nouvelle variable
   - [ ] Doc utilisateur (`docs/user/`) à jour si parcours métier touché
   - [ ] PR mergée (ou à défaut, approuvée et prête)
   - [ ] CI verte sur le dernier commit
4. **Si un seul point échoue** :
   - Ne **pas** fermer l'issue.
   - Lister explicitement ce qui manque.
   - Proposer la suite d'actions (`/fix` sur un test manquant, mise à jour de doc, etc.).
5. **Si tout est vert** :
   - Rédiger un **commentaire de clôture** synthétisant ce qui a été livré : lien PR(s), résumé des changements, captures ou liens Swagger/Bruno si pertinents.
   - Fermer l'issue avec :
     ```bash
     gh issue close <id> --comment "<message>" --reason completed
     ```
   - Proposer à l'utilisateur de passer au ticket suivant du backlog (`gh issue list --state open`).

## Règles

- **Jamais fermer un ticket sans vérification manuelle**. Ne pas se contenter du statut "merged" de la PR.
- **Jamais fermer en "not planned"** — utiliser ce motif uniquement si le ticket est légitimement abandonné, et alors expliquer pourquoi dans le commentaire.
- **Les critères d'acceptance du ticket sont la vérité** : si un critère n'est plus pertinent, **modifier le ticket d'abord** (via une note justifiée), puis fermer.
- **Si des dépendances sont ouvertes** (`Blocks: #NN` dans le ticket) → vérifier leur état avant de fermer.

## Rapport final

Après fermeture, afficher à l'utilisateur :
- URL du ticket fermé
- Nombre de commits sur les branches liées
- PR mergée
- Prochains tickets suggérés (si applicable)
