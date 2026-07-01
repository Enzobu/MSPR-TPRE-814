import { AlertTriangle } from 'lucide-react';
import { COUNTRY_CODES } from '@futurekawa/contracts';
import { Skeleton } from '@/components/ui/skeleton';
import { COUNTRY_LABELS } from '@/features/dashboard/lib/country';
import { useDashboardCountry } from '@/features/dashboard/hooks/useDashboardCountry';
import { DayFilter } from '@/features/measurements/components/DayFilter';
import { MeasurementsPanel } from '@/features/measurements/components/MeasurementsPanel';
import { RegionReadingCard } from '@/features/measurements/components/RegionReadingCard';
import { useLatestMeasurements } from '@/features/measurements/hooks/useLatestMeasurements';
import { useMonitoringDay } from '@/features/measurements/hooks/useMonitoringDay';
import { dayBounds, todayIso } from '@/features/measurements/lib/day-range';

export default function MonitoringPage() {
  const { data, isPending, isError } = useLatestMeasurements();
  // La région sélectionnée est le pays global de l'app (sélecteur sidebar,
  // porté par l'URL) : cliquer une carte met à jour ce même état partagé.
  const { country: picked, setCountry: setPicked } = useDashboardCountry();
  const { day, setDay } = useMonitoringDay();

  if (isPending) {
    return (
      <section className="space-y-4">
        <PageHeader />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {COUNTRY_CODES.map((code) => (
            <Skeleton key={code} className="h-28 w-full" />
          ))}
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="space-y-4">
        <PageHeader />
        <p
          role="alert"
          className="rounded-xl border border-border bg-muted px-4 py-3 text-sm text-muted-foreground"
        >
          Impossible de charger les relevés pour le moment. Réessayez plus tard.
        </p>
      </section>
    );
  }

  const byCountry = new Map(data.data.map((m) => [m.country, m]));
  const unavailable = new Set(data.unavailable);
  // Par défaut, on ouvre la première région ayant un relevé.
  const firstWithReading = COUNTRY_CODES.find((code) => byCountry.has(code));
  const selected = picked ?? firstWithReading ?? null;
  const selectedMeasurement = selected ? byCountry.get(selected) : undefined;
  const range = day ? dayBounds(day) : undefined;

  // Section historique selon l'état (évite un ternaire imbriqué en JSX).
  let historySection: React.ReactNode = null;
  if (selected && selectedMeasurement) {
    historySection = (
      <div className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">
            Historique — {COUNTRY_LABELS[selected]}
          </h2>
          <DayFilter day={day} max={todayIso()} onChange={setDay} />
        </div>
        <MeasurementsPanel
          country={selected}
          warehouse={selectedMeasurement.warehouse}
          from={range?.from}
          to={range?.to}
        />
      </div>
    );
  } else if (selected) {
    historySection = (
      <p className="rounded-xl border border-border px-4 py-8 text-center text-sm text-muted-foreground">
        Aucun relevé pour {COUNTRY_LABELS[selected]} — historique indisponible.
      </p>
    );
  }

  return (
    <section className="space-y-4">
      <PageHeader />

      {data.unavailable.length > 0 ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-border bg-muted px-4 py-3 text-sm"
        >
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-status-alerte"
            aria-hidden
          />
          <p>
            Données partielles :{' '}
            {data.unavailable.map((code) => COUNTRY_LABELS[code]).join(', ')}{' '}
            {data.unavailable.length > 1 ? 'sont injoignables' : 'est injoignable'}.
          </p>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {COUNTRY_CODES.map((code) => (
          <RegionReadingCard
            key={code}
            country={code}
            measurement={byCountry.get(code) ?? null}
            unavailable={unavailable.has(code)}
            selected={selected === code}
            onSelect={setPicked}
          />
        ))}
      </div>

      {historySection}
    </section>
  );
}

function PageHeader() {
  return (
    <header className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight">
        Suivi des relevés
      </h1>
      <p className="text-sm text-muted-foreground">
        Dernier relevé T°/humidité par région. Sélectionnez une région pour son
        historique.
      </p>
    </header>
  );
}
