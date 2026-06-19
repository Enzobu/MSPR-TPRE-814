import { act, renderHook } from '@testing-library/react';
import { type ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { useDashboardCountry } from '@/features/dashboard/hooks/useDashboardCountry';

function makeWrapper(initialEntries: string[]) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    );
  };
}

describe('useDashboardCountry', () => {
  it('should return undefined when no country is in the query string', () => {
    // Arrange / Act
    const { result } = renderHook(() => useDashboardCountry(), {
      wrapper: makeWrapper(['/']),
    });

    // Assert
    expect(result.current.country).toBeUndefined();
  });

  it('should parse the country from the query string', () => {
    // Arrange / Act
    const { result } = renderHook(() => useDashboardCountry(), {
      wrapper: makeWrapper(['/?country=BR']),
    });

    // Assert
    expect(result.current.country).toBe('BR');
  });

  it('should ignore an unknown country value', () => {
    // Arrange / Act
    const { result } = renderHook(() => useDashboardCountry(), {
      wrapper: makeWrapper(['/?country=ZZ']),
    });

    // Assert
    expect(result.current.country).toBeUndefined();
  });

  it('should set the country in the URL', () => {
    // Arrange
    const { result } = renderHook(() => useDashboardCountry(), {
      wrapper: makeWrapper(['/']),
    });

    // Act
    act(() => result.current.setCountry('EC'));

    // Assert
    expect(result.current.country).toBe('EC');
  });

  it('should clear the country when called without an argument', () => {
    // Arrange
    const { result } = renderHook(() => useDashboardCountry(), {
      wrapper: makeWrapper(['/?country=CO']),
    });

    // Act
    act(() => result.current.setCountry(undefined));

    // Assert
    expect(result.current.country).toBeUndefined();
  });
});
