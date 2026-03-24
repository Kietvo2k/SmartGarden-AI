import type {
  DeviceLifecycleActionResult,
  PlantCreateRequest,
  PlantCreationVerification,
  PlantProfile
} from '../domain/models.js';
import type { DeviceInventoryRepository, PlantRepository } from '../repositories/interfaces.js';

export class PlantProvisioningService {
  constructor(
    private readonly plantRepository: PlantRepository,
    private readonly deviceInventoryRepository: DeviceInventoryRepository
  ) {}

  async verifyMachineCodeForPlant(userEmail: string, machineCode: string, existingPlantId?: string | null): Promise<PlantCreationVerification> {
    const device = await this.deviceInventoryRepository.getByMachineCode(machineCode);
    if (!device) throw new Error('DEVICE_NOT_FOUND');
    if (device.ownerEmail !== userEmail) throw new Error('DEVICE_NOT_OWNED');
    if (device.linkedUserEmail !== userEmail) throw new Error('DEVICE_NOT_VERIFIED');
    if (['locked', 'inactive', 'removed'].includes(device.inventoryStatus)) throw new Error(`DEVICE_${device.inventoryStatus.toUpperCase()}`);

    const plants = await this.plantRepository.listByOwner(userEmail);
    const usedSlots = plants.filter(plant => plant.deviceMachineCode === machineCode && plant.id !== existingPlantId).length;
    if (usedSlots >= device.slotLimit) throw new Error('DEVICE_SLOT_EXCEEDED');

    return {
      machineCode: device.machineCode,
      deviceName: device.deviceName,
      tier: device.tier,
      slotLimit: device.slotLimit,
      usedSlots,
      remainingSlots: Math.max(0, device.slotLimit - usedSlots),
      inventoryStatus: device.inventoryStatus
    };
  }

  async createPlant(input: PlantCreateRequest): Promise<PlantProfile> {
    await this.verifyMachineCodeForPlant(input.ownerUserEmail, input.machineCode);
    const now = new Date().toISOString();
    const plant: PlantProfile = {
      id: `plant_${Date.now()}`,
      siteId: input.machineCode,
      ownerUserEmail: input.ownerUserEmail,
      deviceMachineCode: input.machineCode,
      isSimulated: input.isSimulated ?? false,
      sourceLabel: input.isSimulated ? 'simulated_scan' : 'device_linked',
      displayName: input.displayName,
      plantType: input.plantType,
      soilType: input.soilType,
      locationType: input.locationType,
      rootZoneVolumeLiters: input.rootZoneVolumeLiters,
      potAreaM2: input.potAreaM2,
      cropCoefficient: input.cropCoefficient,
      moistureTargetPct: input.moistureTargetPct,
      moistureLowerBoundPct: input.moistureLowerBoundPct,
      moistureUpperBoundPct: input.moistureUpperBoundPct,
      rainDelayThresholdMm: input.rainDelayThresholdMm,
      maxSingleIrrigationLiters: input.maxSingleIrrigationLiters,
      minSensorFreshnessMinutes: input.minSensorFreshnessMinutes,
      createdAt: now,
      updatedAt: now
    };

    await this.plantRepository.save(plant);
    return plant;
  }

  async applyDeviceLifecycle(machineCode: string, actorEmail: string, action: 'deactivate' | 'activate' | 'disconnect' | 'remove' | 'lock'): Promise<DeviceLifecycleActionResult> {
    const device = await this.deviceInventoryRepository.getByMachineCode(machineCode);
    if (!device) throw new Error('DEVICE_NOT_FOUND');

    if (action === 'deactivate') device.inventoryStatus = 'inactive';
    if (action === 'activate') device.inventoryStatus = 'owned';
    if (action === 'disconnect') {
      device.linkedUserEmail = null;
      device.linkedAt = null;
    }
    if (action === 'remove') {
      device.inventoryStatus = 'removed';
      device.linkedUserEmail = null;
      device.linkedAt = null;
    }
    if (action === 'lock') device.inventoryStatus = 'locked';

    await this.deviceInventoryRepository.save(device);
    return {
      machineCode: device.machineCode,
      inventoryStatus: device.inventoryStatus,
      linkedUserEmail: device.linkedUserEmail,
      ownerEmail: device.ownerEmail
    };
  }
}
