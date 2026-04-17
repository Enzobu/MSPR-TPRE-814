---
title: Assistants IA — Claude Code & Codex
owner: Yanis
status: implemented
updated: 2026-04-17
---

# Assistants IA — Claude Code & Codex

Ce projet supporte **deux assistants IA en parallèle**. L'équipe est mixte : certains membres travaillent avec **Claude Code**, d'autres avec **Codex**. Pour garantir une qualité homogène, les deux configurations sont tenues en **parité sémantique** — même si leurs formats diffèrent.

## Mapping officiel des deux configs

| Concept | Claude Code | Codex |
|---|---|---|
| Contexte hiérarchique | `CLAUDE.md` (racine + 5 sous-projets) | `AGENTS.md` (racine + 5 sous-projets) |
| Config projet | `.claude/settings.json` | `.codex/config.toml` (TOML) |
| Subagents | `.claude/agents/<nom>.md` (frontmatter YAML) | `.codex/agents/<nom>.toml` (TOML) |
| Slash commands / skills | `.claude/commands/<nom>.md` | `.agents/skills/<nom>/SKILL.md` (dossier par skill — `.agents/`, pas `.codex/`) |
| Règles thématiques | `.claude/rules/<N>-….md` (auto-loaded) | `.codex/rules/<N>-….md` (reference docs, chargées via skill `rules`) |
| Config perso (gitignoré) | `.claude/settings.local.json` | `~/.codex/config.toml` ou `.codex/settings.local.toml` |

Références officielles Codex :
- [AGENTS.md — custom instructions](https://developers.openai.com/codex/guides/agents-md)
- [Config basics](https://developers.openai.com/codex/config-basic)
- [Subagents](https://developers.openai.com/codex/subagents)
- [Agent Skills](https://developers.openai.com/codex/skills)

## Règle de parité

**Toute modification doit être répliquée sémantiquement dans les deux configurations, dans le même PR.** Le contenu doit être équivalent, même si la syntaxe diffère.

Règle complète : [`.claude/rules/10-ai-parity.md`](../../.claude/rules/10-ai-parity.md) ≡ [`.codex/rules/10-ai-parity.md`](../../.codex/rules/10-ai-parity.md).

## Comment ajouter une règle / un subagent / une skill

### Ajouter une règle transverse

```bash
# 1. Créer le fichier côté Claude (markdown standard)
vim .claude/rules/11-ma-nouvelle-regle.md

# 2. Répliquer côté Codex (format identique, adapter les chemins)
cp .claude/rules/11-ma-nouvelle-regle.md .codex/rules/11-ma-nouvelle-regle.md
sed -i '' \
  -e 's|\.claude/|.codex/|g' \
  -e 's|CLAUDE\.md|AGENTS.md|g' \
  -e 's|Claude Code|Codex|g' \
  .codex/rules/11-ma-nouvelle-regle.md

# 3. Mettre à jour les README des deux dossiers rules/
#    + la skill rules (.agents/skills/rules/SKILL.md) + la commande Claude (.claude/commands/rules.md)

# 4. Commit + PR, cocher la case "Config Claude/Codex synchronisées"
```

### Ajouter un subagent

**Côté Claude** (`.claude/agents/nouveau.md`) — markdown avec frontmatter YAML :

```markdown
---
name: nouveau-expert
description: Quand utiliser cet agent…
tools: Read, Grep, Edit, Write
---

Tu es un expert en X. Tes instructions…
```

**Côté Codex** (`.codex/agents/nouveau.toml`) — TOML avec clés :

```toml
name = "nouveau-expert"
description = "Quand utiliser cet agent…"
sandbox_mode = "workspace-write"
developer_instructions = """
Tu es un expert en X. Tes instructions…
"""
```

Les deux doivent exprimer **la même expertise** et les **mêmes règles métier**.

### Ajouter une skill / slash command

**Côté Claude** (`.claude/commands/ma-skill.md`) :

```markdown
---
description: Ce que fait la commande
argument-hint: <args>
---

Instructions…
```

**Côté Codex** (`.agents/skills/ma-skill/SKILL.md`) :

```markdown
---
name: ma-skill
description: Quand déclencher cette skill (pour invocation implicite)
---

Instructions…
```

Les deux déclenchent **le même comportement**.

## Validation croisée en PR

Un PR touchant `.claude/`, `.codex/`, `.agents/`, `CLAUDE.md` ou `AGENTS.md` doit être relu par **un membre utilisant l'autre assistant**. Objectif : vérifier empiriquement qu'un utilisateur Codex obtient le même cadre qu'un utilisateur Claude, et réciproquement.

## Check de parité (futur)

Un script `scripts/check-ai-parity.sh` pourra vérifier :
- Fichiers présents des deux côtés (règle, agent, skill/command).
- Même liste de règles `01-09` (+ `10-ai-parity`).
- Même liste de subagents.
- Même liste de skills ↔ commands.

Non bloquant pour l'instant — à ajouter si le bitrot devient un problème (voir TODO dans issue #53).
