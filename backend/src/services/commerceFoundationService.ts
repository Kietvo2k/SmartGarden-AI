import type {
  CommerceOrder,
  DeviceInventoryItem,
  ModerationAction,
  OrderItem,
  OrderStatus,
  ProductCatalogItem,
  PurchaseRiskEvent
} from '../domain/models.js';
import type {
  DeviceInventoryRepository,
  ModerationActionRepository,
  OrderRepository,
  ProductCatalogRepository,
  PurchaseRiskEventRepository,
  UserRepository
} from '../repositories/interfaces.js';

const DAILY_PURCHASE_CAP_VND = 5_000_000;
const REVEALABLE_STATUSES: OrderStatus[] = ['paid', 'fulfilled', 'completed'];

interface CheckoutInput {
  userEmail: string;
  customerName: string;
  phone: string;
  address: string;
  note?: string;
  items: Array<{ productId: string; quantity: number }>;
}

export class CommerceFoundationService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly productCatalogRepository: ProductCatalogRepository,
    private readonly orderRepository: OrderRepository,
    private readonly deviceInventoryRepository: DeviceInventoryRepository,
    private readonly purchaseRiskEventRepository: PurchaseRiskEventRepository,
    private readonly moderationActionRepository: ModerationActionRepository
  ) {}

  async listProducts(): Promise<ProductCatalogItem[]> {
    return this.productCatalogRepository.listActive();
  }

  async listOrdersForUser(userEmail: string): Promise<CommerceOrder[]> {
    return this.orderRepository.listByUser(userEmail);
  }

  async listOwnedDevices(userEmail: string): Promise<DeviceInventoryItem[]> {
    return this.deviceInventoryRepository.listByOwner(userEmail);
  }

  async checkout(input: CheckoutInput): Promise<CommerceOrder> {
    const user = await this.userRepository.getByEmail(input.userEmail);
    if (!user) throw new Error('USER_NOT_FOUND');
    if (user.storeFrozen) throw new Error('STORE_FROZEN');
    if (user.status !== 'active') throw new Error('USER_RESTRICTED');

    const items = await this.hydrateOrderItems(input.items);
    const totalVnd = items.reduce((sum, item) => sum + item.priceVnd * item.quantity, 0);
    const todaySpend = await this.getTodaySpend(input.userEmail);
    if (todaySpend + totalVnd > DAILY_PURCHASE_CAP_VND) {
      await this.createRiskEvent(input.userEmail, todaySpend, totalVnd);
      throw new Error('DAILY_PURCHASE_CAP_EXCEEDED');
    }

    const order: CommerceOrder = {
      id: `ord_${Date.now()}`,
      userEmail: input.userEmail,
      createdAt: new Date().toISOString(),
      customerName: input.customerName,
      phone: input.phone,
      address: input.address,
      note: input.note ?? '',
      items,
      totalVnd,
      status: 'pending_review',
      devicesIssuedAt: null
    };

    await this.orderRepository.save(order);
    return order;
  }

  async updateOrderStatus(orderId: string, actorEmail: string, nextStatus: OrderStatus, note = ''): Promise<CommerceOrder> {
    const order = await this.orderRepository.getById(orderId);
    if (!order) throw new Error('ORDER_NOT_FOUND');

    order.status = nextStatus;
    if (REVEALABLE_STATUSES.includes(nextStatus)) {
      await this.issueDevicesForOrder(order);
    }

    await this.orderRepository.save(order);
    return order;
  }

  private async hydrateOrderItems(rawItems: CheckoutInput['items']): Promise<OrderItem[]> {
    const items: OrderItem[] = [];
    for (const rawItem of rawItems) {
      const product = await this.productCatalogRepository.getById(rawItem.productId);
      if (!product || !product.active) throw new Error('PRODUCT_NOT_FOUND');
      items.push({
        productId: product.id,
        productName: product.name,
        productType: product.productType,
        deviceTier: product.deviceTier,
        priceVnd: product.priceVnd,
        quantity: rawItem.quantity
      });
    }
    return items;
  }

  private async getTodaySpend(userEmail: string): Promise<number> {
    const today = new Date().toISOString().slice(0, 10);
    const orders = await this.orderRepository.listByUser(userEmail);
    return orders
      .filter(order => order.createdAt.slice(0, 10) === today && !['rejected', 'cancelled'].includes(order.status))
      .reduce((sum, order) => sum + order.totalVnd, 0);
  }

  private async createRiskEvent(userEmail: string, currentSpendVnd: number, attemptedOrderVnd: number): Promise<PurchaseRiskEvent> {
    const event: PurchaseRiskEvent = {
      id: `risk_${Date.now()}`,
      userEmail,
      createdAt: new Date().toISOString(),
      status: 'open',
      type: 'DAILY_PURCHASE_CAP_EXCEEDED',
      reason: 'Daily purchase cap exceeded',
      currentSpendVnd,
      attemptedSpendVnd: currentSpendVnd + attemptedOrderVnd
    };
    await this.purchaseRiskEventRepository.save(event);

    const priorEvents = await this.purchaseRiskEventRepository.listByUser(userEmail);
    if (priorEvents.filter(item => item.status === 'open').length >= 2) {
      const user = await this.userRepository.getByEmail(userEmail);
      if (user) {
        user.storeFrozen = true;
        await this.userRepository.save(user);
      }

      const moderationAction: ModerationAction = {
        id: `mod_${Date.now()}`,
        userEmail,
        actorEmail: 'system',
        createdAt: new Date().toISOString(),
        action: 'STORE_FREEZE',
        reason: 'Repeated checkout attempts above daily purchase cap'
      };
      await this.moderationActionRepository.save(moderationAction);
    }

    return event;
  }

  private async issueDevicesForOrder(order: CommerceOrder): Promise<DeviceInventoryItem[]> {
    if (order.devicesIssuedAt) {
      return this.deviceInventoryRepository.listByOwner(order.userEmail);
    }

    const assigned: DeviceInventoryItem[] = [];
    for (const item of order.items) {
      if (item.productType !== 'device') continue;
      const tier = item.deviceTier ?? 'Standard';
      for (let i = 0; i < item.quantity; i += 1) {
        const [available] = await this.deviceInventoryRepository.listAvailableByTier(tier);
        if (!available) throw new Error('DEVICE_INVENTORY_SHORTAGE');

        available.ownerEmail = order.userEmail;
        available.orderId = order.id;
        available.inventoryStatus = 'owned';
        available.codeRevealedAt = new Date().toISOString();
        await this.deviceInventoryRepository.save(available);
        assigned.push(available);
      }
    }

    order.devicesIssuedAt = new Date().toISOString();
    await this.orderRepository.save(order);
    return assigned;
  }
}
