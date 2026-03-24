import path from 'node:path';
import { fileURLToPath } from 'node:url';

import cors from 'cors';
import express from 'express';

import { IrrigationDecisionEngine } from './engine/irrigationDecisionEngine.js';
import { createJsonRepositories } from './repositories/jsonRepositories.js';
import { createCommerceRouter } from './routes/commerce.js';
import { createDeviceLinkRouter } from './routes/deviceLinking.js';
import { createPlantProvisioningRouter } from './routes/plantProvisioning.js';
import { createRecommendationRouter } from './routes/recommendations.js';
import { AuditLogService } from './services/auditLogService.js';
import { CommerceFoundationService } from './services/commerceFoundationService.js';
import { DeviceLinkService } from './services/deviceLinkService.js';
import { PlantProvisioningService } from './services/plantProvisioningService.js';
import { RecommendationService } from './services/recommendationService.js';

const app = express();
const PORT = Number(process.env.PORT ?? 8787);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataFile = path.resolve(__dirname, '../data/runtime-data.json');

const repositories = createJsonRepositories(dataFile);
const auditLogService = new AuditLogService(repositories.decisionAuditRepository);
const deviceLinkService = new DeviceLinkService(repositories.deviceRepository);
const plantProvisioningService = new PlantProvisioningService(
  repositories.plantRepository,
  repositories.deviceInventoryRepository
);
const commerceFoundationService = new CommerceFoundationService(
  repositories.userRepository,
  repositories.productCatalogRepository,
  repositories.orderRepository,
  repositories.deviceInventoryRepository,
  repositories.purchaseRiskEventRepository,
  repositories.moderationActionRepository
);
const recommendationService = new RecommendationService({
  plantRepository: repositories.plantRepository,
  sensorRepository: repositories.sensorRepository,
  forecastRepository: repositories.forecastRepository,
  irrigationSessionRepository: repositories.irrigationSessionRepository,
  auditLogService,
  decisionEngine: new IrrigationDecisionEngine()
});

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'smartgardenai-backend'
  });
});

app.use('/api/v1', createRecommendationRouter(recommendationService));
app.use('/api/v1', createDeviceLinkRouter(deviceLinkService));
app.use('/api/v1', createCommerceRouter(commerceFoundationService));
app.use('/api/v1', createPlantProvisioningRouter(plantProvisioningService));

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'Unexpected backend error'
  });
});

app.listen(PORT, () => {
  console.log(`SmartGardenAI backend listening on http://localhost:${PORT}`);
  console.log(`Data source: ${dataFile}`);
});
