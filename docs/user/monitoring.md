---
title: Lire les courbes de température et d'humidité
owner: Yanis
status: implemented
cdc-ref: "§IV.8"
updated: 2026-06-19
---

# Suivre les conditions d'un lot

Depuis la **fiche d'un lot** (cliquez sur un lot dans la liste), la section
**Conditions de stockage** affiche l'évolution de la **température** et de
l'**humidité** de l'entrepôt depuis l'entrée du lot en stockage.

## Les courbes

- Deux graphiques : un pour la **température (°C)**, un pour l'**humidité (%)**.
- L'axe horizontal est le **temps** (depuis la date de stockage du lot).
- Chaque point est un relevé du capteur.

### Lignes et bande de référence

- La **ligne « Idéal »** correspond à la valeur cible du pays du lot.
- La **bande grisée** autour est la **plage tolérée** (idéal ± tolérance), propre
  à chaque pays (Brésil / Équateur / Colombie).
- Un point **hors de cette plage** est affiché en **rouge** et **agrandi** : c'est
  une dérive à surveiller.

## Les statistiques

Sous les courbes, un encart résume, sur la période : **min / max / moyenne** de
température et d'humidité, et le **nombre de relevés hors tolérance**.

## Cas particuliers

- **« Aucune mesure sur la période. »** : aucun relevé n'a encore été reçu pour
  cet entrepôt (capteur récent, ou pas encore de données).
- **Pays momentanément indisponible** : un bandeau d'avertissement s'affiche ;
  réessayez plus tard pour récupérer les relevés.
