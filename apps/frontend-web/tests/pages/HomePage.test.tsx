import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import HomePage from '@/pages/HomePage';

vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));

describe('HomePage', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

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

  it('should fire a success toast when the demo button is clicked', async () => {
    // Arrange
    render(<HomePage />);

    // Act
    await userEvent.click(
      screen.getByRole('button', { name: /afficher un toast/i }),
    );

    // Assert
    expect(toast.success).toHaveBeenCalledWith(
      'Backbone opérationnel',
      expect.objectContaining({ description: expect.any(String) }),
    );
  });
});
