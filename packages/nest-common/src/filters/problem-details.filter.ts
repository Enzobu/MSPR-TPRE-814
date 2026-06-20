import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ProblemDetailsDto } from '../dto/problem-details.dto';

const MIN_SERVER_ERROR_STATUS = 500;

// Filtre global : normalise TOUTE exception en RFC 7807 (application/problem+json).
// Jamais de stacktrace ni de détail interne renvoyé au client (rules/07-security.md) ;
// les 5xx sont loguées côté serveur avec le correlation_id propagé par pino.
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, title, detail, errors } = this.describe(exception);

    if (status >= MIN_SERVER_ERROR_STATUS) {
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const problem: ProblemDetailsDto = {
      type: 'about:blank',
      title,
      status,
      detail,
      instance: request.url,
      ...(errors ? { errors } : {}),
    };

    response.status(status).type('application/problem+json').json(problem);
  }

  private describe(exception: unknown): {
    status: number;
    title: string;
    detail: string;
    errors?: string[];
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      return {
        status,
        title: this.titleFor(status),
        detail: this.detailFrom(body, exception.message),
        errors: this.errorsFrom(body),
      };
    }

    // Toute autre erreur = 500 générique, sans fuite d'information.
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      title: this.titleFor(HttpStatus.INTERNAL_SERVER_ERROR),
      detail: 'An unexpected error occurred.',
    };
  }

  private detailFrom(body: string | object, fallback: string): string {
    if (typeof body === 'string') {
      return body;
    }
    const message = (body as { message?: unknown }).message;
    if (Array.isArray(message)) {
      return message.join(', ');
    }
    if (typeof message === 'string') {
      return message;
    }
    return fallback;
  }

  private errorsFrom(body: string | object): string[] | undefined {
    if (typeof body === 'object') {
      const message = (body as { message?: unknown }).message;
      if (Array.isArray(message)) {
        return message.map(String);
      }
    }
    return undefined;
  }

  private titleFor(status: number): string {
    const name = HttpStatus[status] as string | undefined;
    if (!name) {
      return 'Error';
    }
    return name
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
