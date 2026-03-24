import { Router } from 'express';

import { createPlantBodySchema, deviceLifecycleBodySchema, verifyPlantMachineBodySchema } from '../domain/schemas.js';
import { PlantProvisioningService } from '../services/plantProvisioningService.js';

export function createPlantProvisioningRouter(service: PlantProvisioningService) {
  const router = Router();

  router.post('/plants/verify-machine', async (req, res) => {
    const parsed = verifyPlantMachineBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'INVALID_VERIFY_MACHINE_PAYLOAD',
        details: parsed.error.flatten()
      });
    }

    try {
      const result = await service.verifyMachineCodeForPlant(parsed.data.userEmail, parsed.data.machineCode, parsed.data.existingPlantId);
      return res.status(200).json({ data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
      return res.status(409).json({ error: message });
    }
  });

  router.post('/plants', async (req, res) => {
    const parsed = createPlantBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'INVALID_CREATE_PLANT_PAYLOAD',
        details: parsed.error.flatten()
      });
    }

    try {
      const plant = await service.createPlant(parsed.data);
      return res.status(201).json({ data: plant });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
      return res.status(409).json({ error: message });
    }
  });

  router.post('/devices/:machineCode/lifecycle', async (req, res) => {
    const parsed = deviceLifecycleBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'INVALID_DEVICE_LIFECYCLE_PAYLOAD',
        details: parsed.error.flatten()
      });
    }

    try {
      const result = await service.applyDeviceLifecycle(req.params.machineCode, parsed.data.actorEmail, parsed.data.action);
      return res.status(200).json({ data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
      return res.status(409).json({ error: message });
    }
  });

  return router;
}
