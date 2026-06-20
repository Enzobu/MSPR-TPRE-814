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
});
