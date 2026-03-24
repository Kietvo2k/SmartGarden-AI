import { Router } from 'express';

import { deviceLinkBodySchema } from '../domain/schemas.js';
import { DeviceLinkService } from '../services/deviceLinkService.js';

export function createDeviceLinkRouter(deviceLinkService: DeviceLinkService) {
  const router = Router();

  router.post('/devices/link', async (req, res) => {
    const parsed = deviceLinkBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'INVALID_DEVICE_LINK_PAYLOAD',
        details: parsed.error.flatten()
      });
    }

    try {
      const result = await deviceLinkService.linkDeviceToUser(parsed.data.userEmail, parsed.data.machineCode);
      return res.status(200).json({ data: result });
    } catch (error) {
      if (error instanceof Error && error.message === 'DEVICE_NOT_FOUND') {
        return res.status(404).json({
          error: 'DEVICE_NOT_FOUND',
          message: 'Machine code does not exist'
        });
      }

      if (error instanceof Error && error.message === 'DEVICE_OWNED_BY_OTHER') {
        return res.status(409).json({
          error: 'DEVICE_OWNED_BY_OTHER',
          message: 'Machine code is already linked to another account'
        });
      }

      console.error(error);
      return res.status(500).json({
        error: 'DEVICE_LINK_FAILURE',
        message: 'Unable to link machine code right now'
      });
    }
  });

  return router;
}
