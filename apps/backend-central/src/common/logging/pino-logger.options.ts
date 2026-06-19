import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Params } from 'nestjs-pino';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

// Logs JSON structurés + correlation_id sur chaque ligne (rules/08-observability.md).
// Le correlation-id est lu depuis l'en-tête entrant (frontend) ou généré ici, puis
// renvoyé dans la réponse ET propagé aux appels pays (ADR-0007) pour un traçage bout-en-bout.
export function buildPinoOptions(level: string): Params {
  return {
    pinoHttp: {
      level,
      genReqId: (req: IncomingMessage, res: ServerResponse): string => {
        const incoming = req.headers[CORRELATION_ID_HEADER];
        const correlationId = Array.isArray(incoming)
          ? incoming[0]
          : (incoming ?? randomUUID());
        res.setHeader(CORRELATION_ID_HEADER, correlationId);
        return correlationId;
      },
      customProps: (req: IncomingMessage) => ({ correlation_id: req.id }),
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.body.password',
        ],
        remove: true,
      },
    },
  };
}
