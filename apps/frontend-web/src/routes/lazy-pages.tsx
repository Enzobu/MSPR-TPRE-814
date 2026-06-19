import { lazy } from 'react';

// Pages lazy-loadées (> 3 routes — rules front perf). Isolées du module router
// pour ne pas mélanger exports de composants et déclaration de routes
// (react-refresh/only-export-components).
export const HomePage = lazy(() => import('@/pages/HomePage'));
export const LotsPage = lazy(() => import('@/pages/LotsPage'));
export const LotDetailPage = lazy(() => import('@/pages/LotDetailPage'));
export const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
