---
description: Crée un ticket propre sur GitHub Issues avec user story, critères d'acceptance, Definition of Done et labels. Les tickets sont la source de vérité du backlog et doivent être liés aux PR.
argument-hint: <résumé court du besoin en quelques mots>
---

Crée un ticket GitHub Issues **propre et complet** à partir du besoin décrit.

Entrée : $ARGUMENTS

## Workflow

1. **Clarifier** avec l'utilisateur si le besoin est flou (type : feature / bug / refacto / chore / docs ; scope : pays / central / front / iot / contracts ; priorité ; section CDC concernée). Ne pas inventer — demander.
2. **Lire** `consigne-structuree.md` pour identifier la section CDC pertinente.
3. **Rédiger** le ticket en respectant **strictement** le template ci-dessous.
4. **Créer** l'issue via `gh issue create` :
   ```bash
   gh issue create --title "<type>(<scope>): <titre impératif>" \
                   --body-file /tmp/ticket-body.md \
                   --label "<type>,<scope>"
   ```
5. **Retourner** l'URL de l'issue à l'utilisateur.

## Template de ticket (obligatoire)

```markdown
## Contexte
Pourquoi ce ticket existe. Lien CDC si applicable (§III.X). Irritant ou besoin métier en 2-3 phrases.

## User story
En tant que <rôle FutureKawa>, je veux <action>, afin de <bénéfice métier>.

## Scope
**Inclus :**
- ...

**Hors scope :**
- ...

## Critères d'acceptance
Formulés comme des assertions **testables** et **vérifiables** :
- [ ] Quand <condition>, alors <comportement observable>.
- [ ] L'API renvoie <status> avec un body <forme>.
- [ ] L'UI affiche <élément> dans <état>.

## Impact technique
- Sous-projets touchés : `apps/backend-pays`, `apps/frontend-web`, `packages/contracts`…
- ADR à créer ou référencer : <none | ADR-NNNN>
- Points d'attention : migrations DB, breaking changes de contrats, sécurité…

## Definition of Done
- [ ] Code respecte `/rules` (clean archi, DTO in/out, SRP, TS strict)
- [ ] Tests écrits et passants (unit + intégration si applicable)
- [ ] `docs/features/<feature>.md` créé ou mis à jour (`status`, `updated`, tests)
- [ ] Swagger à jour (backends)
- [ ] Bruno à jour (`bruno/<scope>/<route>.bru` avec `docs` + `tests`) si nouvelle route
- [ ] `.env.example` à jour si nouvelle variable
- [ ] Doc utilisateur (`docs/user/`) à jour si parcours métier touché
- [ ] Revue par au moins un pair
- [ ] CI verte (lint + tests + build Docker)

## Références
- CDC : <§III.X ou n/a>
- Features liées : <lien docs/features/... ou n/a>
- ADR liées : <NNNN ou n/a>
- Parent / dépendances : <#NN ou n/a>
```

## Labels à appliquer

Toujours deux labels : `type` + `scope`.

- Types : `feat`, `fix`, `refacto`, `chore`, `docs`, `test`, `ci`
- Scopes : `pays`, `central`, `front`, `iot`, `contracts`, `docker`, `ci`, `docs`

Si les labels n'existent pas sur le repo, proposer de les créer via `gh label create`.

## Règles

- **Aucun champ vide ou générique** (pas de "TBD", pas de "à définir"). Si une section est vide, la retirer.
- **Critères d'acceptance = conditions testables**. Pas de "ça doit bien marcher".
- **Titre en impératif**, préfixé du type et du scope : `feat(pays): add MQTT subscriber for DHT measurements`.
- **Pas d'estimation numérique** arbitraire. Utiliser les labels de taille (`size/XS/S/M/L/XL`) si créés, sinon rien.
