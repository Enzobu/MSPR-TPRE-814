import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DashboardUnavailableBanner } from '@/features/dashboard/components/DashboardUnavailableBanner';

describe('DashboardUnavailableBanner', () => {
  it('should render nothing when no country is unavailable', () => {
    // Arrange / Act
    const { container } = render(
      <DashboardUnavailableBanner unavailable={[]} />,
    );

    // Assert
    expect(container).toBeEmptyDOMElement();
  });

  it('should render an alert with the FR label for a single unavailable country', () => {
    // Arrange / Act
    render(<DashboardUnavailableBanner unavailable={['BR']} />);

    // Assert
    const banner = screen.getByRole('alert');
    expect(banner).toHaveTextContent('Brésil');
    expect(banner).toHaveTextContent('est injoignable');
    expect(banner).toHaveTextContent('chiffres affichés peuvent être incomplets');
  });

  it('should render the plural wording for several unavailable countries', () => {
    // Arrange / Act
    render(<DashboardUnavailableBanner unavailable={['BR', 'EC']} />);

    // Assert
    const banner = screen.getByRole('alert');
    expect(banner).toHaveTextContent('Brésil, Équateur');
    expect(banner).toHaveTextContent('sont injoignables');
  });
});
