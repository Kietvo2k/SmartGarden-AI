import { z } from 'zod';

export const plantIdSchema = z.string().min(1);
const numericValueSchema = z.preprocess(
  value => typeof value === 'string' ? Number(String(value).trim().replace(',', '.')) : value,
  z.number().finite()
);

const boundedNumericSchema = (minValue: number, maxValue?: number) =>
  maxValue === undefined
    ? numericValueSchema.refine(value => value >= minValue, `Value must be >= ${minValue}`)
    : numericValueSchema.refine(value => value >= minValue && value <= maxValue, `Value must be between ${minValue} and ${maxValue}`);

export const machineCodeSchema = z
  .string()
  .min(1, 'Machine code is required')
  .max(8, 'Machine code must be at most 8 characters')
  .regex(/^\d+$/, 'Machine code must contain only digits');

export const recommendationQuerySchema = z.object({
  plantId: plantIdSchema
});

export const deviceLinkBodySchema = z.object({
  userEmail: z.string().email(),
  machineCode: machineCodeSchema
});

export const checkoutBodySchema = z.object({
  userEmail: z.string().email(),
  customerName: z.string().min(1),
  phone: z.string().min(8),
  address: z.string().min(1),
  note: z.string().optional().default(''),
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().min(1)
  })).min(1)
});

export const orderStatusUpdateSchema = z.object({
  orderId: z.string().min(1),
  actorEmail: z.string().email(),
  status: z.enum(['pending_review', 'paid', 'fulfilled', 'completed', 'rejected', 'cancelled']),
  note: z.string().optional().default('')
});

export const verifyPlantMachineBodySchema = z.object({
  userEmail: z.string().email(),
  machineCode: machineCodeSchema,
  existingPlantId: z.string().optional().nullable()
});

export const createPlantBodySchema = z.object({
  ownerUserEmail: z.string().email(),
  machineCode: machineCodeSchema,
  displayName: z.string().min(1),
  plantType: z.string().min(1),
  soilType: z.enum(['sand', 'loam', 'clay', 'silt', 'peat', 'chalk', 'loamy_sand']),
  locationType: z.enum(['in_pot', 'in_soil']),
  rootZoneVolumeLiters: boundedNumericSchema(0.001),
  potAreaM2: boundedNumericSchema(0.0001),
  cropCoefficient: boundedNumericSchema(0.01),
  moistureTargetPct: boundedNumericSchema(0, 100),
  moistureLowerBoundPct: boundedNumericSchema(0, 100),
  moistureUpperBoundPct: boundedNumericSchema(0, 100),
  rainDelayThresholdMm: boundedNumericSchema(0),
  maxSingleIrrigationLiters: boundedNumericSchema(0),
  minSensorFreshnessMinutes: boundedNumericSchema(1),
  isSimulated: z.boolean().optional().default(false)
});

export const deviceLifecycleBodySchema = z.object({
  actorEmail: z.string().email(),
  reason: z.string().min(1),
  action: z.enum(['deactivate', 'activate', 'disconnect', 'remove', 'lock'])
});
