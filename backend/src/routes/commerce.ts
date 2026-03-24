import { Router } from 'express';

import { checkoutBodySchema, orderStatusUpdateSchema } from '../domain/schemas.js';
import { CommerceFoundationService } from '../services/commerceFoundationService.js';

export function createCommerceRouter(service: CommerceFoundationService) {
  const router = Router();

  router.get('/products', async (_req, res) => {
    const products = await service.listProducts();
    res.status(200).json({ data: products });
  });

  router.get('/orders', async (req, res) => {
    const userEmail = String(req.query.userEmail ?? '');
    if (!userEmail) {
      return res.status(400).json({ error: 'USER_EMAIL_REQUIRED' });
    }
    const orders = await service.listOrdersForUser(userEmail);
    return res.status(200).json({ data: orders });
  });

  router.get('/devices/owned', async (req, res) => {
    const userEmail = String(req.query.userEmail ?? '');
    if (!userEmail) {
      return res.status(400).json({ error: 'USER_EMAIL_REQUIRED' });
    }
    const devices = await service.listOwnedDevices(userEmail);
    return res.status(200).json({ data: devices });
  });

  router.post('/checkout', async (req, res) => {
    const parsed = checkoutBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'INVALID_CHECKOUT_PAYLOAD',
        details: parsed.error.flatten()
      });
    }

    try {
      const order = await service.checkout({
        userEmail: parsed.data.userEmail,
        customerName: parsed.data.customerName,
        phone: parsed.data.phone,
        address: parsed.data.address,
        note: parsed.data.note,
        items: parsed.data.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      });
      return res.status(201).json({ data: order });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
      if (['USER_NOT_FOUND', 'STORE_FROZEN', 'USER_RESTRICTED', 'DAILY_PURCHASE_CAP_EXCEEDED', 'PRODUCT_NOT_FOUND'].includes(message)) {
        return res.status(409).json({ error: message });
      }
      console.error(error);
      return res.status(500).json({ error: 'CHECKOUT_FAILED' });
    }
  });

  router.post('/admin/orders/status', async (req, res) => {
    const parsed = orderStatusUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'INVALID_ORDER_STATUS_PAYLOAD',
        details: parsed.error.flatten()
      });
    }

    try {
      const order = await service.updateOrderStatus(parsed.data.orderId, parsed.data.actorEmail, parsed.data.status, parsed.data.note);
      return res.status(200).json({ data: order });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
      if (['ORDER_NOT_FOUND', 'DEVICE_INVENTORY_SHORTAGE'].includes(message)) {
        return res.status(409).json({ error: message });
      }
      console.error(error);
      return res.status(500).json({ error: 'ORDER_STATUS_UPDATE_FAILED' });
    }
  });

  return router;
}
