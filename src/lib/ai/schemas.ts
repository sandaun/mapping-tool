// AI Schemas for structured output from LLM parsing
// These mirror the DeviceSignal types with added confidence scoring
// NOTE: OpenAI Structured Outputs require all fields to be required.
// We use .nullable() to allow null values for optional fields.

import { z } from 'zod';

export const ModbusSignalSchema = z.object({
  deviceId: z
    .string()
    .describe(
      'Unique device identifier (e.g., METER01, HVAC01). Create logical IDs based on device type.',
    ),
  signalName: z
    .string()
    .describe(
      'Signal name (e.g., ActivePower, Temperature, Setpoint). Use clear, descriptive names.',
    ),
  registerType: z
    .enum(['HoldingRegister', 'InputRegister', 'Coil', 'DiscreteInput'])
    .describe('Modbus register type'),
  address: z
    .number()
    .int()
    .min(0)
    .describe('Modbus register address (0-based integer)'),
  dataType: z
    .enum(['Int16', 'Uint16', 'Int32', 'Uint32', 'Float32', 'Int64', 'Uint64'])
    .describe(
      'Data type. Normalize to standard format: s16→Int16, u16→Uint16, s32→Int32, u32→Uint32, f32→Float32',
    ),
  units: z
    .string()
    .nullable()
    .describe(
      'Engineering units if available (kW, V, °C, %, Hz, A, etc.). Set to null if not available.',
    ),
  description: z
    .string()
    .nullable()
    .describe(
      'Human-readable description of the signal. Set to null if not available.',
    ),
  mode: z
    .enum(['R', 'W', 'R/W'])
    .nullable()
    .describe(
      'Read/Write mode: R (read-only), W (write-only), R/W (read-write). Set to null if not specified.',
    ),
  factor: z
    .number()
    .nullable()
    .describe(
      'Scaling factor if mentioned (e.g., 10, 100, 1000, 0.1). Set to null if not specified.',
    ),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('Confidence score from 0 to 1 based on clarity of source data'),
});

export const BACnetSignalSchema = z.object({
  deviceId: z
    .string()
    .describe(
      'Unique device identifier (e.g., T01, CTRL02, HVAC01). Create logical IDs based on device type.',
    ),
  signalName: z
    .string()
    .describe(
      'Signal name (e.g., RoomTemperature, Setpoint, FanSpeed). Use clear, descriptive names.',
    ),
  objectType: z
    .enum(['AI', 'AO', 'AV', 'BI', 'BO', 'BV', 'MSI', 'MSO', 'MSV'])
    .describe(
      'BACnet object type. AI=Analog Input, AO=Analog Output, AV=Analog Value, BI=Binary Input, BO=Binary Output, BV=Binary Value, MSI=Multi-state Input, MSO=Multi-state Output, MSV=Multi-state Value',
    ),
  instance: z
    .number()
    .int()
    .min(0)
    .describe('BACnet object instance number (0-based integer)'),
  units: z
    .string()
    .nullable()
    .describe(
      'Engineering units if available (°C, %, kW, ppm, etc.). Set to null if not available.',
    ),
  description: z
    .string()
    .nullable()
    .describe(
      'Human-readable description of the signal. Set to null if not available.',
    ),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('Confidence score from 0 to 1 based on clarity of source data'),
});

export const KNXSignalSchema = z.object({
  signalName: z
    .string()
    .describe('Signal name/description from ETS or documentation'),
  groupAddress: z
    .string()
    .describe(
      'KNX group address in format X/X/X (e.g., 2/1/0, 5/1/5). Must be three levels separated by slashes.',
    ),
  dpt: z
    .string()
    .describe(
      'Data Point Type in standard format (e.g., 1.001, 9.001). Normalize from DPST-1-1 format to 1.001 format.',
    ),
  description: z
    .string()
    .nullable()
    .describe(
      'Full hierarchical path or additional description if available. Set to null if not available.',
    ),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('Confidence score from 0 to 1 based on clarity of source data'),
});

// Schema wrappers for the AI response
export const ModbusSignalsResponseSchema = z.object({
  signals: z
    .array(ModbusSignalSchema)
    .describe('Array of extracted Modbus signals'),
});

export const BACnetSignalsResponseSchema = z.object({
  signals: z
    .array(BACnetSignalSchema)
    .describe('Array of extracted BACnet signals'),
});

export const KNXSignalsResponseSchema = z.object({
  signals: z.array(KNXSignalSchema).describe('Array of extracted KNX signals'),
});

// Type exports
export type AIModbusSignal = z.infer<typeof ModbusSignalSchema>;
export type AIBACnetSignal = z.infer<typeof BACnetSignalSchema>;
export type AIKNXSignal = z.infer<typeof KNXSignalSchema>;

export type AIExtractedSignals =
  | { type: 'modbus'; signals: AIModbusSignal[] }
  | { type: 'bacnet'; signals: AIBACnetSignal[] }
  | { type: 'knx'; signals: AIKNXSignal[] };
