import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import NotFoundPage from '@/pages/NotFoundPage';

describe('NotFoundPage', () => {
  it('should render a 404 message and a link back home', () => {
    // Arrange / Act
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );

    // Assert
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /retour à l'accueil/i }),
    ).toHaveAttribute('href', '/');
  });
});
