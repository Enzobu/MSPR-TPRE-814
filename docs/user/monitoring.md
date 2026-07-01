---
title: Lire les courbes de température et d'humidité
owner: Yanis
status: implemented
cdc-ref: "§IV.8"
updated: 2026-07-01
---

# Suivre les relevés par région

La page **Suivi** (menu de gauche) affiche, pour **chaque région** (Brésil,
Équateur, Colombie), le **dernier relevé** de température et d'humidité avec son
**horodatage**.

- Une valeur **hors des seuils du pays** est affichée en **rouge** avec un badge
  **« Hors seuil »**.
- **« Aucun relevé pour le moment. »** : la région n'a encore aucune donnée.
- **« Région injoignable »** : le backend de cette région ne répond pas ; un
  bandeau récapitule les régions concernées. Réessayez plus tard.

**Cliquez sur une région** pour dérouler, en dessous, l'**historique** de ses
courbes de température et d'humidité (mêmes graphiques que sur la fiche d'un lot,
décrits ci-dessous). La région sélectionnée est **le pays choisi dans le sélecteur
de la barre latérale** : changer l'un met à jour l'autre (et l'URL, partageable).

Au-dessus des courbes, le **filtre « Jour »** restreint l'historique à une
journée précise ; **« Tout l'historique »** revient à la vue complète.

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
