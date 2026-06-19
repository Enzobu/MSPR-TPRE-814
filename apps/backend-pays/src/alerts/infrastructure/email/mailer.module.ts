import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../../config/env.validation';

// Configure le transport SMTP (nodemailer) depuis l'env validé. Les variables
// SMTP sont optionnelles : sans host, le transport est créé mais l'envoi
// échouera — c'est le notifier qui garde le caractère best-effort (ADR-0004).
// La résolution du destinataire/expéditeur réel reste dans le notifier.
@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        transport: {
          host: config.get('SMTP_HOST') ?? 'localhost',
          port: config.get('SMTP_PORT') ?? 1025,
          secure: config.get('SMTP_SECURE') === 'true',
          auth: config.get('SMTP_USER')
            ? {
                user: config.get('SMTP_USER'),
                pass: config.get('SMTP_PASSWORD'),
              }
            : undefined,
        },
        defaults: {
          from: config.get('SMTP_FROM') ?? 'alerts@futurekawa.example',
        },
      }),
    }),
  ],
  exports: [MailerModule],
})
export class AppMailerModule {}
