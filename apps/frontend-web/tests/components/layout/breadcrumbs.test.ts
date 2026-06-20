import { describe, expect, it } from 'vitest';
import { deriveCrumbs } from '@/components/layout/breadcrumbs';

describe('deriveCrumbs', () => {
  it('should return a single "Dashboard" crumb for the root path', () => {
    // Arrange / Act
    const crumbs = deriveCrumbs('/');

    // Assert
    expect(crumbs).toEqual([{ label: 'Dashboard', current: true }]);
  });

  it('should map the /lots path to a "Lots" leaf crumb', () => {
    // Arrange / Act
    const crumbs = deriveCrumbs('/lots');

    // Assert
    expect(crumbs).toEqual([{ label: 'Lots', current: true }]);
  });

  it('should build a trail keeping the dynamic id as the current leaf', () => {
    // Arrange / Act
    const crumbs = deriveCrumbs('/lots/LOT-BR-001');

    // Assert
    expect(crumbs).toEqual([
      { label: 'Lots', current: false },
      { label: 'LOT-BR-001', current: true },
    ]);
  });

  it('should map the /alerts path to an "Alertes" leaf crumb', () => {
    // Arrange / Act
    const crumbs = deriveCrumbs('/alerts');

    // Assert
    expect(crumbs).toEqual([{ label: 'Alertes', current: true }]);
  });
});
