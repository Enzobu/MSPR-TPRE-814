# 01 — Architecture

## Clean architecture

Séparation stricte entre **domain**, **application**, **infrastructure**, **interface**. Les couches internes ne connaissent **jamais** les couches externes.

## Dependency rule

Les dépendances pointent **toujours vers l'intérieur**. Concrètement :

- Le **domain** n'importe ni Prisma, ni HTTP, ni MQTT, ni React.
- L'**application** dépend du domain, pas de l'infra — elle parle à des **ports** (interfaces déclarées dans `domain/`).
- L'**infrastructure** implémente les ports (ex. `PrismaLotRepository implements LotRepository`).
- L'**interface** (contrôleurs REST, pages React) appelle uniquement l'application et transforme via DTOs.

## Séparation des responsabilités (SRP)

Une classe / un module / un fichier = **une seule raison de changer**.

## Aucun import cross-app

`apps/<a>` ne peut pas importer `apps/<b>`. Les échanges inter-apps se font via **HTTP** (siège ↔ pays) ou **MQTT** (IoT → pays), **jamais** via import TypeScript.

## Types partagés exclusivement via `@futurekawa/contracts`

Ne jamais redéfinir localement un type déjà présent dans `contracts`. Si un type manque → l'ajouter dans `contracts` + rebuild.
