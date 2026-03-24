export type UUID = string;

export type SoilType = 'sand' | 'loam' | 'clay' | 'silt' | 'peat' | 'chalk' | 'loamy_sand';
export type LocationType = 'in_pot' | 'in_soil';
export type IrrigationMode = 'AI' | 'MANUAL';
export type DeviceHealth = 'online' | 'offline' | 'degraded';
export type DeviceLinkState = 'linked' | 'unlinked';
export type DeviceTier = 'Standard' | 'Pro';
export type UserStatus = 'active' | 'suspended' | 'banned' | 'deactivated';
export type OrderStatus = 'pending_review' | 'paid' | 'fulfilled' | 'completed' | 'rejected' | 'cancelled';
export type DeviceLifecycleStatus = 'available' | 'owned' | 'locked' | 'inactive' | 'removed' | 'sandbox';
export type RecommendationAction =
  | 'IRRIGATE_NOW'
  | 'WAIT_FOR_RAIN'
  | 'MONITOR_ONLY'
  | 'MANUAL_REVIEW'
  | 'BLOCK_IRRIGATION';

export interface PlantProfile {
  id: UUID;
  siteId: UUID;
  ownerUserEmail?: string;
  deviceMachineCode?: string | null;
  isSimulated?: boolean;
  sourceLabel?: 'device_linked' | 'simulated_scan';
  displayName: string;
  plantType: string;
  soilType: SoilType;
  locationType: LocationType;
  rootZoneVolumeLiters: number;
  potAreaM2: number;
  cropCoefficient: number;
  moistureTargetPct: number;
  moistureLowerBoundPct: number;
  moistureUpperBoundPct: number;
  rainDelayThresholdMm: number;
  maxSingleIrrigationLiters: number;
  minSensorFreshnessMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface SensorSnapshot {
  plantId: UUID;
  capturedAt: string;
  soilMoisturePct: number | null;
  airTempC: number | null;
  airHumidityPct: number | null;
  lightLux: number | null;
  rainRateMmPerHour: number | null;
  deviceHealth: DeviceHealth;
}

export interface MachineDevice {
  machineCode: string;
  deviceName: string;
  siteId: UUID;
  zoneLabel: string;
  firmwareVersion: string;
  health: DeviceHealth;
  linkState: DeviceLinkState;
  linkedUserEmail: string | null;
  linkedAt: string | null;
  lastSeenAt: string | null;
}

export interface ForecastPoint {
  timestamp: string;
  tempC: number;
  rainMm: number;
  condition: string;
}

export interface ForecastBundle {
  siteId: UUID;
  provider: string;
  fetchedAt: string;
  points: ForecastPoint[];
}

export interface IrrigationSession {
  id: UUID;
  plantId: UUID;
  startedAt: string;
  endedAt: string | null;
  requestedLiters: number;
  appliedLiters: number;
  trigger: 'AI' | 'MANUAL' | 'SYSTEM_SAFETY';
  status: 'queued' | 'running' | 'completed' | 'cancelled' | 'failed';
}

export interface ExplainableFactor {
  code:
    | 'MISSING_SOIL_SENSOR'
    | 'STALE_SENSOR_DATA'
    | 'DEVICE_OFFLINE'
    | 'RAIN_EXPECTED'
    | 'MOISTURE_BELOW_LOWER_BOUND'
    | 'MOISTURE_ABOVE_UPPER_BOUND'
    | 'WITHIN_HYSTERESIS_BAND'
    | 'RECENT_IRRIGATION_ACTIVE'
    | 'FORECAST_UNAVAILABLE'
    | 'SAFE_VOLUME_CAPPED';
  severity: 'info' | 'warning' | 'critical';
  message: string;
}

export interface DecisionComputation {
  currentMoisturePct: number | null;
  targetMoisturePct: number;
  estimatedDeficitLiters: number;
  recommendedLiters: number;
  forecastRainNext6hMm: number;
  forecastRainNext24hMm: number;
  sensorAgeMinutes: number | null;
}

export interface IrrigationRecommendation {
  plantId: UUID;
  generatedAt: string;
  action: RecommendationAction;
  confidence: 'low' | 'medium' | 'high';
  recommendedLiters: number;
  rationale: string;
  factors: ExplainableFactor[];
  computation: DecisionComputation;
  nextReviewAt: string;
  requiresHumanReview: boolean;
}

export interface DecisionAuditEvent {
  id: UUID;
  plantId: UUID;
  eventType: 'RECOMMENDATION_GENERATED';
  createdAt: string;
  payload: IrrigationRecommendation;
}

export interface DeviceLinkResult {
  machineCode: string;
  deviceName: string;
  linkedUserEmail: string;
  linkState: DeviceLinkState;
  linkedAt: string;
  health: DeviceHealth;
  zoneLabel: string;
}

export interface UserAccount {
  email: string;
  displayName: string;
  status: UserStatus;
  storeFrozen: boolean;
}

export interface ProductCatalogItem {
  id: string;
  name: string;
  category: string;
  productType: 'device' | 'sensor' | 'controller' | 'accessory' | 'expansion';
  deviceTier?: DeviceTier;
  priceVnd: number;
  stock: number;
  active: boolean;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productType: ProductCatalogItem['productType'];
  deviceTier?: DeviceTier;
  priceVnd: number;
  quantity: number;
}

export interface DeviceInventoryItem {
  machineCode: string;
  deviceName: string;
  tier: DeviceTier;
  slotLimit: number;
  inventoryStatus: DeviceLifecycleStatus;
  ownerEmail: string | null;
  linkedUserEmail: string | null;
  linkedAt: string | null;
  orderId: string | null;
  codeRevealedAt: string | null;
  health: DeviceHealth;
  firmwareVersion: string;
  zoneLabel: string;
  lastSeenAt: string | null;
  isDemoCode: boolean;
}

export interface CommerceOrder {
  id: string;
  userEmail: string;
  createdAt: string;
  customerName: string;
  phone: string;
  address: string;
  note: string;
  items: OrderItem[];
  totalVnd: number;
  status: OrderStatus;
  devicesIssuedAt: string | null;
}

export interface PurchaseRiskEvent {
  id: string;
  userEmail: string;
  createdAt: string;
  status: 'open' | 'reviewed' | 'dismissed';
  type: 'DAILY_PURCHASE_CAP_EXCEEDED';
  reason: string;
  currentSpendVnd: number;
  attemptedSpendVnd: number;
}

export interface ModerationAction {
  id: string;
  userEmail: string;
  actorEmail: string;
  createdAt: string;
  action: 'STORE_FREEZE' | 'SUSPEND' | 'BAN' | 'RESTORE';
  reason: string;
}

export interface PlantCreationVerification {
  machineCode: string;
  deviceName: string;
  tier: DeviceTier;
  slotLimit: number;
  usedSlots: number;
  remainingSlots: number;
  inventoryStatus: DeviceLifecycleStatus;
}

export interface PlantCreateRequest {
  ownerUserEmail: string;
  machineCode: string;
  displayName: string;
  plantType: string;
  soilType: SoilType;
  locationType: LocationType;
  rootZoneVolumeLiters: number;
  potAreaM2: number;
  cropCoefficient: number;
  moistureTargetPct: number;
  moistureLowerBoundPct: number;
  moistureUpperBoundPct: number;
  rainDelayThresholdMm: number;
  maxSingleIrrigationLiters: number;
  minSensorFreshnessMinutes: number;
  isSimulated?: boolean;
}

export interface DeviceLifecycleActionResult {
  machineCode: string;
  inventoryStatus: DeviceLifecycleStatus;
  linkedUserEmail: string | null;
  ownerEmail: string | null;
}
