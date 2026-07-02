---
title: Consulter les lots de café vert
owner: Yanis
status: implemented
cdc-ref: "§IV.8"
updated: 2026-07-02
---

# Consulter les lots

L'écran **Lots** (menu « Lots » en haut de l'application) liste les lots de café
vert stockés, consolidés depuis les différents pays (Brésil, Équateur,
Colombie).

## La liste des lots

- Les lots sont affichés **du plus ancien au plus récent** (ordre **FIFO** :
  premier entré, premier sorti) — c'est l'ordre dans lequel ils doivent être
  déstockés.
- Chaque ligne indique l'**identifiant** du lot, son **pays**, l'**exploitation**
  d'origine, l'**entrepôt**, la **date de stockage** et le **statut**.

### Filtrer et trier

- **Filtre par pays** : boutons *Tous / BR / EC / CO* pour ne voir qu'un pays.
- **Filtre par exploitation** : menu déroulant *Exploitation* pour n'afficher que
  les lots d'une exploitation. Tapez pour rechercher dans la liste ; *Toutes les
  exploitations* réinitialise.
- **Filtre par entrepôt** : menu déroulant *Entrepôt*, même fonctionnement.
- **Sens du tri** : le bouton *Plus anciens / Plus récents* inverse l'ordre.
- **Pagination** : boutons *Précédent / Suivant* en bas de la liste.

> Les listes d'exploitations et d'entrepôts proposées s'adaptent au pays
> sélectionné. Ces filtres portent sur **l'ensemble** des lots (pas seulement la
> page affichée).

> Les filtres sont mémorisés dans l'adresse de la page : vous pouvez
> **recharger** ou **partager** un lien qui rouvre la même vue.

## Le statut d'un lot

| Badge | Signification |
|---|---|
| **Conforme** | Lot dans les conditions normales. |
| **En alerte** | Conditions hors plage : à surveiller. |
| **Périmé** | Lot stocké depuis plus de 365 jours. |

## Le détail d'un lot

Cliquez sur l'**identifiant** d'un lot pour ouvrir sa fiche (pays, exploitation,
entrepôt, date de stockage, statut). Le bouton *Retour aux lots* ramène à la
liste.

## Un pays momentanément indisponible

Si un pays ne répond pas, un **bandeau d'avertissement** s'affiche et la liste
montre les lots des pays disponibles : l'écran ne tombe jamais en erreur
complète. Réessayez plus tard pour récupérer les données du pays manquant.
