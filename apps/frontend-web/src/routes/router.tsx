import { createBrowserRouter } from 'react-router';
import { RootLayout } from '@/components/layout/RootLayout';
import { RouteError } from '@/components/route-error';
import HomePage from '@/pages/HomePage';
import NotFoundPage from '@/pages/NotFoundPage';

// Data router (ADR-0005) : loaders + URL state à venir avec les features.
export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <HomePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
