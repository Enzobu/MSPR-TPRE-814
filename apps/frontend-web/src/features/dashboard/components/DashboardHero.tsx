import type { CountryCode } from '@futurekawa/contracts';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { COUNTRY_LABELS } from '@/features/dashboard/lib/country';

type DashboardHeroProps = Readonly<{
  country?: CountryCode;
}>;

// Affiche le prénom dérivé de l'email (partie locale avant @), à défaut l'email.
function greetingName(email: string | undefined): string {
  if (!email) {
    return 'à vous';
  }
  const localPart = email.split('@')[0] ?? email;
  const firstSegment = localPart.split(/[._-]/)[0] ?? localPart;
  return firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1);
}

function scopeSentence(country?: CountryCode): string {
  if (!country) {
    return 'Vue consolidée — tous les pays surveillés.';
  }
  return `Périmètre : ${COUNTRY_LABELS[country]}.`;
}

// En-tête du dashboard (design L561-565) : salutation personnalisée (useAuth) +
// sous-titre décrivant le périmètre pays sélectionné.
export function DashboardHero({ country }: DashboardHeroProps) {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="mb-1 text-[23px] font-semibold tracking-tight">
        Bonjour {greetingName(user?.email)}
      </h1>
      <p className="text-[13.5px] text-muted-foreground">
        {scopeSentence(country)}
      </p>
    </div>
  );
}
