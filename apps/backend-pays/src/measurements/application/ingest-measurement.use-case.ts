import { Inject, Injectable } from '@nestjs/common';
import type { Measurement, NewMeasurement } from '../domain/measurement';
import { MEASUREMENT_REPOSITORY } from '../domain/measurement.repository';
import type { MeasurementRepository } from '../domain/measurement.repository';

// Persiste un relevé validé. Point d'entrée unique de l'ingestion, partagé par
// le subscriber MQTT (#28) et le fallback REST POST /api/v1/measurements. La
// validation des plages/format vit en amont (DTO REST + parsing MQTT) ; ce
// use-case suppose un NewMeasurement déjà valide.
@Injectable()
export class IngestMeasurementUseCase {
  constructor(
    @Inject(MEASUREMENT_REPOSITORY)
    private readonly measurements: MeasurementRepository,
  ) {}

  execute(input: NewMeasurement): Promise<Measurement> {
    return this.measurements.save(input);
  }
}
