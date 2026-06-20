import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import { SidebarCountryNav } from '@/components/layout/SidebarCountryNav';

// Sonde : expose pathname + search courants pour asserter l'URL résultante.
function LocationProbe() {
  const location = useLocation();
  return (
    <span data-testid="location">{location.pathname + location.search}</span>
  );
}

function renderNav(initialPath: string) {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <SidebarCountryNav />
      <LocationProbe />
    </MemoryRouter>,
  );
}

describe('SidebarCountryNav', () => {
  it('should set the country query param in place on a list route', async () => {
    // Arrange
    const user = userEvent.setup();
    renderNav('/lots');

    // Act
    await user.click(screen.getByRole('button', { name: /Équateur/ }));

    // Assert — reste sur /lots, ajoute le scope
    expect(screen.getByTestId('location')).toHaveTextContent('/lots?country=EC');
  });

  it('should navigate from a lot detail to the scoped lots list', async () => {
    // Arrange
    const user = userEvent.setup();
    renderNav('/lots/BR-2025-001');

    // Act
    await user.click(screen.getByRole('button', { name: /Équateur/ }));

    // Assert — quitte le détail pour la liste scopée
    expect(screen.getByTestId('location')).toHaveTextContent('/lots?country=EC');
  });

  it('should navigate from an alert detail to the scoped alerts list', async () => {
    // Arrange
    const user = userEvent.setup();
    renderNav('/alerts/A-42');

    // Act
    await user.click(screen.getByRole('button', { name: /Colombie/ }));

    // Assert
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/alerts?country=CO',
    );
  });

  it('should clear the scope when selecting "Tous les pays" from a detail', async () => {
    // Arrange
    const user = userEvent.setup();
    renderNav('/lots/BR-2025-001');

    // Act
    await user.click(screen.getByRole('button', { name: /Tous les pays/ }));

    // Assert — navigue vers la liste sans param country
    expect(screen.getByTestId('location')).toHaveTextContent('/lots');
    expect(screen.getByTestId('location')).not.toHaveTextContent('country=');
  });
});
