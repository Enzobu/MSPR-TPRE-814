import type { MailerService } from '@nestjs-modules/mailer';
import type { ConfigService } from '@nestjs/config';
import type { PinoLogger } from 'nestjs-pino';
import type { Env } from '../../../config/env.validation';
import type { Alert } from '../../domain/alert';
import { MailerAlertNotifier } from './mailer-alert.notifier';

const silentLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
} as unknown as PinoLogger;

const alert: Alert = {
  id: 'a1',
  country: 'BR',
  type: 'TEMPERATURE_OUT_OF_RANGE',
  message: 'Température 40°C hors plage [26;32]',
  warehouse: 'W1',
  triggeredAt: new Date('2026-06-19T08:30:00.000Z'),
  acknowledged: false,
};

const buildConfig = (
  values: Partial<Record<keyof Env, string>>,
): ConfigService<Env, true> =>
  ({
    get: (key: keyof Env) => values[key],
  }) as unknown as ConfigService<Env, true>;

describe('MailerAlertNotifier', () => {
  let sendMail: jest.Mock<Promise<unknown>, [Record<string, string>]>;
  let mailer: MailerService;

  beforeEach(() => {
    sendMail = jest
      .fn<Promise<unknown>, [Record<string, string>]>()
      .mockResolvedValue({});
    mailer = { sendMail } as unknown as MailerService;
  });

  it('should send a mail with correct headers when recipient and from are configured', async () => {
    // Arrange
    const config = buildConfig({
      ALERT_RECIPIENT: 'resp@futurekawa.example',
      SMTP_FROM: 'alerts@futurekawa.example',
      CENTRAL_UI_URL: 'https://siege.example',
    });
    const notifier = new MailerAlertNotifier(mailer, config, silentLogger);

    // Act
    await notifier.notify(alert);

    // Assert
    expect(sendMail).toHaveBeenCalledTimes(1);
    const sent = sendMail.mock.calls[0][0];
    expect(sent).toMatchObject({
      to: 'resp@futurekawa.example',
      from: 'alerts@futurekawa.example',
      subject: '[FutureKawa] Température hors plage — Brésil / W1',
    });
    expect(sent.html).toContain('https://siege.example');
    expect(sent.text).toBeDefined();
  });

  it('should skip sending when ALERT_RECIPIENT is missing', async () => {
    // Arrange
    const config = buildConfig({ SMTP_FROM: 'alerts@futurekawa.example' });
    const notifier = new MailerAlertNotifier(mailer, config, silentLogger);

    // Act
    await notifier.notify(alert);

    // Assert
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('should not throw when the transport fails (best-effort)', async () => {
    // Arrange
    sendMail.mockRejectedValue(new Error('SMTP down'));
    const config = buildConfig({
      ALERT_RECIPIENT: 'resp@futurekawa.example',
      SMTP_FROM: 'alerts@futurekawa.example',
      CENTRAL_UI_URL: 'https://siege.example',
    });
    const notifier = new MailerAlertNotifier(mailer, config, silentLogger);

    // Act + Assert
    await expect(notifier.notify(alert)).resolves.toBeUndefined();
  });
});
