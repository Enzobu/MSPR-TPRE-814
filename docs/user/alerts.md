---
title: Comprendre les alertes
owner: Yanis
status: implemented
cdc-ref: "§IV.8"
updated: 2026-06-20
---

# Comprendre les alertes et agir

Une **alerte** signale qu'un lot ou un entrepôt sort des conditions normales. Le
but : réagir **avant** que la qualité du café vert ne se dégrade.

> 📷 *(Capture d'écran : l'écran Alertes avec plusieurs alertes)*

## Où voir les alertes

- Sur l'**accueil**, un indicateur vous montre le **nombre d'alertes en cours**.
- L'écran **Alertes** (menu en haut) en donne la **liste complète**, du plus
  récent au plus ancien.

Comme partout, vous pouvez filtrer par **pays** et **paginer** la liste.

## Les types d'alertes

| Type | Ce que ça veut dire | Que faire |
|---|---|---|
| 🌡️ **Température hors plage** | La température de l'entrepôt est sortie de la plage tolérée pour ce pays. | Vérifier la ventilation / climatisation de l'entrepôt. |
| 💧 **Humidité hors plage** | L'humidité est trop haute ou trop basse. | Vérifier l'aération, l'étanchéité, la déshumidification. |
| ⏳ **Lot périmé** | Le lot est stocké depuis plus de **365 jours**. | Le déstocker / le traiter en priorité. |

> Les seuils de température et d'humidité sont **propres à chaque pays** (Brésil,
> Équateur, Colombie) : une même valeur peut être normale dans un pays et en
> alerte dans un autre.

## Lire une alerte

Chaque ligne indique :

- le **type** d'alerte (badge coloré) ;
- le **pays** et l'**entrepôt** (ou le **lot**) concerné ;
- la **date et l'heure** du déclenchement ;
- un **message** décrivant le problème ;
- son **état** : nouvelle ou déjà prise en compte.

## Accuser réception d'une alerte

Quand vous avez **pris connaissance** d'une alerte (et engagé l'action
nécessaire), cliquez sur **Accuser réception**. L'alerte passe alors en état
« prise en compte ».

> Cela ne « répare » pas le problème : c'est un moyen de signaler à l'équipe que
> l'alerte est **traitée ou en cours de traitement**, pour ne pas la traiter à
> double.

## Et l'email ?

En plus de l'affichage à l'écran, le responsable d'exploitation reçoit un
**email** lorsqu'une alerte se déclenche, afin d'être prévenu même sans avoir
l'application ouverte.

> **Une alerte par jour et par cas.** Si une même anomalie persiste sur la
> journée, vous ne recevez **pas** un email toutes les cinq minutes : une seule
> alerte est créée par type, par entrepôt (ou lot) et par jour. C'est volontaire,
> pour éviter le harcèlement de notifications.

## Si vous ne recevez pas d'email

L'alerte reste **toujours visible à l'écran**, même si l'email n'a pas pu partir.
Si les emails n'arrivent pas, voir la [FAQ](faq.md) et prévenez l'administrateur.

## Pour aller plus loin

- Voir les conditions qui ont déclenché l'alerte : [Lire les courbes](monitoring.md)
- Retrouver le lot concerné : [Consulter les lots](lots.md)
