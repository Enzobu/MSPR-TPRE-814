---
title: VitePress pour la documentation utilisateur
owner: Yanis
status: accepted
updated: 2026-06-20
cdc-ref: "§IV.8"
adr-refs: [0005]
---

# 0009 — VitePress pour la documentation utilisateur

## Contexte

La documentation utilisateur métier (CDC §IV.8, contenu du ticket #44) s'adresse
à un public **non technique** (responsables d'exploitation pays/siège). Du
markdown brut dans `docs/user/` n'offre ni **navigation**, ni **recherche**, ni
**rendu agréable** — or le CDC évalue la qualité et l'accessibilité des
livrables.

Contraintes :

- La règle [`05-documentation.md`](../../.claude/rules/05-documentation.md) impose
  **markdown uniquement** et une **arborescence `docs/` figée** : l'outil doit
  **consommer le markdown existant**, sans le dupliquer ni le déplacer.
- Le frontmatter YAML (`title/owner/status/updated`) doit **rester valide**.
- Stack JS/TS, monorepo **pnpm** : l'outil doit s'y intégrer naturellement.
- Effort de mise en place **maîtrisable** (équipe de 4).

### Options envisagées

1. **Markdown brut** (statu quo) : lu dans le dépôt/GitHub. Zéro navigation ni
   recherche, peu engageant pour un public métier.
2. **Docusaurus** : très complet mais plus lourd (React, config, build plus lent),
   surdimensionné pour quelques pages utilisateur.
3. **MkDocs (Material)** : excellent, mais **écosystème Python** — étranger au
   monorepo pnpm/TS (toolchain et CI séparées à maintenir).
4. **VitePress** *(retenu)* : générateur de site statique **Vite**, markdown-first,
   thème par défaut soigné, **recherche locale** intégrée, FR natif, intégration
   pnpm triviale.

## Décision

Nous retenons **VitePress** pour servir **uniquement** `docs/user/`.

- **Dépendance dev unique** à la racine du monorepo (`vitepress`), scripts
  `docs:dev` / `docs:build` / `docs:preview`.
- **Config** dans `docs/.vitepress/config.mts` (extension `.mts` car VitePress est
  **ESM-only** ; évite d'imposer `"type": "module"` à la racine).
- **`srcDir: './user'`** : le site ne sert que la doc utilisateur. La doc
  technique (architecture, ADR, testing, ci-cd, operations) **reste du markdown**
  consulté dans le dépôt, **hors** VitePress.
- **`srcExclude: ['README.md']`** : le `README.md` reste l'index GitHub du dossier
  (règle 05) ; la home du site est `index.md` (layout `home`, hero + features).
- **Recherche locale** activée (`search.provider: 'local'`), **langue FR**.
- **Build vérifié en CI** : un job GitHub Actions exécute `pnpm docs:build`.

## Conséquences

### Positives

- Site **navigable + recherche** pour un public métier, rendu propre (clair/sombre).
- **Zéro duplication** : VitePress lit le markdown existant de `docs/user/`.
- Intégration **pnpm/Vite** native, cohérente avec la stack ([ADR-0005](0005-frontend-stack.md)).
- Build rapide, vérifiable en CI → pas de régression silencieuse de la doc.

### Négatives

- Une dépendance dev de plus à maintenir à la racine.
- Config en `.mts` (ESM-only) — spécificité à connaître.
- Frontmatter : la home `index.md` combine champs règle 05 **et** champs VitePress
  (`layout/hero/features`) — cohabitation à respecter.

### Neutres

- **Hébergement public** du site **non décidé** ici (le build produit un statique ;
  publication à trancher séparément si besoin).
- Le périmètre « user uniquement » peut être étendu plus tard via un nouvel ADR.

## Références

- CDC : §IV.8 (documentation utilisateur).
- Règle : [`05-documentation.md`](../../.claude/rules/05-documentation.md).
- Contenu : ticket #44 — Outillage : ticket #58.
- Config : `docs/.vitepress/config.mts` · Scripts : `package.json` (racine).
- ADR lié : [0005 — Stack frontend](0005-frontend-stack.md).
