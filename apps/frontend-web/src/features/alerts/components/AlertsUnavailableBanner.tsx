import { TriangleAlert } from 'lucide-react';
import type { CountryCode } from '@futurekawa/contracts';

type AlertsUnavailableBannerProps = Readonly<{
  unavailable: CountryCode[];
}>;

export function AlertsUnavailableBanner({
  unavailable,
}: AlertsUnavailableBannerProps) {
  if (unavailable.length === 0) {
    return null;
  }

  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-xl border border-status-alerte/30 bg-status-alerte/10 px-4 py-3 text-sm"
    >
      <TriangleAlert
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
