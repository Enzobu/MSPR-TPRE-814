import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DefaultErrorFallback,
  ErrorBoundary,
} from '@/components/error-boundary';

function Boom(): never {
  throw new Error('boom');
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render its children when no error is thrown', () => {
    // Arrange / Act
    render(
      <ErrorBoundary>
        <span>safe content</span>
      </ErrorBoundary>,
    );

    // Assert
    expect(screen.getByText('safe content')).toBeInTheDocument();
  });

  it('should render the default fallback when a child throws', () => {
    // Arrange / Act
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );

    // Assert
    expect(screen.getByRole('alert')).toHaveTextContent('Une erreur est survenue');
  });

  it('should render a custom fallback when provided', () => {
    // Arrange / Act
    render(
      <ErrorBoundary fallback={<span>custom fallback</span>}>
        <Boom />
      </ErrorBoundary>,
    );

    // Assert
    expect(screen.getByText('custom fallback')).toBeInTheDocument();
  });
});

describe('DefaultErrorFallback', () => {
  it('should render a business friendly message', () => {
    // Arrange / Act
    render(<DefaultErrorFallback />);

    // Assert
    expect(screen.getByRole('alert')).toHaveTextContent('Une erreur est survenue');
  });
});
