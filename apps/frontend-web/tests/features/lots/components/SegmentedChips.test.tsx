import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  SegmentedChips,
  type SegmentedChipOption,
} from '@/features/lots/components/SegmentedChips';

type Value = 'ALL' | 'BR' | 'CO';

const OPTIONS: SegmentedChipOption<Value>[] = [
  { value: 'ALL', label: 'Tous' },
  { value: 'BR', label: 'BR' },
  { value: 'CO', label: 'CO' },
];

describe('SegmentedChips', () => {
  it('should mark only the active option with aria-pressed=true', () => {
    // Arrange / Act
    render(
      <SegmentedChips
        legend="Filtrer par pays"
        options={OPTIONS}
        value="BR"
        onChange={vi.fn()}
      />,
    );

    // Assert
    expect(screen.getByRole('button', { name: 'BR' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Tous' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByRole('button', { name: 'CO' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('should call onChange with the clicked option value', async () => {
    // Arrange
    const onChange = vi.fn();
    render(
      <SegmentedChips
        legend="Filtrer par pays"
        options={OPTIONS}
        value="ALL"
        onChange={onChange}
      />,
    );

    // Act
    await userEvent.click(screen.getByRole('button', { name: 'CO' }));

    // Assert
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('CO');
  });

  it('should expose the legend as the group accessible name', () => {
    // Arrange / Act
    render(
      <SegmentedChips
        legend="Filtrer par pays"
        options={OPTIONS}
        value="ALL"
        onChange={vi.fn()}
      />,
    );

    // Assert
    expect(
      screen.getByRole('group', { name: 'Filtrer par pays' }),
    ).toBeInTheDocument();
  });
});
