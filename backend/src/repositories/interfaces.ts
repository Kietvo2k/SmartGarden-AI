import type {
  CommerceOrder,
  DecisionAuditEvent,
  DeviceLifecycleActionResult,
  DeviceInventoryItem,
  MachineDevice,
  ModerationAction,
  PlantCreateRequest,
  PlantCreationVerification,
  ProductCatalogItem,
  PurchaseRiskEvent,
  ForecastBundle,
  IrrigationSession,
  PlantProfile,
  SensorSnapshot,
  UserAccount,
  UUID
} from '../domain/models.js';

export interface PlantRepository {
  getById(plantId: UUID): Promise<PlantProfile | null>;
  listByOwner(userEmail: string): Promise<PlantProfile[]>;
  save(plant: PlantProfile): Promise<void>;
}

export interface SensorRepository {
  getLatestSnapshot(plantId: UUID): Promise<SensorSnapshot | null>;
}

export interface DeviceRepository {
  getByMachineCode(machineCode: string): Promise<MachineDevice | null>;
  save(device: MachineDevice): Promise<void>;
}

export interface UserRepository {
  getByEmail(email: string): Promise<UserAccount | null>;
  save(user: UserAccount): Promise<void>;
}

export interface ProductCatalogRepository {
  listActive(): Promise<ProductCatalogItem[]>;
  getById(productId: string): Promise<ProductCatalogItem | null>;
}

export interface DeviceInventoryRepository {
  getByMachineCode(machineCode: string): Promise<DeviceInventoryItem | null>;
  listAvailableByTier(tier: 'Standard' | 'Pro'): Promise<DeviceInventoryItem[]>;
  listByOwner(userEmail: string): Promise<DeviceInventoryItem[]>;
  save(device: DeviceInventoryItem): Promise<void>;
}

export interface OrderRepository {
  listByUser(userEmail: string): Promise<CommerceOrder[]>;
  listAll(): Promise<CommerceOrder[]>;
  getById(orderId: string): Promise<CommerceOrder | null>;
  save(order: CommerceOrder): Promise<void>;
}

export interface PurchaseRiskEventRepository {
  listByUser(userEmail: string): Promise<PurchaseRiskEvent[]>;
  save(event: PurchaseRiskEvent): Promise<void>;
}

export interface ModerationActionRepository {
  save(action: ModerationAction): Promise<void>;
}

export interface ForecastRepository {
  getLatestBySite(siteId: UUID): Promise<ForecastBundle | null>;
}

export interface IrrigationSessionRepository {
  listRecentByPlant(plantId: UUID, limit: number): Promise<IrrigationSession[]>;
}

export interface DecisionAuditRepository {
  save(event: DecisionAuditEvent): Promise<void>;
}
