import type { IncomingMessage, ServerResponse } from 'node:http';
import { CORRELATION_ID_HEADER, buildPinoOptions } from './pino-logger.options';

type GenReqId = (req: IncomingMessage, res: ServerResponse) => string;

interface PinoHttpShape {
  level: string;
  genReqId: GenReqId;
  customProps: (req: IncomingMessage) => Record<string, unknown>;
  redact: { paths: string[]; remove: boolean };
}

function getPinoHttp(level: string): PinoHttpShape {
  const options = buildPinoOptions(level) as { pinoHttp: PinoHttpShape };
  return options.pinoHttp;
}

function mockReqRes(headerValue?: string | string[]): {
  req: IncomingMessage;
  res: ServerResponse;
  setHeader: jest.Mock;
} {
  const setHeader = jest.fn();
  const req = {
    headers: { [CORRELATION_ID_HEADER]: headerValue },
  } as unknown as IncomingMessage;
  const res = { setHeader } as unknown as ServerResponse;
  return { req, res, setHeader };
}

describe('buildPinoOptions', () => {
  it('should expose the requested level and redact sensitive paths', () => {
    // Arrange / Act
    const pinoHttp = getPinoHttp('debug');

    // Assert
    expect(pinoHttp.level).toBe('debug');
    expect(pinoHttp.redact).toEqual({
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.body.password',
      ],
      remove: true,
    });
  });

  it('should reuse the incoming correlation id and echo it on the response', () => {
    // Arrange
    const { req, res, setHeader } = mockReqRes('corr-123');

    // Act
    const id = getPinoHttp('info').genReqId(req, res);

    // Assert
    expect(id).toBe('corr-123');
    expect(setHeader).toHaveBeenCalledWith(CORRELATION_ID_HEADER, 'corr-123');
  });

  it('should take the first value when the correlation header is an array', () => {
    // Arrange
    const { req, res } = mockReqRes(['first', 'second']);

    // Act
    const id = getPinoHttp('info').genReqId(req, res);

    // Assert
    expect(id).toBe('first');
  });

  it('should generate a correlation id when none is provided', () => {
    // Arrange
    const { req, res, setHeader } = mockReqRes(undefined);

    // Act
    const id = getPinoHttp('info').genReqId(req, res);

    // Assert
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(setHeader).toHaveBeenCalledWith(CORRELATION_ID_HEADER, id);
  });

  it('should expose the request id as a structured prop', () => {
    // Arrange
    const req = { id: 'corr-xyz' } as unknown as IncomingMessage;

    // Act
    const props = getPinoHttp('info').customProps(req);

    // Assert
    expect(props).toEqual({ correlation_id: 'corr-xyz' });
  });
});
