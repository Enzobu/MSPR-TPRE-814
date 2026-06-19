import { AlertTriangle } from 'lucide-react';
import type { CountryCode } from '@futurekawa/contracts';

interface AlertsUnavailableBannerProps {
  unavailable: CountryCode[];
}

export function AlertsUnavailableBanner({
  unavailable,
}: AlertsUnavailableBannerProps) {
  if (unavailable.length === 0) {
    return null;
  }

  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-border bg-muted px-4 py-3 text-sm"
    >
      <AlertTriangle
        className="mt-0.5 size-4 shrink-0 text-status-alerte"
        aria-hidden
      />
      <p>
        Données partielles : {unavailable.join(', ')}{' '}
        {unavailable.length > 1 ? 'sont injoignables' : 'est injoignable'}. Les
        alertes de ces pays peuvent manquer.
      </p>
    </div>
  );
}
