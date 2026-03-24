import crypto from 'node:crypto';

import type { DecisionAuditEvent, IrrigationRecommendation, UUID } from '../domain/models.js';
import type { DecisionAuditRepository } from '../repositories/interfaces.js';

export class AuditLogService {
  constructor(private readonly decisionAuditRepository: DecisionAuditRepository) {}

  async logRecommendation(plantId: UUID, recommendation: IrrigationRecommendation): Promise<void> {
    const event: DecisionAuditEvent = {
      id: crypto.randomUUID(),
      plantId,
      eventType: 'RECOMMENDATION_GENERATED',
      createdAt: new Date().toISOString(),
      payload: recommendation
    };

    await this.decisionAuditRepository.save(event);
  }
}
