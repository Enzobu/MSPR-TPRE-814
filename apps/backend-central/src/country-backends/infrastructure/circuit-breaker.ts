export type BreakerState = 'closed' | 'open' | 'half-open';

// Circuit breaker léger par pays (ADR-0007) : après `threshold` échecs consécutifs,
// court-circuite les appels pendant `cooldownMs`, puis laisse passer une sonde
// (half-open). Un succès referme, un échec rouvre avec un cooldown frais.
// `now` est injectable pour les tests (sinon Date.now).
export class CircuitBreaker {
  private failures = 0;
  private openedAt = 0;

  constructor(
    private readonly threshold: number,
    private readonly cooldownMs: number,
    private readonly now: () => number = () => Date.now(),
  ) {}

  state(): BreakerState {
    if (this.failures < this.threshold) {
      return 'closed';
    }
    return this.now() - this.openedAt >= this.cooldownMs ? 'half-open' : 'open';
  }

  canRequest(): boolean {
    return this.state() !== 'open';
  }

  recordSuccess(): void {
    this.failures = 0;
    this.openedAt = 0;
  }

  recordFailure(): void {
    this.failures += 1;
    if (this.failures >= this.threshold) {
      this.openedAt = this.now();
    }
  }
}
