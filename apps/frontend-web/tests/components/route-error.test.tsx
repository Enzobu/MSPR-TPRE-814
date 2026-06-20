import { render, screen } from '@testing-library/react';
import {
  RouterProvider,
  createMemoryRouter,
} from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RouteError } from '@/components/route-error';

function Boom(): never {
  throw new Error('loader failure');
}

describe('RouteError', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render the fallback when a route throws', async () => {
    // Arrange
    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: <Boom />,
          errorElement: <RouteError />,
        },
      ],
      { initialEntries: ['/'] },
    );

    // Act
    render(<RouterProvider router={router} />);

    // Assert
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Une erreur est survenue',
    );
  });
});
