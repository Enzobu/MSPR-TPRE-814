import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { Env } from '../../../config/env.validation';
import type { Alert } from '../../domain/alert';
import type { AlertNotifier } from '../../domain/alert-notifier';
import { renderAlertEmail } from './alert-email.template';

// Implémentation SMTP du port AlertNotifier (ADR-0004). **Best-effort** : ne
// throw jamais. Un échec d'envoi est loggé en `error` mais l'alerte reste
// persistée et consultable via l'API/UI. Si la cible n'est pas configurée
// (ALERT_RECIPIENT/SMTP_FROM absents), on skip avec un `warn`.
@Injectable()
export class MailerAlertNotifier implements AlertNotifier {
  constructor(
    private readonly mailer: MailerService,
    private readonly config: ConfigService<Env, true>,
    @InjectPinoLogger(MailerAlertNotifier.name)
    private readonly logger: PinoLogger,
  ) {}

  async notify(alert: Alert): Promise<void> {
    const recipient = this.config.get('ALERT_RECIPIENT', { infer: true });
    const from = this.config.get('SMTP_FROM', { infer: true });
    if (!recipient || !from) {
      this.logger.warn(
        { type: alert.type },
        'Alerte non notifiée : ALERT_RECIPIENT/SMTP_FROM non configurés',
      );
      return;
    }

    const email = renderAlertEmail(
      alert,
      this.config.get('CENTRAL_UI_URL', { infer: true }),
    );
    try {
      await this.mailer.sendMail({
        to: recipient,
        from,
        subject: email.subject,
        html: email.html,
        text: email.text,
      });
      this.logger.info(
        { type: alert.type, to: recipient },
        "Email d'alerte envoyé",
      );
    } catch (error: unknown) {
      // Best-effort (ADR-0004) : un échec SMTP ne doit pas remonter à
      // l'ingestion ni à la persistance de l'alerte.
      this.logger.error(
        { err: error, type: alert.type },
        "Échec d'envoi de l'email d'alerte",
      );
    }
  }
}
