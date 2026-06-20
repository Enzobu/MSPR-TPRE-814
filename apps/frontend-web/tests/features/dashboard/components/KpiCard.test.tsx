import { render, screen } from '@testing-library/react';
import { Boxes } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { KpiCard } from '@/features/dashboard/components/KpiCard';

describe('KpiCard', () => {
  it('should render skeletons and hide the value while loading', () => {
    // Arrange / Act
    const { container } = render(
      <KpiCard label="Lots en stock" icon={Boxes} isLoading value={42} />,
    );

    // Assert
    expect(
      container.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText('Lots en stock')).not.toBeInTheDocument();
    expect(screen.queryByText('42')).not.toBeInTheDocument();
  });

  it('should render the label, value and note once loaded', () => {
    // Arrange / Act
    render(
      <KpiCard
        label="Lots en stock"
        icon={Boxes}
        isLoading={false}
        value={42}
        note="Tous pays confondus"
      />,
    );

    // Assert
    expect(screen.getByText('Lots en stock')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Tous pays confondus')).toBeInTheDocument();
  });

  it('should render an em dash and hide the note on error', () => {
    // Arrange / Act
    render(
      <KpiCard
        label="Lots en stock"
        icon={Boxes}
        isLoading={false}
        isError
        value={42}
        note="Tous pays confondus"
      />,
    );

    // Assert
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.queryByText('42')).not.toBeInTheDocument();
    expect(screen.queryByText('Tous pays confondus')).not.toBeInTheDocument();
  });
});
