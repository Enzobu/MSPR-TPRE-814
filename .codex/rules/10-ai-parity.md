# 10 — Parité Claude Code ↔ Codex

Le repo supporte **deux assistants IA en parallèle**. Les conventions **diffèrent** — Codex a son propre format officiel (cf. [developers.openai.com/codex](https://developers.openai.com/codex/)). La parité est **sémantique** (mêmes règles, mêmes experts, mêmes workflows), pas byte-à-byte.

## Mapping officiel Codex ↔ Claude Code

| Concept | Codex | Claude Code |
|---|---|---|
| Contexte hiérarchique | `AGENTS.md` (racine + sous-projets) | `CLAUDE.md` (racine + sous-projets) |
| Config projet | `.codex/config.toml` (TOML) | `.claude/settings.json` |
| Subagents | `.codex/agents/<nom>.toml` (clés `name`, `description`, `developer_instructions`, options) | `.claude/agents/<nom>.md` (frontmatter YAML + prompt markdown) |
| Skills (≈ slash commands) | `.agents/skills/<nom>/SKILL.md` (dossier par skill) | `.claude/commands/<nom>.md` |
| Règles thématiques | `.codex/rules/<N>-<theme>.md` (référence docs, chargées par la skill `rules`) | `.claude/rules/<N>-<theme>.md` |
| Config perso | `~/.codex/config.toml` ou `.codex/settings.local.toml` (gitignoré) | `.claude/settings.local.json` (gitignoré) |

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
| `.codex/rules/<N>-…md` | `.claude/rules/<N>-…md` (copie, adaptations `.codex/→.claude/`, `AGENTS.md→CLAUDE.md`, `Codex→Claude Code`) |
| `.codex/agents/<nom>.toml` | `.claude/agents/<nom>.md` — **traduire** les clés TOML vers le frontmatter YAML + prompt markdown |
| `.agents/skills/<nom>/SKILL.md` | `.claude/commands/<nom>.md` — **traduire** la skill en slash command markdown |
| `.codex/config.toml` | `.claude/settings.json` (permissions / allowlist) |
| `AGENTS.md` (racine ou sous-projet) | `CLAUDE.md` du même niveau |

## Vérification avant PR

- [ ] Le diff touche les deux univers (Codex et Claude) de façon sémantiquement symétrique.
- [ ] Si un `AGENTS.md` a été modifié, le `CLAUDE.md` équivalent a reçu la même modification adaptée.
- [ ] Le `PULL_REQUEST_TEMPLATE.md` coche la case **Config Claude/Codex synchronisées**.
- [ ] Review croisée : un membre de l'équipe utilisant **l'autre assistant** a validé le PR.

## Pourquoi

- **Équité** : chaque apprenant dispose du même cadre, quel que soit son outil.
- **Qualité homogène** : les règles de clean archi, DTO in/out, tests, docs s'appliquent identiquement.
- **Pas de bitrot** : sans discipline en PR, les deux configs dérivent en quelques jours.

## Script de vérification (TODO)

Un script `scripts/check-ai-parity.sh` pourra vérifier automatiquement la parité structurelle (fichiers présents des deux côtés, même nombre de règles / agents / skills, pas de commande sans équivalent). Non bloquant pour l'instant — à ajouter si le bitrot devient un problème.
