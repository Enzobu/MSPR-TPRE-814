import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DayFilter } from '@/features/measurements/components/DayFilter';

const MAX = '2026-07-01';

describe('DayFilter', () => {
  it('should mark "Tout" active when no day is selected', () => {
    render(<DayFilter max={MAX} onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Tout' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('should emit today when "Aujourd\'hui" is clicked', async () => {
    const onChange = vi.fn();
    render(<DayFilter max={MAX} onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: "Aujourd'hui" }));

    expect(onChange).toHaveBeenCalledWith('2026-07-01');
  });

  it('should emit the previous day when "Hier" is clicked', async () => {
    const onChange = vi.fn();
    render(<DayFilter max={MAX} onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Hier' }));

    expect(onChange).toHaveBeenCalledWith('2026-06-30');
  });

  it('should emit undefined when "Tout" is clicked', async () => {
    const onChange = vi.fn();
    render(<DayFilter day="2026-06-15" max={MAX} onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Tout' }));

    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it('should surface an arbitrary day on the calendar chip as active', () => {
    render(<DayFilter day="2026-06-15" max={MAX} onChange={vi.fn()} />);

    // 15 juin : ni aujourd'hui ni hier → la puce calendrier est active et datée.
    const custom = screen.getByRole('button', { name: /15 juin/ });
    expect(custom).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: 'Tout' }),
    ).toHaveAttribute('aria-pressed', 'false');
  });
});
