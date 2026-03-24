import type { DeviceLinkResult } from '../domain/models.js';
import type { DeviceRepository } from '../repositories/interfaces.js';

export class DeviceLinkService {
  constructor(private readonly deviceRepository: DeviceRepository) {}

  async linkDeviceToUser(userEmail: string, machineCode: string): Promise<DeviceLinkResult> {
    const device = await this.deviceRepository.getByMachineCode(machineCode);
    if (!device) {
      throw new Error('DEVICE_NOT_FOUND');
    }

    if (device.linkedUserEmail && device.linkedUserEmail !== userEmail) {
      throw new Error('DEVICE_OWNED_BY_OTHER');
    }

    device.linkedUserEmail = userEmail;
    device.linkState = 'linked';
    device.linkedAt = new Date().toISOString();

    await this.deviceRepository.save(device);

    return {
      machineCode: device.machineCode,
      deviceName: device.deviceName,
      linkedUserEmail: userEmail,
      linkState: device.linkState,
      linkedAt: device.linkedAt,
      health: device.health,
      zoneLabel: device.zoneLabel
    };
  }
}
