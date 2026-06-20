import { CheckCircle2 } from 'lucide-react';
import type { Alert } from '@futurekawa/contracts';
import { AcknowledgeButton } from '@/features/alerts/components/AcknowledgeButton';

type AlertActionCardProps = Readonly<{
  alert: Alert;
}>;

export function AlertActionCard({ alert }: AlertActionCardProps) {
  return (
    <div className="rounded-xl border bg-card p-[18px]">
      <p className="mb-3.5 text-sm font-semibold">Action</p>
      {alert.acknowledged ? (
        <div className="flex items-center gap-2.5 rounded-lg border border-status-conforme/30 bg-status-conforme/10 p-[13px]">
          <CheckCircle2
            className="size-5 shrink-0 text-status-conforme"
            aria-hidden
          />
          <p className="text-sm font-semibold">Alerte acquittée</p>
        </div>
      ) : (
        <div>
          <p className="mb-3.5 text-sm leading-relaxed text-muted-foreground">
            Confirmer la prise en charge. Le lot reste surveillé ; l'historique
            conserve la trace de l'acquittement.
          </p>
          <AcknowledgeButton
            id={alert.id}
            country={alert.country}
            acknowledged={alert.acknowledged}
            variant="primary"
            fullWidth
          />
        </div>
      )}
    </div>
  );
}
