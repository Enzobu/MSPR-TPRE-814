---
title: Statut de lot piloté par les conditions de l'entrepôt
owner: Yanis
status: accepted
updated: 2026-07-02
cdc-ref: "§III.1"
adr-refs: [0003, 0004]
---

# 0013 — Statut de lot piloté par les conditions de l'entrepôt

## Contexte

Le CDC §III.1 prévoit trois statuts de lot : `CONFORME`, `EN_ALERTE`, `PERIME`.
`PERIME` est posé par le cron de péremption (ADR-0004). Jusqu'ici, **rien ne
faisait passer un lot à `EN_ALERTE`** : une mesure hors plage levait une `Alert`
(ADR-0004) mais ne modifiait pas le statut du lot, si bien qu'un lot en anomalie
n'apparaissait jamais « en alerte » dans la liste des stocks (#151).

Les conditions T°/humidité sont mesurées **par entrepôt**, pas par lot. Un lot
hérite donc de l'état de son entrepôt. Question ouverte : **quand un lot quitte
`EN_ALERTE` ?** Options envisagées :

1. **Auto au prochain relevé dans la plage** (retenu).
2. Auto après N relevés consécutifs dans la plage (hystérésis).
3. Manuel uniquement (acquittement humain).

## Décision

- À chaque **ingestion de mesure** (MQTT ou REST), on évalue l'entrepôt avec le
  même évaluateur pur que l'alerting (`evaluateMeasurement`, ADR-0004) :
  - **hors plage** → les lots `CONFORME` de l'entrepôt passent `EN_ALERTE` ;
  - **dans la plage** → les lots `EN_ALERTE` de l'entrepôt reviennent `CONFORME`
    (**option 1** : retour dès le premier relevé conforme).
- Les lots `PERIME` ne sont **jamais** touchés : la péremption prime (le filtre de
  transition ne cible que `CONFORME`↔`EN_ALERTE`).
- La transition est faite en **masse** par entrepôt (`updateMany`), en
  **best-effort** vis-à-vis de l'ingestion : un échec logue un `warn` et ne fait
  jamais échouer la persistance de la mesure (cohérent avec l'alerting, ADR-0004).
- L'`Alert` (persistée + email) reste gérée séparément par l'alerting : ce statut
  n'émet **pas** de second email.

## Conséquences

- **Positif** : la liste des stocks reflète l'état réel ; démontrable en live via
  `/mqtt-simulate` (une mesure hors plage puis une mesure OK).
- **Positif** : aucune donnée dupliquée — seuils et évaluation restent la source
  unique de l'alerting (`COUNTRY_CONDITIONS` + `evaluateMeasurement`).
- **Négatif / connu** : pas d'hystérésis → un entrepôt qui oscille autour de la
  borne fait « clignoter » le statut. Acceptable en phase 1 (surveillance) ;
  l'option 2 pourra faire l'objet d'un ADR ultérieur si le bruit gêne.
- **Négatif / connu** : le retour `CONFORME` ne distingue pas un lot qui n'a
  jamais été en alerte d'un lot rétabli (pas d'historique de statut) — hors scope.
- **Couplage** : `MeasurementsModule` importe `LotsModule` (use-case
  `SyncWarehouseLotStatusUseCase` exporté). Pas de cycle : `LotsModule` n'importe
  personne.
