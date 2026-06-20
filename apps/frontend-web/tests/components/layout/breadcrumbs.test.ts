import { describe, expect, it } from 'vitest';
import { deriveCrumbs } from '@/components/layout/breadcrumbs';

describe('deriveCrumbs', () => {
  it('should return a single "Dashboard" crumb for the root path', () => {
    // Arrange / Act
    const crumbs = deriveCrumbs('/');

    // Assert
    expect(crumbs).toEqual([{ label: 'Dashboard', href: '/', current: true }]);
  });

  it('should map the /lots path to a "Lots" leaf crumb', () => {
    // Arrange / Act
    const crumbs = deriveCrumbs('/lots');

    // Assert
    expect(crumbs).toEqual([{ label: 'Lots', href: '/lots', current: true }]);
  });

  it('should build a trail with a clickable parent crumb to its route', () => {
    // Arrange / Act
    const crumbs = deriveCrumbs('/lots/LOT-BR-001');

    // Assert
    expect(crumbs).toEqual([
      { label: 'Lots', href: '/lots', current: false },
      { label: 'LOT-BR-001', href: '/lots/LOT-BR-001', current: true },
    ]);
  });

  it('should map the /alerts path to an "Alertes" leaf crumb', () => {
    // Arrange / Act
    const crumbs = deriveCrumbs('/alerts');

    // Assert
    expect(crumbs).toEqual([
      { label: 'Alertes', href: '/alerts', current: true },
    ]);
  });
});
