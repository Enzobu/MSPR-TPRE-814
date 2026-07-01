import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CountryFilter } from '@/features/alerts/components/CountryFilter';

describe('CountryFilter', () => {
  it('should render one chip per country plus the "all" option', () => {
    // Arrange / Act
    render(<CountryFilter onChange={vi.fn()} />);

    // Assert
    expect(screen.getByRole('button', { name: 'Toutes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Brésil' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Équateur' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Colombie' })).toBeInTheDocument();
  });

  it('should emit the country code when a region is selected', async () => {
    // Arrange
    const onChange = vi.fn();
    render(<CountryFilter onChange={onChange} />);

    // Act
    await userEvent.click(screen.getByRole('button', { name: 'Brésil' }));

    // Assert
    expect(onChange).toHaveBeenCalledWith('BR');
  });

  it('should emit undefined when returning to "all"', async () => {
    // Arrange
    const onChange = vi.fn();
    render(<CountryFilter value="BR" onChange={onChange} />);

    // Act
    await userEvent.click(screen.getByRole('button', { name: 'Toutes' }));

    // Assert
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it('should mark the active region as pressed', () => {
    // Arrange / Act
    render(<CountryFilter value="EC" onChange={vi.fn()} />);

    // Assert
    expect(screen.getByRole('button', { name: 'Équateur' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
