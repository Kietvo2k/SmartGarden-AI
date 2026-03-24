import { Router } from 'express';

import { recommendationQuerySchema } from '../domain/schemas.js';
import { RecommendationService } from '../services/recommendationService.js';

export function createRecommendationRouter(recommendationService: RecommendationService) {
  const router = Router();

  router.get('/plants/:plantId/recommendation', async (req, res) => {
    const parsed = recommendationQuerySchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'INVALID_PLANT_ID',
        details: parsed.error.flatten()
      });
    }

    try {
      const recommendation = await recommendationService.getPlantRecommendation(parsed.data.plantId);
      return res.status(200).json({
        data: recommendation
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({
          error: 'PLANT_NOT_FOUND',
          message: error.message
        });
      }

      console.error(error);
      return res.status(500).json({
        error: 'RECOMMENDATION_FAILURE',
        message: 'Không thể tính recommendation cho cây ở thời điểm này.'
      });
    }
  });

  return router;
}
