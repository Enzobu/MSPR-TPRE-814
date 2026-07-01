import { Inject, Injectable } from '@nestjs/common';
import type { CountryCode } from '@futurekawa/contracts';
import type { Measurement } from '../domain/measurement';
import { MEASUREMENT_REPOSITORY } from '../domain/measurement.repository';
import type { MeasurementRepository } from '../domain/measurement.repository';

// Dernier relevé du pays (tous entrepôts confondus), ou null si aucun. Alimente
// la vue « dernier relevé par région » du siège (#143) sans exiger un entrepôt.
// `country` optionnel scope la démo mono-instance (cf. #144).
@Injectable()
export class GetLatestMeasurementUseCase {
  constructor(
    @Inject(MEASUREMENT_REPOSITORY)
    private readonly measurements: MeasurementRepository,
  ) {}

  execute(country?: CountryCode): Promise<Measurement | null> {
    return this.measurements.findLatest(country);
  }
}
