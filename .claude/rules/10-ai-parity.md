# 10 — Parité Claude Code ↔ Codex

Le repo supporte **deux assistants IA en parallèle**. Les conventions **diffèrent** — Codex a son propre format officiel (cf. [developers.openai.com/codex](https://developers.openai.com/codex/)). La parité est **sémantique** (mêmes règles, mêmes experts, mêmes workflows), pas byte-à-byte.

## Mapping officiel Claude Code ↔ Codex

| Concept | Claude Code | Codex |
|---|---|---|
| Contexte hiérarchique | `CLAUDE.md` (racine + sous-projets) | `AGENTS.md` (racine + sous-projets) |
| Config projet | `.claude/settings.json` | `.codex/config.toml` (TOML) |
| Subagents | `.claude/agents/<nom>.md` (frontmatter YAML + prompt markdown) | `.codex/agents/<nom>.toml` (clés `name`, `description`, `developer_instructions`, options) |
| Slash commands | `.claude/commands/<nom>.md` | Skills dans `.agents/skills/<nom>/SKILL.md` (dossier par skill) |
| Règles thématiques | `.claude/rules/<N>-<theme>.md` | `.codex/rules/<N>-<theme>.md` (mêmes fichiers — référence docs, chargées par la skill `rules`) |
| Config perso | `.claude/settings.local.json` (gitignoré) | `~/.codex/config.toml` ou `.codex/settings.local.toml` (gitignoré) |

Notes officielles Codex :
- `.codex/config.toml` est du **TOML**, pas JSON.
- Subagents au format **TOML**, documentés sur [Codex Subagents](https://developers.openai.com/codex/subagents).
- Skills dans `.agents/skills/<nom>/SKILL.md` ([Agent Skills](https://developers.openai.com/codex/skills)) — `.agents/`, pas `.codex/`.
- Codex n'a **pas** de convention native `rules/` — le dossier `.codex/rules/` du repo est un choix projet, chargé via la skill `rules`.

## Règle principale

**Toute modification d'un côté doit être répliquée sémantiquement de l'autre, dans le même PR.** Le contenu doit être équivalent, même si la syntaxe diffère.

Concrètement :

| Si tu modifies… | Tu DOIS aussi modifier… |
|---|---|
| `.claude/rules/<N>-…md` | `.codex/rules/<N>-…md` (copie, adaptations `.claude/→.codex/`, `CLAUDE.md→AGENTS.md`, `Claude Code→Codex`) |
| `.claude/agents/<nom>.md` | `.codex/agents/<nom>.toml` — **traduire** le frontmatter + prompt vers les clés TOML (`name`, `description`, `developer_instructions`) |
| `.claude/commands/<nom>.md` | `.agents/skills/<nom>/SKILL.md` — **traduire** en skill (frontmatter `name` + `description`, contenu markdown) |
| `.claude/settings.json` (permissions) | `.codex/config.toml` (approval_policy, sandbox_mode, etc.) |
| `CLAUDE.md` (racine ou sous-projet) | `AGENTS.md` du même niveau |

## Vérification avant PR

- [ ] Le diff touche les deux univers (Claude et Codex) de façon sémantiquement symétrique.
- [ ] Si un `CLAUDE.md` a été modifié, l'`AGENTS.md` équivalent a reçu la même modification adaptée.
- [ ] Le `PULL_REQUEST_TEMPLATE.md` coche la case **Config Claude/Codex synchronisées**.
- [ ] Review croisée : un membre de l'équipe utilisant **l'autre assistant** a validé le PR.

## Pourquoi

- **Équité** : chaque apprenant dispose du même cadre, quel que soit son outil.
- **Qualité homogène** : les règles de clean archi, DTO in/out, tests, docs s'appliquent identiquement.
- **Pas de bitrot** : sans discipline en PR, les deux configs dérivent en quelques jours.

## Script de vérification (TODO)

Un script `scripts/check-ai-parity.sh` pourra vérifier automatiquement la parité structurelle (fichiers présents des deux côtés, même nombre de règles / agents / skills, pas de commande sans équivalent). Non bloquant pour l'instant — à ajouter si le bitrot devient un problème.
