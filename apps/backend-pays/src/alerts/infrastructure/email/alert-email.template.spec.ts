import type { Alert } from '../../domain/alert';
import { renderAlertEmail } from './alert-email.template';

const UI_URL = 'https://siege.futurekawa.example';

const baseAlert: Alert = {
  id: 'a1',
  country: 'BR',
  type: 'TEMPERATURE_OUT_OF_RANGE',
  message: 'Température 40°C hors plage [26;32]',
  warehouse: 'W1',
  triggeredAt: new Date('2026-06-19T08:30:00.000Z'),
  acknowledged: false,
};

describe('renderAlertEmail', () => {
  it('should build a French subject with country and warehouse for a measurement alert', () => {
    // Act
    const email = renderAlertEmail(baseAlert, UI_URL);

    // Assert
    expect(email.subject).toBe(
      '[FutureKawa] Température hors plage — Brésil / W1',
    );
  });

  it('should reference the lot in the subject for an expired-lot alert', () => {
    // Arrange
    const alert: Alert = {
      ...baseAlert,
      type: 'LOT_EXPIRED',
      lotId: 'L-400',
      message: 'Lot L-400 périmé : stocké depuis plus de 365 jours',
    };

    // Act
    const email = renderAlertEmail(alert, UI_URL);

    // Assert
    expect(email.subject).toBe('[FutureKawa] Lot périmé — Brésil / lot L-400');
  });

  it('should substitute all variables in the HTML body', () => {
    // Act
    const { html } = renderAlertEmail(baseAlert, UI_URL);

    // Assert
    expect(html).toContain('Température hors plage');
    expect(html).toContain('Brésil');
    expect(html).toContain('W1');
    expect(html).toContain('Température 40°C hors plage [26;32]');
    expect(html).toContain(UI_URL);
    expect(html).toMatch(/19 juin 2026/);
  });

  it('should mirror the content in the plain-text fallback', () => {
    // Act
    const { text } = renderAlertEmail(baseAlert, UI_URL);

    // Assert
    expect(text).toContain('FutureKawa — Alerte Température hors plage');
    expect(text).toContain('Pays : Brésil');
    expect(text).toContain('Entrepôt : W1');
    expect(text).toContain(`Consulter : ${UI_URL}`);
  });

  it('should not leak HTML when the message contains markup (escaping)', () => {
    // Arrange
    const alert: Alert = { ...baseAlert, message: '<script>x</script>' };

    // Act
    const { html } = renderAlertEmail(alert, UI_URL);

    // Assert
    expect(html).not.toContain('<script>x</script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
