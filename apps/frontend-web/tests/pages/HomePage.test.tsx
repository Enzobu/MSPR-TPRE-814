import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import HomePage from '@/pages/HomePage';

describe('HomePage', () => {
  it('should render the app heading and the demo toast button', () => {
    // Arrange / Act
    render(<HomePage />);

    // Assert
    expect(
      screen.getByRole('heading', { name: /café vert/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /afficher un toast/i }),
    ).toBeInTheDocument();
  });
});
