---
title: Questionnaire d'interview — cadrage phase 2
owner: Yanis
status: draft
cdc-ref: "§IV.10"
updated: 2026-07-02
---

# Questionnaire d'interview — cadrage phase 2

Support d'entretien destiné à la prochaine réunion client (Direction Opérations /
Direction Qualité de FutureKawa) pour cadrer l'**automatisation des entrepôts**
(chauffage, humidification, aération pilotés par les relevés T°/humidité). Il
complète le [prototype de schéma d'automatisation](automation-schema.md), qui pose
les hypothèses techniques à **valider ou corriger** avec le métier.

**Mode d'emploi.** Questions ouvertes, à poser en entretien (≈ 45 min). Chaque
thème correspond à une exigence du CDC §IV.10. Noter les réponses et les
désaccords avec les hypothèses du prototype.

---

## 1. Objectifs métier de l'automatisation

- Quel(s) irritant(s) l'automatisation doit-elle résoudre en priorité : pertes
  qualité, temps passé en régulation manuelle, réactivité de nuit/week-end ?
- Quel serait un **succès visible** à 6 mois ? (ex. réduction des lots déclassés,
  baisse du taux de réclamation)
- L'automatisation vise-t-elle **tous** les entrepôts ou d'abord un site pilote ?
- Quelle est la valeur d'un lot « sauvé » d'un déclassement ? (aide à prioriser
  l'investissement)
- Faut-il conserver une **traçabilité des actions** des actionneurs (audit qualité) ?

## 2. Contraintes : sécurité, maintenance, coûts, responsabilités

**Sécurité**
- Quelles limites physiques absolues ne jamais dépasser (température max chauffage,
  humidité max) ? Y a-t-il des risques (incendie, condensation, moisissure) ?
- Un **arrêt d'urgence** matériel est-il exigé en plus de l'arrêt logiciel ?
- Qui doit être alerté en cas de dérive non corrigée par l'automatisation ?

**Maintenance & exploitation**
- Qui exploite les équipements au quotidien (référent local, prestataire) ?
- Quelle disponibilité attendue ? Tolérance à une panne d'un actionneur ?
- Fréquence d'étalonnage des capteurs acceptable ?

**Coûts**
- Enveloppe indicative par entrepôt (capteurs + actionneurs + intégration) ?
- Contrainte sur la consommation énergétique des actionneurs ?

**Responsabilités**
- Qui **valide** le passage en mode automatique d'un entrepôt ?
- Qui est responsable si l'automatisation prend une mauvaise décision ?
- Répartition siège / entité pays sur le paramétrage des seuils ?

## 3. Tolérances et modes manuel / automatique

- Les seuils/tolérances actuels (BR 29 °C/55 %, EC 31 °C/60 %, CO 26 °C/80 %,
  ±3 °C/±2 %) sont-ils les bons **points de régulation**, ou seulement des seuils
  d'alerte ?
- Faut-il une **bande morte / hystérésis** pour éviter les cycles marche/arrêt
  rapprochés ? Amplitude acceptable ?
- Quels modes doivent coexister : **auto**, **manuel**, **auto supervisé**
  (proposition validée par un humain) ?
- Comment bascule-t-on de auto → manuel (et l'inverse) ? Qui a le droit ?
- En mode manuel, l'IoT continue-t-il de **surveiller et alerter** ?

## 4. Priorités de déploiement et indicateurs de réussite

- Ordre de déploiement des pays/entrepôts ? Critères (volume, criticité, réseau) ?
- Quel entrepôt **pilote** et sur quelle durée d'observation avant généralisation ?
- Indicateurs de réussite mesurables : % de temps dans la plage cible, nombre
  d'alertes évitées, lots déclassés évités, MTTR d'une dérive ?
- Existe-t-il une **baseline** (mesures actuelles) pour comparer avant/après ?

## 5. Risques et scénarios d'incident

- Que doit-il se passer si un **capteur tombe en panne** ou renvoie une valeur
  aberrante (fail-safe : couper l'actionneur ? repli mode manuel ?) ?
- Comportement attendu en cas de **coupure réseau/électrique** (état de repli des
  actionneurs) ?
- Que faire si un actionneur se **bloque** (chauffage qui ne s'arrête plus) ?
- Scénarios déjà vécus à ne pas reproduire (retours d'expérience terrain) ?
- Qui décide d'un **retour au manuel** en cas d'incident, et selon quels critères ?

---

## Suite

Les réponses alimenteront une révision du [schéma
d'automatisation](automation-schema.md) (validation des seuils de régulation, des
sécurités et des modes) et cadreront le périmètre du pilote. Lié à #49.
