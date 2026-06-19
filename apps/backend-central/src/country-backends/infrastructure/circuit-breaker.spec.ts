import { CircuitBreaker } from './circuit-breaker';

describe('CircuitBreaker', () => {
  let now: number;
  const clock = (): number => now;

  beforeEach(() => {
    now = 1000;
  });

  it('should start closed and allow requests', () => {
    // Arrange
    const breaker = new CircuitBreaker(3, 30_000, clock);

    // Assert
    expect(breaker.state()).toBe('closed');
    expect(breaker.canRequest()).toBe(true);
  });

  it('should open after the failure threshold is reached', () => {
    // Arrange
    const breaker = new CircuitBreaker(3, 30_000, clock);

    // Act
    breaker.recordFailure();
    breaker.recordFailure();
    breaker.recordFailure();

    // Assert
    expect(breaker.state()).toBe('open');
    expect(breaker.canRequest()).toBe(false);
  });

  it('should move to half-open after the cooldown elapses', () => {
    // Arrange
    const breaker = new CircuitBreaker(2, 30_000, clock);
    breaker.recordFailure();
    breaker.recordFailure();

    // Act
    now += 30_000;

    // Assert
    expect(breaker.state()).toBe('half-open');
    expect(breaker.canRequest()).toBe(true);
  });

  it('should close again on a success', () => {
    // Arrange
    const breaker = new CircuitBreaker(2, 30_000, clock);
    breaker.recordFailure();
    breaker.recordFailure();
    now += 30_000;

    // Act
    breaker.recordSuccess();

    // Assert
    expect(breaker.state()).toBe('closed');
  });

  it('should re-open with a fresh cooldown when a half-open probe fails', () => {
    // Arrange
    const breaker = new CircuitBreaker(2, 30_000, clock);
    breaker.recordFailure();
    breaker.recordFailure();
    now += 30_000; // half-open

    // Act
    breaker.recordFailure(); // probe fails

    // Assert
    expect(breaker.state()).toBe('open');
  });
});
