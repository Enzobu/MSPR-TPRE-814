import type { Alert } from './alert';

// Port (ADR-0001 dependency rule / ADR-0004) : l'application notifie le
// responsable d'exploitation à travers cette interface ; l'infrastructure
// (mailer SMTP) l'implémente. L'envoi est **best-effort** — l'implémentation ne
// doit jamais throw : un échec d'email ne bloque ni l'alerte ni l'ingestion.
export const ALERT_NOTIFIER = Symbol('ALERT_NOTIFIER');

export interface AlertNotifier {
  notify(alert: Alert): Promise<void>;
}
