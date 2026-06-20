import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Alert } from '@futurekawa/contracts';
import { AcknowledgeButton } from '@/features/alerts/components/AcknowledgeButton';
import { acknowledgeAlert } from '@/features/alerts/api/alerts.api';

vi.mock('@/features/alerts/api/alerts.api');

const ACKED: Alert = {
  id: 'AL-BR-001',
  country: 'BR',
  type: 'TEMPERATURE_OUT_OF_RANGE',
  message: 'Température trop élevée',
  warehouse: 'Santos-A',
  triggeredAt: '2026-06-18T10:30:00.000Z',
  acknowledged: true,
};

function renderButton(acknowledged: boolean) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <AcknowledgeButton
        id="AL-BR-001"
        country="BR"
        acknowledged={acknowledged}
      />
    </QueryClientProvider>,
  );
}

describe('AcknowledgeButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call the api with the alert id and country', async () => {
    // Arrange
    vi.mocked(acknowledgeAlert).mockResolvedValue(ACKED);
    renderButton(false);

    // Act
    await userEvent.click(screen.getByRole('button', { name: 'Acquitter' }));

    // Assert
    expect(acknowledgeAlert).toHaveBeenCalledWith('AL-BR-001', 'BR');
  });

  it('should be disabled when already acknowledged', () => {
    // Arrange / Act
    renderButton(true);

    // Assert
    expect(screen.getByRole('button', { name: 'Acquittée' })).toBeDisabled();
  });
});
