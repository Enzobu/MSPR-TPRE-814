import Handlebars from 'handlebars';
import type { AlertType, CountryCode } from '@futurekawa/contracts';
import type { Alert } from '../../domain/alert';

// Rendu PUR d'un email d'alerte (ADR-0004 : contenu FR, HTML + fallback texte).
// Aucune dépendance Nest/SMTP ici — testable en isolation. L'infrastructure
// (MailerAlertNotifier) se contente de transporter le résultat.

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

const COUNTRY_LABELS: Record<CountryCode, string> = {
  BR: 'Brésil',
  EC: 'Équateur',
  CO: 'Colombie',
};

const TYPE_LABELS: Record<AlertType, string> = {
  TEMPERATURE_OUT_OF_RANGE: 'Température hors plage',
  HUMIDITY_OUT_OF_RANGE: 'Humidité hors plage',
  LOT_EXPIRED: 'Lot périmé',
};

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'UTC',
});

// Handlebars échappe {{var}} par défaut → pas d'injection HTML dans l'email.
const HTML_TEMPLATE = Handlebars.compile(
  `<div style="font-family:Arial,sans-serif;color:#1a1a1a;max-width:560px">
  <h2 style="margin:0 0 4px">FutureKawa — Alerte {{typeLabel}}</h2>
  <p style="color:#555;margin:0 0 16px">{{countryLabel}}</p>
  <table style="border-collapse:collapse;width:100%">
    <tr><td style="padding:6px 0;color:#555">Type</td><td style="padding:6px 0"><strong>{{typeLabel}}</strong></td></tr>
    <tr><td style="padding:6px 0;color:#555">Pays</td><td style="padding:6px 0">{{countryLabel}}</td></tr>
    {{#if warehouse}}<tr><td style="padding:6px 0;color:#555">Entrepôt</td><td style="padding:6px 0">{{warehouse}}</td></tr>{{/if}}
    {{#if lotId}}<tr><td style="padding:6px 0;color:#555">Lot</td><td style="padding:6px 0">{{lotId}}</td></tr>{{/if}}
    <tr><td style="padding:6px 0;color:#555">Détail</td><td style="padding:6px 0">{{detail}}</td></tr>
    <tr><td style="padding:6px 0;color:#555">Déclenchée le</td><td style="padding:6px 0">{{triggeredAt}} (UTC)</td></tr>
  </table>
  <p style="margin:20px 0 0">
    <a href="{{uiUrl}}" style="background:#2f6f4f;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Consulter dans l'interface siège</a>
  </p>
</div>`,
);

const buildText = (rows: AlertEmailModel): string =>
  [
    `FutureKawa — Alerte ${rows.typeLabel}`,
    `Pays : ${rows.countryLabel}`,
    rows.warehouse ? `Entrepôt : ${rows.warehouse}` : null,
    rows.lotId ? `Lot : ${rows.lotId}` : null,
    `Détail : ${rows.detail}`,
    `Déclenchée le : ${rows.triggeredAt} (UTC)`,
    `Consulter : ${rows.uiUrl}`,
  ]
    .filter(Boolean)
    .join('\n');

interface AlertEmailModel {
  typeLabel: string;
  countryLabel: string;
  warehouse?: string;
  lotId?: string;
  detail: string;
  triggeredAt: string;
  uiUrl: string;
}

const buildSubject = (alert: Alert): string => {
  const typeLabel = TYPE_LABELS[alert.type];
  const entity =
    alert.type === 'LOT_EXPIRED' && alert.lotId
      ? `lot ${alert.lotId}`
      : (alert.warehouse ?? '');
  const suffix = entity ? ` / ${entity}` : '';
  return `[FutureKawa] ${typeLabel} — ${COUNTRY_LABELS[alert.country]}${suffix}`;
};

export function renderAlertEmail(alert: Alert, uiUrl: string): RenderedEmail {
  const model: AlertEmailModel = {
    typeLabel: TYPE_LABELS[alert.type],
    countryLabel: COUNTRY_LABELS[alert.country],
    warehouse: alert.warehouse,
    lotId: alert.lotId,
    detail: alert.message,
    triggeredAt: dateFormatter.format(alert.triggeredAt),
    uiUrl,
  };

  return {
    subject: buildSubject(alert),
    html: HTML_TEMPLATE(model),
    text: buildText(model),
  };
}
