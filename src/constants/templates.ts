import type { Template } from '@/types/page.types';

export const TEMPLATES = [
  {
    id: 'bacnet-server__modbus-master',
    label: 'BACnet Server → Modbus Master',
    href: '/templates/bacnet-server-to-modbus-master.xlsx',
    expectedSheets: ['Signals', 'BACnet Server', 'Conversions'],
    promptText: `Convert the following Modbus device register map into CSV format with these exact columns:

deviceId,signalName,registerType,address,dataType,units,description

Column descriptions:
- deviceId: unique device identifier (e.g., METER01, HVAC01)
- signalName: signal name (e.g., ActivePower, Temperature)
- registerType: HoldingRegister, InputRegister, Coil, or DiscreteInput
- address: Modbus register address (integer)
- dataType: Int16, Uint16, Float32, Int32, etc.
- units: engineering units (kW, V, °C, %, etc.)
- description: human-readable description

[Paste your device register map here]

Output only the CSV with the exact column names above, no explanations.`,
  },
  {
    id: 'modbus-slave__bacnet-client',
    label: 'Modbus Slave → BACnet Client',
    href: '/templates/modbus-slave-to-bacnet-client.xlsx',
    expectedSheets: ['Signals', 'Conversions'],
    promptText: `Convert the following BACnet point list into CSV format with these exact columns:

deviceId,signalName,objectType,instance,units,description

Column descriptions:
- deviceId: unique device identifier (e.g., T01, CTRL02)
- signalName: signal name (e.g., RoomTemperature, Setpoint)
- objectType: AI, AO, AV, BI, BO, BV, MSI, MSO, or MSV
- instance: BACnet object instance number (integer)
- units: engineering units (°C, %, kW, etc.)
- description: human-readable description

[Paste your BACnet point list here]

Output only the CSV with the exact column names above, no explanations.`,
  },
  {
    id: 'knx__modbus-master',
    label: 'KNX → Modbus Master',
    href: '/templates/knx-to-modbus-master.xlsx',
    expectedSheets: ['Signals', 'Conversions'],
    promptText: `Convert the following Modbus device register map into CSV format with these exact columns:

deviceId,signalName,registerType,address,dataType,units,description

Column descriptions:
- deviceId: unique device identifier (e.g., METER01, HVAC01)
- signalName: signal name (e.g., ActivePower, Temperature)
- registerType: HoldingRegister, InputRegister, Coil, or DiscreteInput
- address: Modbus register address (integer)
- dataType: Int16, Uint16, Float32, Int32, etc.
- units: engineering units (kW, V, °C, %, etc.)
- description: human-readable description

[Paste your device register map here]

Output only the CSV with the exact column names above, no explanations.`,
  },
] as const;
