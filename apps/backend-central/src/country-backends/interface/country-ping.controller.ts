import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  Param,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { COUNTRY_CONDITIONS } from '@futurekawa/contracts';
import type { CountryCode } from '@futurekawa/contracts';
import { COUNTRY_BACKEND_GATEWAY } from '../domain/country-backend.gateway';
import type { CountryBackendGateway } from '../domain/country-backend.gateway';
import { CountryPingResponseDto } from './dto/country-ping.response.dto';

const COUNTRY_CODES = Object.keys(COUNTRY_CONDITIONS) as CountryCode[];

// req.id est injecté par nestjs-pino (genReqId) : c'est le correlation-id de la requête.
type RequestWithId = Request & { id: string };

interface PaysHealth {
  status: string;
}

// Endpoint de debug (ADR-0007, retirable) : valide le câblage du gateway et la
// propagation du correlation-id vers un backend pays. Réponse partielle, jamais 500.
@ApiTags('countries')
@Controller({ path: 'countries', version: '1' })
export class CountryPingController {
  constructor(
    @Inject(COUNTRY_BACKEND_GATEWAY)
    private readonly gateway: CountryBackendGateway,
  ) {}

  @Get(':country/ping')
  @ApiOperation({
    summary: 'Ping un backend pays via le gateway',
    description:
      'Appelle le /health du pays à travers le gateway résilient (timeout, retry, breaker) et propage le correlation-id. Endpoint de debug, retirable.',
  })
  @ApiParam({ name: 'country', enum: COUNTRY_CODES, example: 'BR' })
  @ApiResponse({ status: 200, type: CountryPingResponseDto })
  @ApiResponse({ status: 400, description: 'Code pays invalide (RFC 7807).' })
  async ping(
    @Param('country') country: string,
    @Req() req: RequestWithId,
  ): Promise<CountryPingResponseDto> {
    const code = country.toUpperCase() as CountryCode;
    if (!COUNTRY_CODES.includes(code)) {
      throw new BadRequestException(
        `country must be one of ${COUNTRY_CODES.join(', ')}`,
      );
    }

    try {
      const health = await this.gateway.get<PaysHealth>(code, '/health', {
        correlationId: req.id,
      });
      return { country: code, reachable: true, status: health.status };
    } catch {
      return { country: code, reachable: false, status: null };
    }
  }
}
