# 04 — Tests

## Pyramide

- **Beaucoup d'unitaires** (rapides, isolés, mockent les deps externes).
- **Peu d'intégration** (DB + MQTT réels via `docker-compose.test.yml`).
- **Minimum d'e2e** (parcours critiques uniquement).

## Convention AAA

Arrange / Act / Assert — un comportement par test.

```ts
it('should reject lot older than 365 days', () => {
  // Arrange
  const lot = buildLot({ storedAt: daysAgo(400) });

  // Act
  const result = alertingService.evaluate(lot);

  // Assert
  expect(result).toContain({ type: 'LOT_EXPIRED' });
});
```

## Nommage

- **Impératif anglais** : `should reject lot older than 365 days`, pas `test lots`.
- Préfixer les describes par le nom du SUT : `describe('AlertingService', ...)`.

## Couverture

- **Pas d'objectif 100 %**. Prioriser les règles métier critiques :
  - alertes (seuils T°/humidité par pays, péremption 365j)
  - tri FIFO
  - persistance des mesures MQTT
  - contrats HTTP pays ↔ siège
- La couverture est un indicateur, pas un objectif.

## Environnement

- **Pas de test qui hit la vraie DB ou le vrai broker** sans `docker-compose.test.yml` dédié.
- **Seeds** jetables en début de test, **cleanup** à la fin.

## Anti-patterns

- ❌ Supprimer un test pour le faire passer. Toujours fix le code, ou justifier explicitement le changement d'assertion.
- ❌ Tests flaky tolérés — les identifier, quarantaine temporaire, fix en priorité.
- ❌ Mocks qui testent l'implémentation au lieu du comportement.
