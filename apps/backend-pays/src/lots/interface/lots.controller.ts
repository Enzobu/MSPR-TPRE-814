import {
  Body,
  ConflictException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { CreateLotUseCase } from '../application/create-lot.use-case';
import { GetLotFacetsUseCase } from '../application/get-lot-facets.use-case';
import { GetLotUseCase } from '../application/get-lot.use-case';
import { ListLotsUseCase } from '../application/list-lots.use-case';
import { UpdateLotStatusUseCase } from '../application/update-lot-status.use-case';
import {
  LotAlreadyExistsError,
  LotCountryMismatchError,
  LotNotFoundError,
} from '../domain/lot.errors';
import type { SortDirection } from '../domain/lot.repository';
import { CreateLotDto } from './dto/create-lot.dto';
import { ListLotsQueryDto } from './dto/list-lots-query.dto';
import { LotFacetsQueryDto } from './dto/lot-facets-query.dto';
import { LotFacetsResponseDto } from './dto/lot-facets-response.dto';
import { LotResponseDto } from './dto/lot-response.dto';
import { PaginatedLotsResponseDto } from './dto/paginated-lots-response.dto';
import { UpdateLotStatusDto } from './dto/update-lot-status.dto';
import { toLotResponse } from './lot.mapper';

@ApiTags('lots')
@Controller({ path: 'lots', version: '1' })
export class LotsController {
  constructor(
    private readonly createLot: CreateLotUseCase,
    private readonly listLots: ListLotsUseCase,
    private readonly getLotFacets: GetLotFacetsUseCase,
    private readonly getLot: GetLotUseCase,
    private readonly updateLotStatus: UpdateLotStatusUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Crée un lot',
    description:
      'Enregistre un lot pour le pays du backend. 409 si l’id existe déjà, 422 si le pays ne correspond pas au backend.',
  })
  @ApiCreatedResponse({ type: LotResponseDto })
  @ApiConflictResponse({
    description: 'Un lot avec cet id existe déjà (RFC 7807).',
  })
  @ApiUnprocessableEntityResponse({
    description: 'Le pays du lot ne correspond pas au backend (RFC 7807).',
  })
  async create(@Body() dto: CreateLotDto): Promise<LotResponseDto> {
    try {
      const lot = await this.createLot.execute({
        id: dto.id,
        country: dto.country,
        farm: dto.farm,
        warehouse: dto.warehouse,
        storedAt: new Date(dto.storedAt),
      });
      return toLotResponse(lot);
    } catch (error) {
      this.rethrowAsHttp(error);
    }
  }

  @Get()
  @ApiOperation({
    summary: 'Liste les lots (FIFO, paginé)',
    description:
      'Tri FIFO par défaut (storedAt croissant). Pagination `{ data, total, page, pageSize }`.',
  })
  @ApiOkResponse({ type: PaginatedLotsResponseDto })
  async list(
    @Query() query: ListLotsQueryDto,
  ): Promise<PaginatedLotsResponseDto> {
    // WHY: `sort` est validé par SORT_PATTERN (storedAt:asc|desc) dans le DTO ;
    // le segment après ':' est donc toujours un SortDirection.
    const direction = query.sort.split(':')[1] as SortDirection;
    const result = await this.listLots.execute({
      page: query.page,
      pageSize: query.pageSize,
      direction,
      country: query.country,
      farm: query.farm,
      warehouse: query.warehouse,
    });
    return { ...result, data: result.data.map(toLotResponse) };
  }

  // WHY: doit précéder `:id`, sinon Nest route "facets" vers getById(id="facets").
  @Get('facets')
  @ApiOperation({
    summary: 'Facettes de filtrage (exploitations, entrepôts)',
    description:
      'Valeurs distinctes disponibles pour filtrer les lots (CDC §III.3). Scopable par pays.',
  })
  @ApiOkResponse({ type: LotFacetsResponseDto })
  async facets(
    @Query() query: LotFacetsQueryDto,
  ): Promise<LotFacetsResponseDto> {
    return this.getLotFacets.execute({ country: query.country });
  }

  @Get(':id')
  @ApiOperation({ summary: "Détail d'un lot" })
  @ApiParam({ name: 'id', example: 'BR-2026-008' })
  @ApiOkResponse({ type: LotResponseDto })
  @ApiNotFoundResponse({ description: 'Lot inconnu (RFC 7807).' })
  async getById(@Param('id') id: string): Promise<LotResponseDto> {
    try {
      return toLotResponse(await this.getLot.execute(id));
    } catch (error) {
      this.rethrowAsHttp(error);
    }
  }

  @Patch(':id/status')
  @ApiOperation({ summary: "Met à jour le statut d'un lot" })
  @ApiParam({ name: 'id', example: 'BR-2026-008' })
  @ApiOkResponse({ type: LotResponseDto })
  @ApiNotFoundResponse({ description: 'Lot inconnu (RFC 7807).' })
  async patchStatus(
    @Param('id') id: string,
    @Body() dto: UpdateLotStatusDto,
  ): Promise<LotResponseDto> {
    try {
      return toLotResponse(await this.updateLotStatus.execute(id, dto.status));
    } catch (error) {
      this.rethrowAsHttp(error);
    }
  }

  // Traduit les erreurs métier en HttpException ; le ProblemDetailsFilter global
  // les normalise ensuite en RFC 7807. Toute autre erreur remonte (→ 500).
  private rethrowAsHttp(error: unknown): never {
    if (error instanceof LotNotFoundError) {
      throw new NotFoundException(error.message);
    }
    if (error instanceof LotAlreadyExistsError) {
      throw new ConflictException(error.message);
    }
    if (error instanceof LotCountryMismatchError) {
      throw new UnprocessableEntityException(error.message);
    }
    throw error;
  }
}
