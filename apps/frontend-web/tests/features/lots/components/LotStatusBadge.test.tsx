import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LotStatusBadge } from '@/features/lots/components/LotStatusBadge';

describe('LotStatusBadge', () => {
  it('should render the "Conforme" label for a conforme lot', () => {
    // Arrange / Act
    render(<LotStatusBadge status="CONFORME" />);

    // Assert
    expect(screen.getByText('Conforme')).toBeInTheDocument();
  });

  it('should render the "En alerte" label for an alerting lot', () => {
    // Arrange / Act
    render(<LotStatusBadge status="EN_ALERTE" />);

    // Assert
    expect(screen.getByText('En alerte')).toBeInTheDocument();
  });

  it('should render the "Périmé" label for an expired lot', () => {
    // Arrange / Act
    render(<LotStatusBadge status="PERIME" />);

    // Assert
    expect(screen.getByText('Périmé')).toBeInTheDocument();
  });

  it('should apply the conforme status pill class', () => {
    // Arrange / Act
    render(<LotStatusBadge status="CONFORME" />);

    // Assert : pill teintée par le token de statut (cf. LOT_STATUS_CONFIG).
    const pill = screen.getByText('Conforme').closest('span');
    expect(pill?.className).toContain('bg-status-conforme/15');
    expect(pill?.className).toContain('text-status-conforme-foreground');
  });

  it('should apply the alerte status pill class', () => {
    // Arrange / Act
    render(<LotStatusBadge status="EN_ALERTE" />);

    // Assert
    const pill = screen.getByText('En alerte').closest('span');
    expect(pill?.className).toContain('bg-status-alerte/15');
    expect(pill?.className).toContain('text-status-alerte-foreground');
  });

  it('should apply the perime status pill class', () => {
    // Arrange / Act
    render(<LotStatusBadge status="PERIME" />);

    // Assert
    const pill = screen.getByText('Périmé').closest('span');
    expect(pill?.className).toContain('bg-status-perime/15');
    expect(pill?.className).toContain('text-status-perime-foreground');
  });

  it('should merge an extra className passed by the caller', () => {
    // Arrange / Act
    render(<LotStatusBadge status="CONFORME" className="extra-class" />);

    // Assert
    expect(screen.getByText('Conforme').closest('span')?.className).toContain(
      'extra-class',
    );
  });
});
