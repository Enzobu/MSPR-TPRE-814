import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { ThemeToggle } from '@/components/theme/theme-toggle';

afterEach(() => {
  document.documentElement.classList.remove('dark');
  localStorage.clear();
});

describe('ThemeToggle', () => {
  it('should toggle the dark class on the document root', async () => {
    // Arrange
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );
    const wasDark = document.documentElement.classList.contains('dark');

    // Act
    await userEvent.click(
      screen.getByRole('button', { name: /basculer le thème/i }),
    );

    // Assert
    expect(document.documentElement.classList.contains('dark')).toBe(!wasDark);
  });
});
