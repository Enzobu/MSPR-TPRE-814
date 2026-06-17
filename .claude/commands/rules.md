---
description: Rappelle et applique les règles transverses du projet FutureKawa (architecture, code, tests, doc, git, sécurité, observabilité, monorepo). Ces règles s'ajoutent à celles du sous-projet courant.
---

Charge en contexte **toutes les règles transverses** du monorepo FutureKawa et applique-les à tout le travail de cette conversation, en plus des règles spécifiques du sous-projet courant.

## Instructions

1. Lis **tous les fichiers** de `.claude/rules/*.md` (ordre numéroté).
2. Considère ces règles comme **obligatoires** pour tout code/commit/PR que tu produis ou revois.
3. En cas de conflit entre une règle transverse et une règle spécifique d'un `CLAUDE.md` de sous-projet, la règle **la plus spécifique** l'emporte.
4. Confirme brièvement à l'utilisateur que les règles sont chargées et liste leurs titres (un par ligne), sans recopier le contenu.

## Fichiers à charger

- `.claude/rules/README.md` (index)
- `.claude/rules/01-architecture.md`
- `.claude/rules/02-code.md`
- `.claude/rules/03-feature.md`
- `.claude/rules/04-tests.md`
- `.claude/rules/05-documentation.md`
- `.claude/rules/06-git.md`
- `.claude/rules/07-security.md`
- `.claude/rules/08-observability.md`
- `.claude/rules/09-monorepo.md`
- `.claude/rules/10-ai-parity.md`

La **source canonique** des règles est le dossier `.claude/rules/`. Cette commande n'est qu'un raccourci pour les injecter en contexte.
