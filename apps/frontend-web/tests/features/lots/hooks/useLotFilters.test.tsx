import { act, renderHook } from '@testing-library/react';
import { type ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PAGE,
  DEFAULT_SORT,
  useLotFilters,
} from '@/features/lots/hooks/useLotFilters';

function makeWrapper(initialEntries: string[]) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>;
  };
}

describe('useLotFilters', () => {
  it('should fall back to defaults when the query string is empty', () => {
    // Arrange / Act
    const { result } = renderHook(() => useLotFilters(), {
      wrapper: makeWrapper(['/lots']),
    });

    // Assert
    expect(result.current.filters).toEqual({
      country: undefined,
      page: DEFAULT_PAGE,
      sort: DEFAULT_SORT,
    });
  });

  it('should parse country, page and sort from the query string', () => {
    // Arrange / Act
    const { result } = renderHook(() => useLotFilters(), {
      wrapper: makeWrapper(['/lots?country=BR&page=3&sort=storedAt:desc']),
    });

    // Assert
    expect(result.current.filters).toEqual({
      country: 'BR',
      page: 3,
      sort: 'storedAt:desc',
    });
  });

  it('should set the country and reset the page to the first one', () => {
    // Arrange
    const { result } = renderHook(() => useLotFilters(), {
      wrapper: makeWrapper(['/lots?page=5']),
    });

    // Act
    act(() => result.current.setCountry('EC'));

    // Assert
    expect(result.current.filters.country).toBe('EC');
    expect(result.current.filters.page).toBe(DEFAULT_PAGE);
  });

  it('should clear the country when called without an argument', () => {
    // Arrange
    const { result } = renderHook(() => useLotFilters(), {
      wrapper: makeWrapper(['/lots?country=CO']),
    });

    // Act
    act(() => result.current.setCountry(undefined));

    // Assert
    expect(result.current.filters.country).toBeUndefined();
  });

  it('should parse farm and warehouse from the query string', () => {
    const { result } = renderHook(() => useLotFilters(), {
      wrapper: makeWrapper([
        '/lots?farm=Fazenda%20Aurora&warehouse=Entrep%C3%B4t%20Sul-1',
      ]),
    });

    expect(result.current.filters.farm).toBe('Fazenda Aurora');
    expect(result.current.filters.warehouse).toBe('Entrepôt Sul-1');
  });

  it('should set the farm and reset the page', () => {
    const { result } = renderHook(() => useLotFilters(), {
      wrapper: makeWrapper(['/lots?page=5']),
    });

    act(() => result.current.setFarm('Fazenda Aurora'));

    expect(result.current.filters.farm).toBe('Fazenda Aurora');
    expect(result.current.filters.page).toBe(DEFAULT_PAGE);
  });

  it('should clear the warehouse when called without an argument', () => {
    const { result } = renderHook(() => useLotFilters(), {
      wrapper: makeWrapper(['/lots?warehouse=Entrep%C3%B4t%20Sul-1']),
    });

    act(() => result.current.setWarehouse(undefined));

    expect(result.current.filters.warehouse).toBeUndefined();
  });

  it('should set the sort and reset the page', () => {
    // Arrange
    const { result } = renderHook(() => useLotFilters(), {
      wrapper: makeWrapper(['/lots?page=4']),
    });

    // Act
    act(() => result.current.setSort('storedAt:desc'));

    // Assert
    expect(result.current.filters.sort).toBe('storedAt:desc');
    expect(result.current.filters.page).toBe(DEFAULT_PAGE);
  });

  it('should set the page while clamping below the first page', () => {
    // Arrange
    const { result } = renderHook(() => useLotFilters(), {
      wrapper: makeWrapper(['/lots']),
    });

    // Act
    act(() => result.current.setPage(7));

    // Assert
    expect(result.current.filters.page).toBe(7);

    // Act
    act(() => result.current.setPage(-2));

    // Assert
    expect(result.current.filters.page).toBe(DEFAULT_PAGE);
  });
});
