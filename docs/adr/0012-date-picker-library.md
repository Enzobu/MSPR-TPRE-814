---
title: Date picker (react-day-picker via shadcn Calendar)
owner: Yanis
status: accepted
updated: 2026-07-01
adr-refs: [0005]
---

# 0012 — Date picker (react-day-picker via shadcn Calendar)

## Contexte

La vue de suivi des relevés par région (#143) a besoin d'un **filtre par jour** sur
l'historique T°/humidité. Le premier jet utilisait un `<input type="date">` natif,
au rendu incohérent avec le design system (preset Nova) et peu maîtrisable.

L'ADR-0005 fige la stack frontend et impose : « ne pas introduire d'autres libs
sans nouvel ADR ». Ajouter un sélecteur de date est donc un choix structurant à
acter.

Options envisagées :
1. **`<input type="date">` natif** — zéro dépendance, mais UI non alignée sur
   shadcn, comportement/format variables selon navigateur/OS.
2. **Composant `Calendar` de shadcn** (basé sur `react-day-picker`) — chemin
   canonique shadcn, cohérent avec les composants déjà installés (Nova, Radix,
   Lucide). Tire `react-day-picker` + `date-fns` (locales).
3. Écrire un calendrier maison — coût et risque d'accessibilité injustifiés.

## Décision

Adopter le **date picker shadcn** : composants `calendar` + `popover` ajoutés via
le CLI shadcn, ce qui introduit les dépendances runtime **`react-day-picker`** et
**`date-fns`** (utilisée pour la locale `fr`).

Ces deux libs complètent la stack figée par l'ADR-0005 (elles ne remplacent rien).

## Conséquences

**Positives :**
- UI cohérente avec le design system, accessible (clavier), locale FR.
- Chemin standard shadcn → maintenance et upgrades documentés.

**Négatives / neutres :**
- Deux dépendances de plus dans le bundle front (arbre `date-fns` tree-shakable ;
  `react-day-picker` chargé avec la page monitoring, elle-même lazy-loadée).
- `calendar.tsx` généré est adapté d'un point : import de `buttonVariants` depuis
  `@/components/ui/button-variants` (split du repo pour la règle react-refresh).
- Le jour sélectionné est raisonné en **heure locale** de l'utilisateur puis
  converti en bornes UTC pour l'API (voir `features/measurements/lib/day-range.ts`).
