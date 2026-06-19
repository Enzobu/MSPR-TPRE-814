import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CountrySelector } from '@/features/dashboard/components/CountrySelector';

describe('CountrySelector', () => {
  it('should render the "Tous" option and one button per country with FR labels', () => {
    // Arrange / Act
    render(<CountrySelector onChange={vi.fn()} />);

    // Assert
    expect(screen.getByRole('button', { name: 'Tous' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Brésil' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Équateur' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Colombie' })).toBeInTheDocument();
  });

  it('should mark "Tous" as pressed when no country is selected', () => {
    // Arrange / Act
    render(<CountrySelector onChange={vi.fn()} />);

    // Assert
    expect(screen.getByRole('button', { name: 'Tous' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Brésil' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('should mark the selected country as pressed', () => {
    // Arrange / Act
    render(<CountrySelector value="EC" onChange={vi.fn()} />);

    // Assert
    expect(screen.getByRole('button', { name: 'Équateur' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Tous' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('should call onChange with the country code when a country is clicked', async () => {
    // Arrange
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<CountrySelector value="BR" onChange={onChange} />);

    // Act
    await user.click(screen.getByRole('button', { name: 'Colombie' }));

    // Assert
    expect(onChange).toHaveBeenCalledWith('CO');
  });

  it('should call onChange with undefined when "Tous" is clicked', async () => {
    // Arrange
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<CountrySelector value="BR" onChange={onChange} />);

    // Act
    await user.click(screen.getByRole('button', { name: 'Tous' }));

    // Assert
    expect(onChange).toHaveBeenCalledWith(undefined);
  });
});
