import { promises as fs } from 'node:fs';
import path from 'node:path';

import type {
  CommerceOrder,
  DecisionAuditEvent,
  DeviceInventoryItem,
  ForecastBundle,
  IrrigationSession,
  MachineDevice,
  ModerationAction,
  PlantProfile,
  ProductCatalogItem,
  PurchaseRiskEvent,
  SensorSnapshot,
  UserAccount,
  UUID
} from '../domain/models.js';
import type {
  DecisionAuditRepository,
  DeviceInventoryRepository,
  DeviceRepository,
  ForecastRepository,
  IrrigationSessionRepository,
  ModerationActionRepository,
  OrderRepository,
  PlantRepository,
  ProductCatalogRepository,
  PurchaseRiskEventRepository,
  SensorRepository,
  UserRepository
} from './interfaces.js';

interface DataShape {
  plants?: PlantProfile[];
  devices?: MachineDevice[];
  users?: UserAccount[];
  products?: ProductCatalogItem[];
  deviceInventory?: DeviceInventoryItem[];
  orders?: CommerceOrder[];
  riskEvents?: PurchaseRiskEvent[];
  moderationActions?: ModerationAction[];
  sensorSnapshots?: SensorSnapshot[];
  forecastBundles?: ForecastBundle[];
  irrigationSessions?: IrrigationSession[];
  auditEvents?: DecisionAuditEvent[];
}

class JsonDataSource {
  constructor(private readonly filePath: string) {}

  async read(): Promise<DataShape> {
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      return JSON.parse(raw) as DataShape;
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return {};
      }
      throw error;
    }
  }

  async write(data: DataShape): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf8');
  }
}

export class JsonPlantRepository implements PlantRepository {
  constructor(private readonly dataSource: JsonDataSource) {}

  async getById(plantId: UUID): Promise<PlantProfile | null> {
    const data = await this.dataSource.read();
    return data.plants?.find(plant => plant.id === plantId) ?? null;
  }

  async listByOwner(userEmail: string): Promise<PlantProfile[]> {
    const data = await this.dataSource.read();
    return (data.plants ?? []).filter(plant => plant.ownerUserEmail === userEmail);
  }

  async save(plant: PlantProfile): Promise<void> {
    const data = await this.dataSource.read();
    const plants = data.plants ?? [];
    const idx = plants.findIndex(item => item.id === plant.id);
    if (idx === -1) plants.push(plant);
    else plants[idx] = plant;
    await this.dataSource.write({ ...data, plants });
  }
}

export class JsonSensorRepository implements SensorRepository {
  constructor(private readonly dataSource: JsonDataSource) {}

  async getLatestSnapshot(plantId: UUID): Promise<SensorSnapshot | null> {
    const data = await this.dataSource.read();
    const snapshots = data.sensorSnapshots?.filter(snapshot => snapshot.plantId === plantId) ?? [];
    snapshots.sort((a, b) => Date.parse(b.capturedAt) - Date.parse(a.capturedAt));
    return snapshots[0] ?? null;
  }
}

export class JsonDeviceRepository implements DeviceRepository {
  constructor(private readonly dataSource: JsonDataSource) {}

  async getByMachineCode(machineCode: string): Promise<MachineDevice | null> {
    const data = await this.dataSource.read();
    return data.devices?.find(device => device.machineCode === machineCode) ?? null;
  }

  async save(device: MachineDevice): Promise<void> {
    const data = await this.dataSource.read();
    const devices = data.devices ?? [];
    const idx = devices.findIndex(item => item.machineCode === device.machineCode);
    if (idx === -1) devices.push(device);
    else devices[idx] = device;
    await this.dataSource.write({
      ...data,
      devices
    });
  }
}

export class JsonUserRepository implements UserRepository {
  constructor(private readonly dataSource: JsonDataSource) {}

  async getByEmail(email: string): Promise<UserAccount | null> {
    const data = await this.dataSource.read();
    return data.users?.find(user => user.email === email) ?? null;
  }

  async save(user: UserAccount): Promise<void> {
    const data = await this.dataSource.read();
    const users = data.users ?? [];
    const idx = users.findIndex(item => item.email === user.email);
    if (idx === -1) users.push(user);
    else users[idx] = user;
    await this.dataSource.write({ ...data, users });
  }
}

export class JsonProductCatalogRepository implements ProductCatalogRepository {
  constructor(private readonly dataSource: JsonDataSource) {}

  async listActive(): Promise<ProductCatalogItem[]> {
    const data = await this.dataSource.read();
    return (data.products ?? []).filter(product => product.active);
  }

  async getById(productId: string): Promise<ProductCatalogItem | null> {
    const data = await this.dataSource.read();
    return data.products?.find(product => product.id === productId) ?? null;
  }
}

export class JsonDeviceInventoryRepository implements DeviceInventoryRepository {
  constructor(private readonly dataSource: JsonDataSource) {}

  async getByMachineCode(machineCode: string): Promise<DeviceInventoryItem | null> {
    const data = await this.dataSource.read();
    return data.deviceInventory?.find(device => device.machineCode === machineCode) ?? null;
  }

  async listAvailableByTier(tier: 'Standard' | 'Pro'): Promise<DeviceInventoryItem[]> {
    const data = await this.dataSource.read();
    return (data.deviceInventory ?? []).filter(device => device.tier === tier && device.inventoryStatus === 'available' && !device.isDemoCode);
  }

  async listByOwner(userEmail: string): Promise<DeviceInventoryItem[]> {
    const data = await this.dataSource.read();
    return (data.deviceInventory ?? []).filter(device => device.ownerEmail === userEmail);
  }

  async save(device: DeviceInventoryItem): Promise<void> {
    const data = await this.dataSource.read();
    const devices = data.deviceInventory ?? [];
    const idx = devices.findIndex(item => item.machineCode === device.machineCode);
    if (idx === -1) devices.push(device);
    else devices[idx] = device;
    await this.dataSource.write({ ...data, deviceInventory: devices });
  }
}

export class JsonOrderRepository implements OrderRepository {
  constructor(private readonly dataSource: JsonDataSource) {}

  async listByUser(userEmail: string): Promise<CommerceOrder[]> {
    const data = await this.dataSource.read();
    return (data.orders ?? []).filter(order => order.userEmail === userEmail);
  }

  async listAll(): Promise<CommerceOrder[]> {
    const data = await this.dataSource.read();
    return data.orders ?? [];
  }

  async getById(orderId: string): Promise<CommerceOrder | null> {
    const data = await this.dataSource.read();
    return data.orders?.find(order => order.id === orderId) ?? null;
  }

  async save(order: CommerceOrder): Promise<void> {
    const data = await this.dataSource.read();
    const orders = data.orders ?? [];
    const idx = orders.findIndex(item => item.id === order.id);
    if (idx === -1) orders.push(order);
    else orders[idx] = order;
    await this.dataSource.write({ ...data, orders });
  }
}

export class JsonPurchaseRiskEventRepository implements PurchaseRiskEventRepository {
  constructor(private readonly dataSource: JsonDataSource) {}

  async listByUser(userEmail: string): Promise<PurchaseRiskEvent[]> {
    const data = await this.dataSource.read();
    return (data.riskEvents ?? []).filter(event => event.userEmail === userEmail);
  }

  async save(event: PurchaseRiskEvent): Promise<void> {
    const data = await this.dataSource.read();
    const riskEvents = data.riskEvents ?? [];
    riskEvents.unshift(event);
    await this.dataSource.write({ ...data, riskEvents });
  }
}

export class JsonModerationActionRepository implements ModerationActionRepository {
  constructor(private readonly dataSource: JsonDataSource) {}

  async save(action: ModerationAction): Promise<void> {
    const data = await this.dataSource.read();
    const moderationActions = data.moderationActions ?? [];
    moderationActions.unshift(action);
    await this.dataSource.write({ ...data, moderationActions });
  }
}

export class JsonForecastRepository implements ForecastRepository {
  constructor(private readonly dataSource: JsonDataSource) {}

  async getLatestBySite(siteId: UUID): Promise<ForecastBundle | null> {
    const data = await this.dataSource.read();
    const bundles = data.forecastBundles?.filter(bundle => bundle.siteId === siteId) ?? [];
    bundles.sort((a, b) => Date.parse(b.fetchedAt) - Date.parse(a.fetchedAt));
    return bundles[0] ?? null;
  }
}

export class JsonIrrigationSessionRepository implements IrrigationSessionRepository {
  constructor(private readonly dataSource: JsonDataSource) {}

  async listRecentByPlant(plantId: UUID, limit: number): Promise<IrrigationSession[]> {
    const data = await this.dataSource.read();
    const sessions = data.irrigationSessions?.filter(session => session.plantId === plantId) ?? [];
    return sessions
      .sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))
      .slice(0, limit);
  }
}

export class JsonDecisionAuditRepository implements DecisionAuditRepository {
  constructor(private readonly dataSource: JsonDataSource) {}

  async save(event: DecisionAuditEvent): Promise<void> {
    const data = await this.dataSource.read();
    const auditEvents = data.auditEvents ?? [];
    auditEvents.unshift(event);
    await this.dataSource.write({
      ...data,
      auditEvents
    });
  }
}

export function createJsonRepositories(filePath: string) {
  const dataSource = new JsonDataSource(filePath);

  return {
    plantRepository: new JsonPlantRepository(dataSource),
    deviceRepository: new JsonDeviceRepository(dataSource),
    userRepository: new JsonUserRepository(dataSource),
    productCatalogRepository: new JsonProductCatalogRepository(dataSource),
    deviceInventoryRepository: new JsonDeviceInventoryRepository(dataSource),
    orderRepository: new JsonOrderRepository(dataSource),
    purchaseRiskEventRepository: new JsonPurchaseRiskEventRepository(dataSource),
    moderationActionRepository: new JsonModerationActionRepository(dataSource),
    sensorRepository: new JsonSensorRepository(dataSource),
    forecastRepository: new JsonForecastRepository(dataSource),
    irrigationSessionRepository: new JsonIrrigationSessionRepository(dataSource),
    decisionAuditRepository: new JsonDecisionAuditRepository(dataSource)
  };
}
