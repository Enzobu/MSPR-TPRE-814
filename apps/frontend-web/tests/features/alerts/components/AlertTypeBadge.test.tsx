import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AlertTypeBadge } from '@/features/alerts/components/AlertTypeBadge';

describe('AlertTypeBadge', () => {
  it('should render the temperature label', () => {
    // Arrange / Act
    render(<AlertTypeBadge type="TEMPERATURE_OUT_OF_RANGE" />);

    // Assert
    expect(screen.getByText('Température hors plage')).toBeInTheDocument();
  });

  it('should render the humidity label', () => {
    // Arrange / Act
    render(<AlertTypeBadge type="HUMIDITY_OUT_OF_RANGE" />);

    // Assert
    expect(screen.getByText('Humidité hors plage')).toBeInTheDocument();
  });

  it('should render the expired lot label', () => {
    // Arrange / Act
    render(<AlertTypeBadge type="LOT_EXPIRED" />);

    // Assert
    expect(screen.getByText('Lot périmé')).toBeInTheDocument();
  });
});
