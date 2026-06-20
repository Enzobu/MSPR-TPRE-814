---
title: FAQ
owner: Yanis
status: implemented
cdc-ref: "§IV.8"
updated: 2026-06-20
---

# Questions fréquentes

Les réponses aux situations les plus courantes. Si vous ne trouvez pas, contactez
votre administrateur.

## Connexion

### Je n'arrive pas à me connecter

Vérifiez votre **email** et votre **mot de passe** (attention aux majuscules).
Le message d'erreur reste volontairement générique par sécurité. Voir
[Se connecter](connexion.md).

### On me redemande de me connecter

Votre session a expiré. Reconnectez-vous : c'est normal après une longue période
d'inactivité.

### Comment changer mon mot de passe ?

La gestion des comptes est assurée par votre **administrateur** : contactez-le.

## Lots

### Dans quel ordre sont affichés les lots ?

Du **plus ancien au plus récent** : c'est l'ordre **FIFO** (premier entré,
premier sorti), c'est-à-dire l'ordre dans lequel les lots doivent être déstockés.

### Que veut dire le statut d'un lot ?

- **Conforme** : tout va bien.
- **En alerte** : conditions hors plage, à surveiller.
- **Périmé** : stocké depuis plus de 365 jours.

Détail : [Consulter les lots](lots.md).

## Mesures et courbes

### « Aucune mesure sur la période »

Aucun relevé n'a encore été reçu pour cet entrepôt : le capteur est peut-être
récent, ou n'a pas encore envoyé de données. Réessayez plus tard.

### Pourquoi un point est-il en rouge sur la courbe ?

Parce qu'il est **hors de la plage tolérée** du pays : c'est une dérive à
surveiller. Voir [Lire les courbes](monitoring.md).

## Alertes

### Quelle est la différence entre « En alerte » et une alerte ?

Le **statut « En alerte »** d'un lot indique que ses conditions sont sorties de
la plage. Une **alerte** (écran Alertes) est l'**événement daté** qui le signale,
avec un message et un email.

### Je n'ai pas reçu l'email d'alerte

L'alerte reste **toujours visible à l'écran**. Si l'email n'arrive pas, prévenez
l'administrateur (paramètres d'envoi). Voir [Comprendre les alertes](alerts.md).

### Je reçois trop peu d'emails

C'est voulu : **une seule alerte par type, par entrepôt (ou lot) et par jour**,
pour éviter d'être submergé de notifications.

## Affichage

### Comment passer en thème sombre ?

Cliquez sur l'**icône utilisateur** en haut à droite et basculez le thème.

### Un bandeau « pays indisponible » est affiché

L'un des pays ne répond pas momentanément. L'application continue de fonctionner
avec les autres pays ; réessayez plus tard pour récupérer le pays manquant.

## Toujours bloqué·e ?

Notez ce que vous faisiez et le message affiché, puis contactez votre
**administrateur** ou l'équipe support.
