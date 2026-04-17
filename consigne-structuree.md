# MSPR TPRE-814 — Cahier des Charges FutureKawa

> **Certification professionnelle** : Expert en Informatique et Système d'Information — RNCP35584
> **Bloc 4** : Concevoir et développer des solutions applicatives métier et spécifiques (mobiles, embarquées et ERP)
> **Sujet** : Conception d'une solution applicative en adéquation avec l'environnement technique étudié

---

## Sommaire

1. [Compétences évaluées](#1-compétences-évaluées)
2. [Modalités d'évaluation](#2-modalités-dévaluation)
3. [Contexte global et métier](#3-contexte-global-et-métier)
4. [Cahier des charges](#4-cahier-des-charges)
5. [Besoins exprimés par le client](#5-besoins-exprimés-par-le-client)
6. [Livrables](#6-livrables)
7. [Ressources fournies](#7-ressources-fournies)

---

## 1. Compétences évaluées

- **Collecter les besoins métiers** des utilisateurs via interviews pour étudier la faisabilité d'une solution applicative.
- **Concevoir une architecture applicative** distribuée ou micro-service, évolutive et tolérante aux pannes.
- **Développer une application** avec un langage adéquat répondant aux besoins métiers.
- **Développer une solution intégrée** via paramétrage et langage spécifique de l'éditeur.
- **Effectuer les tests** de la solution pour identifier erreurs et établir les plans de correction.
- **Appliquer l'intégration continue** pour vérifier la conformité de la solution.
- **Vérifier la conformité** entre la solution et les fonctionnalités attendues, rédiger la documentation utilisateur.
- **Conduire le changement** auprès des métiers via participation, communication et formation.

---

## 2. Modalités d'évaluation

### Préparation
- **Durée** : 24 heures
- **Équipe** : 4 apprenants-candidats (5 maximum si groupe impair)

### Soutenance (Phase 2)
| Étape | Durée |
|-------|-------|
| Soutenance orale par l'équipe | 20 min |
| Entretien collectif avec le jury | 30 min |
| **Total par groupe** | **50 min** |

### Jury
2 évaluateurs (binôme) n'ayant pas participé à la formation et ne connaissant pas les apprenants.

---

## 3. Contexte global et métier

**FutureKawa** est une entreprise internationale spécialisée dans la **caféiculture** et la **logistique de café vert**, présente au **Brésil, Équateur et Colombie**.

### 3.1 Activité et chaîne de valeur

- **Production agricole** : pilotage de parcelles, cycles de culture, récolte, tri/séchage.
- **Constitution de lots** : Id unique, pays, exploitation, date, qualité.
- **Stockage en entrepôts** : conditions critiques (température, humidité).
- **Distribution internationale** : vente B2B de café vert non torréfié.

### 3.2 Clients et modèle économique

**Clients principaux** :
- Torréfacteurs industriels et artisanaux
- Marques de café (grande distribution / premium)
- Importateurs-distributeurs
- Acteurs de l'agroalimentaire (extraits, arômes, blends)

**Business model** :
- Vente de lots de café vert (contrats cadres + commandes au fil de l'eau)
- Engagements qualité et traçabilité (origine, stockage, historique)
- Services associés : gestion stocks, réservation lots, priorisation, reporting

### 3.3 Organigramme simplifié

#### Direction Générale (siège)
- **CEO / Direction générale** : stratégie, grands comptes, conformité
- **Direction Opérations & Supply Chain** : logistique, entrepôts, transport
- **Direction Qualité** : contrôle lots, audits, traçabilité
- **Direction Finance & Administration** : achats, contrats, facturation
- **Direction Commerciale** : relation clients, prévisions, catalogue
- **Direction SI / Informatique** : applications, données, infrastructures

#### Entités par pays (Brésil / Équateur / Colombie)
- Responsable d'exploitation
- Responsable entrepôt
- Référent qualité local
- Correspondant SI local

### 3.4 Enjeux métier actuels

| Irritant | Conséquence |
|----------|-------------|
| Conditions de stockage variables | Impact qualité |
| Suivis semi-manuels (tableurs, outils hétérogènes) | Auditabilité difficile |
| Visibilité FIFO peu fiable | Mauvaise rotation des stocks |
| Demandes croissantes de preuves clients | Risque de non-conformité |

**Impacts** : taux de réclamation, coûts de pertes, confiance client, valorisation des lots premium.

### 3.5 Système d'information

SI **hybride** : ERP central + outils opérationnels (tableurs, applications légères) + volonté d'industrialisation.

**Équipe SI** :
- DSI / Responsable SI
- Équipe Applications (2-3 pers.)
- Équipe Data/BI (1-2 pers.)
- Équipe Infra/DevOps (1-2 pers.)
- Support utilisateurs (N1 local + N2 DevOps)

**Contraintes** : réseau variable, matériel limité, multi-sites/multi-pays, exigences sécurité/traçabilité.

### 3.6 Ambition à 12-18 mois

Standardiser le suivi de stockage et préparer une **phase 2** : automatisation des entrepôts (chauffage, humidification, aération pilotée par capteurs).

---

## 4. Cahier des charges

**Commanditaires** : Direction des Opérations, Direction Qualité, soutien Direction SI.

**Bénéficiaires** :
- Responsables d'exploitation (BR / EC / CO)
- Responsables d'entrepôt
- Équipes Qualité
- Équipes Supply Chain
- Siège (pilotage, consolidation, reporting)

### 4.1 Objectifs macro

- Centraliser le suivi des stocks par pays/entrepôt
- Garantir la traçabilité des lots
- Surveiller les conditions (T° / humidité) via relevés automatisés
- Détecter et signaler les situations à risque
- Préparer l'évolution vers l'automatisation

### 4.2 Exigences globales

- Solution applicative **backend + frontend**
- Intégration IoT via **MQTT**
- Persistance fiable en **base SQL**
- Architecture **distribuée** (pays ↔ siège)
- Qualité projet : documentation, tests, CI, conduite du changement

---

## 5. Besoins exprimés par le client

### 5.1 Gestion des exploitations / entrepôts et lots

**Objectif** : traçabilité fiable + rotation FIFO.

**Exigences** :
- Gérer ≥ 3 pays (Brésil, Équateur, Colombie) et leurs entrepôts
- Chaque lot identifié par un **Id unique**
- Mémorisation minimale par lot :
  - Id du lot
  - Pays / exploitation / entrepôt
  - Date de stockage
  - Statut (conforme / en alerte / périmé)
- Tri par date de stockage (FIFO)
- Consultation centralisée depuis le siège

### 5.2 Surveillance IoT : température et humidité

**Objectif** : remonter automatiquement les conditions de stockage.

**Exigences** :
- Module IoT par pays (microcontrôleur + capteur T°/humidité)
- Transmission via **broker MQTT local**
- Persistance en base SQL

#### Conditions idéales par pays

| Pays | Température | Humidité |
|------|-------------|----------|
| Brésil | 29 °C | 55 % |
| Équateur | 31 °C | 60 % |
| Colombie | 26 °C | 80 % |

#### Tolérances acceptables

| Mesure | Tolérance |
|--------|-----------|
| Température | ± 3 °C |
| Humidité | ± 2 % |

- Historique consultable pour traçabilité et analyse des dérives.

### 5.3 Application Web

**Objectif** : outil unique pour terrain et siège.

**Fonctionnalités** :
- Sélectionner une exploitation / pays
- Lister les lots triés par date de stockage
- Sélectionner un lot
- Afficher les courbes de T° et humidité depuis stockage

**Qualités attendues** :
- Lisible pour les utilisateurs terrain
- Exploitable par le siège
- Accès rapide aux alertes et statuts

### 5.4 Alertes automatiques

**Cas de déclenchement** :
1. **Conditions hors plage** acceptable selon le pays
2. **Lot trop ancien** : > 1 an (365 jours) en stockage

**Action** : envoi d'un **email** au responsable d'exploitation du pays concerné.

**Documentation requise** : règles, seuils, fréquence de vérification, contenu des emails.

### 5.5 Architecture distribuée

#### Backend pays (par pays, conteneurisé)
- Base SQL
- Broker MQTT local
- API REST :
  - Enregistrer de nouveaux lots
  - Exposer stocks et mesures au siège
- Dispositif d'alerting (email + règles)

#### Backend central (siège)
- Requêter les backends pays via API
- Alimenter le frontend en informations consolidées (stocks, mesures, alertes)
- Héberger le frontend Web

> Les choix d'architecture (microservices, découpage, résilience) doivent être **justifiés**.

### 5.6 Préparation au changement (phase 2)

**Future automatisation** : chauffage, humidification, aération pilotés par capteurs.

**Livrables attendus** :
- Prototype de schéma : capteurs → décision → actionneurs + sécurités
- Questionnaire d'interview pour préciser :
  - Besoins métiers
  - Contraintes de sécurité
  - Limites d'automatisation acceptables
  - Modalités de maintenance et exploitation
  - Priorités de déploiement

---

## 6. Livrables

### 6.1 Backend pays « exemple », conteneurisé

- API REST pour gérer lots et exposer mesures
- Base SQL
- Broker MQTT local
- Mécanisme d'alertes et envoi d'emails
- **Conteneurisé** (Docker / Docker Compose), démarrable via `docker compose up`
- Documentation de lancement

### 6.2 Backend central (siège) + Frontend Web

**Backend central** : interroge les backends pays pour consolider stocks, mesures, alertes.

**Frontend Web** :
- Sélection exploitation/pays
- Affichage des lots triés par date
- Consultation lot + courbes T°/humidité
- Accès aux alertes et statuts

### 6.3 Prototype fonctionnel du module IoT

- Microcontrôleur + capteur T°/humidité
- Publication MQTT vers le broker
- Démonstration de la persistance et consultation côté backend

### 6.4 Documentation argumentée (dossier technique)

#### 6.4.1 Architecture globale
- Description architecture pays + siège
- Justification des choix techno et du découpage
- Robustesse (tolérance pannes, reprise, logs, supervision)

#### 6.4.2 Conception du module IoT
- Schéma de câblage, choix matériel, limites/risques
- Protocole MQTT (topics, formats payload, fréquence d'envoi)
- Stratégie reconnexion / gestion des erreurs

#### 6.4.3 Plans de tests détaillés
- Stratégie : unitaires / intégration / API / UI / end-to-end
- Cas de test, données, critères de réussite
- Gestion des anomalies (constat, correction, re-test)

### 6.5 Pipelines CI/CD (Jenkins)

- Build
- Tests automatisés
- Vérification qualité
- Packaging (images Docker / artefacts)
- Mise à disposition d'artefacts pour démo
- **Jenkinsfile** ou config documentée + preuve d'exécution

### 6.6 Tests lançables manuellement

- Commandes simples
- Documentation (pré-requis, variables, jeux de données)
- Résultats lisibles (logs/rapport)

### 6.7 Code source versionné (Git)

- Code complet (backend pays, central, frontend, IoT, scripts)
- Branches et commits cohérents
- README de prise en main
- Documentation et scripts de lancement
- Issues / backlog (optionnel)

### 6.8 Documentation utilisateur (métier)

- Prise en main de l'interface Web
- Création/consultation des lots
- Lecture des courbes (T°/humidité)
- Compréhension des alertes et actions
- FAQ / résolution des problèmes simples

### 6.9 Prototype de schéma : automatisation

- Capteurs → traitement/décision → actionneurs
- Cas nominal et cas dégradé
- Sécurités (seuils, arrêt d'urgence, manuel/auto)
- Point d'intégration avec la solution IoT

### 6.10 Questionnaire interview phase 2

À structurer pour préciser :
- Objectifs métier de l'automatisation
- Contraintes (sécurité, maintenance, coûts, responsabilités)
- Tolérances, modes manuels/automatiques
- Priorités de déploiement et indicateurs de réussite
- Risques et scénarios d'incident

> **Support de présentation** pour la soutenance finale (public technique) attendu en complément.

### Critères d'évaluation

L'évaluation repose sur trois éléments combinés :
1. Qualité du travail réalisé
2. Pertinence et exhaustivité des livrables
3. Capacité à présenter, justifier et valoriser le travail à l'oral

---

## 7. Ressources fournies

### 7.1 Matériel (par équipe, minimum)

- 1 microcontrôleur
- 1 breadboard
- 1 capteur température / humidité
- Câblage de prototypage

> Références exactes communiquées par message privé.

### 7.2 Webographie

#### IoT / ESP32 / Capteurs
- [Arduino-ESP32 (Espressif)](https://docs.espressif.com/projects/arduino-esp32/)
- [MicroPython Documentation](https://docs.micropython.org/)
- [MicroPython Quick reference ESP32](https://docs.micropython.org/en/latest/esp32/quickref.html)
- [Adafruit Learn — DHT11/DHT22](https://learn.adafruit.com/dht)

#### MQTT / Broker
- [MQTT v5.0 (OASIS)](https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html)
- [Mosquitto Documentation](https://mosquitto.org/documentation/)
- [Docker image eclipse-mosquitto](https://hub.docker.com/_/eclipse-mosquitto)

#### Node-RED (alerting, orchestration)
- [Node-RED Documentation](https://nodered.org/docs/)
- [Node-RED Cookbook](https://cookbook.nodered.org/)

#### Conteneurisation / Docker
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)

#### CI/CD — Jenkins
- [Jenkins User Handbook](https://www.jenkins.io/doc/)
- [Jenkins Pipeline](https://www.jenkins.io/doc/book/pipeline/)

#### API / Documentation / Contrats
- [OpenAPI Initiative](https://www.openapis.org/)
- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html)
- [Swagger](https://swagger.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [MariaDB Documentation](https://mariadb.com/kb/en/documentation/)

#### Frontend & dataviz
- [React Documentation](https://react.dev/)
- [Chart.js Documentation](https://www.chartjs.org/docs/latest/)

#### Sécurité applicative
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)

### 7.3 Assistance et périmètre

> **Aucun contact direct avec le client.** Le cahier des charges est la seule expression officielle du besoin. Toute clarification passe par l'**encadrant pédagogique** jouant le rôle du client.
