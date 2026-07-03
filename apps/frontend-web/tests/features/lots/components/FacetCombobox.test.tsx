import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FacetCombobox } from '@/features/lots/components/FacetCombobox';

describe('FacetCombobox', () => {
  it('should show the label when no value is selected', () => {
    render(
      <FacetCombobox
        label="Exploitation"
        allLabel="Toutes"
        options={['Fazenda Aurora']}
        onChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('combobox', { name: 'Exploitation' }),
    ).toHaveTextContent('Exploitation');
  });

  it('should emit the selected option', async () => {
    const onChange = vi.fn();
    render(
      <FacetCombobox
        label="Exploitation"
        allLabel="Toutes"
        options={['Fazenda Aurora', 'Sitio Sol']}
        onChange={onChange}
      />,
    );

    await userEvent.click(
      screen.getByRole('combobox', { name: 'Exploitation' }),
    );
    await userEvent.click(screen.getByText('Sitio Sol'));

    expect(onChange).toHaveBeenCalledWith('Sitio Sol');
  });

  it('should emit undefined when the "all" option is chosen', async () => {
    const onChange = vi.fn();
    render(
      <FacetCombobox
        label="Entrepôt"
        allLabel="Tous les entrepôts"
        value="W1"
        options={['W1', 'W2']}
        onChange={onChange}
      />,
    );

    await userEvent.click(screen.getByRole('combobox', { name: 'Entrepôt' }));
    await userEvent.click(screen.getByText('Tous les entrepôts'));

    expect(onChange).toHaveBeenCalledWith(undefined);
  });
});
