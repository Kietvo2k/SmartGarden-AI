import { IrrigationDecisionEngine } from '../engine/irrigationDecisionEngine.js';
import type { IrrigationRecommendation } from '../domain/models.js';
import type {
  ForecastRepository,
  IrrigationSessionRepository,
  PlantRepository,
  SensorRepository
} from '../repositories/interfaces.js';
import { AuditLogService } from './auditLogService.js';

interface RecommendationServiceDeps {
  plantRepository: PlantRepository;
  sensorRepository: SensorRepository;
  forecastRepository: ForecastRepository;
  irrigationSessionRepository: IrrigationSessionRepository;
  auditLogService: AuditLogService;
  decisionEngine: IrrigationDecisionEngine;
}

export class RecommendationService {
  constructor(private readonly deps: RecommendationServiceDeps) {}

  async getPlantRecommendation(plantId: string): Promise<IrrigationRecommendation> {
    const plant = await this.deps.plantRepository.getById(plantId);
    if (!plant) {
      throw new Error(`Plant ${plantId} not found`);
    }

    const [latestSnapshot, forecast, recentSessions] = await Promise.all([
      this.deps.sensorRepository.getLatestSnapshot(plantId),
      this.deps.forecastRepository.getLatestBySite(plant.siteId),
      this.deps.irrigationSessionRepository.listRecentByPlant(plantId, 5)
    ]);

    const recommendation = this.deps.decisionEngine.evaluate({
      plant,
      latestSnapshot,
      forecast,
      recentSessions,
      now: new Date()
    });

    await this.deps.auditLogService.logRecommendation(plantId, recommendation);

    return recommendation;
  }
}
