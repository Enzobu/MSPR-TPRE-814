---
name: rules
description: Rappelle et applique les règles transverses du projet FutureKawa (architecture, code, tests, doc, git, sécurité, observabilité, monorepo, parité IA). À déclencher avant toute session de dev ou sur demande explicite ("charge les règles", "applique /rules").
---

Charge en contexte **toutes les règles transverses** du monorepo FutureKawa et applique-les à tout le travail de cette conversation, en plus des règles spécifiques du sous-projet courant.

## Instructions

1. Lis **tous les fichiers** de `.codex/rules/*.md` (ordre numéroté).
2. Considère ces règles comme **obligatoires** pour tout code/commit/PR que tu produis ou revois.
3. En cas de conflit entre une règle transverse et une règle spécifique d'un `AGENTS.md` de sous-projet, la règle **la plus spécifique** l'emporte.
4. Confirme brièvement à l'utilisateur que les règles sont chargées et liste leurs titres (un par ligne), sans recopier le contenu.

## Fichiers à charger

- `.codex/rules/README.md` (index)
- `.codex/rules/01-architecture.md`
- `.codex/rules/02-code.md`
- `.codex/rules/03-feature.md`
- `.codex/rules/04-tests.md`
- `.codex/rules/05-documentation.md`
- `.codex/rules/06-git.md`
- `.codex/rules/07-security.md`
- `.codex/rules/08-observability.md`
- `.codex/rules/09-monorepo.md`
- `.codex/rules/10-ai-parity.md`

La **source canonique** des règles est le dossier `.codex/rules/`. Cette skill est un raccourci pour les injecter en contexte.
