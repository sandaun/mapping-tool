import type { Template } from '@/types/page.types';

export const TEMPLATES = [
  {
    id: 'bacnet-server__modbus-master',
    label: 'BACnet Server → Modbus Master',
    href: '/templates/IN-BAC-MBM.ibmaps',
    baseXlsxHref: '/templates/bacnet-server-to-modbus-master.xlsx',
    expectedSheets: ['Signals', 'BACnet Server', 'Conversions'],
    promptText: `Convert the following Modbus device register map into CSV format with these exact columns:

deviceId,signalName,registerType,address,dataType,units,description

Column descriptions:
- deviceId: unique device identifier (e.g., METER01, HVAC01)
- signalName: signal name (e.g., ActivePower, Temperature)
- registerType: HoldingRegister, InputRegister, Coil, or DiscreteInput
- address: Modbus register address (integer)
- dataType: normalize to Int16, Uint16, Int32, Uint32, Float32, etc.
  (e.g., s16→Int16, u16→Uint16, s32→Int32, u32→Uint32, f32→Float32)
- Optional extra columns (append after description if available):
- mode: R (read-only), W (write-only), or R/W (read-write)
- factor: scaling factor (e.g., 10, 100, 1000)
- units: engineering units (kW, V, °C, %, etc.)
- description: human-readable description

[Paste your device register map here]

Output only the CSV with the exact column names above, no explanations.`,
  },
  {
    id: 'modbus-slave__bacnet-client',
    label: 'Modbus Slave → BACnet Client',
    href: '/templates/modbus-slave-to-bacnet-client.xlsx',
    baseXlsxHref: undefined,
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
    href: '/templates/IN-KNX-MBM.ibmaps',
    baseXlsxHref: '/templates/knx-to-modbus-master.xlsx',
    expectedSheets: ['Signals', 'Conversions'],
    promptText: `Convert the following Modbus device register map into CSV format with these exact columns:

deviceId,signalName,registerType,address,dataType,units,description

Column descriptions:
- deviceId: unique device identifier (e.g., METER01, HVAC01)
- signalName: signal name (e.g., ActivePower, Temperature)
- registerType: HoldingRegister, InputRegister, Coil, or DiscreteInput
- address: Modbus register address (integer)
- dataType: normalize to Int16, Uint16, Int32, Uint32, Float32, etc.
  (e.g., s16→Int16, u16→Uint16, s32→Int32, u32→Uint32, f32→Float32)
- Optional extra columns (append after description if available):
- mode: R (read-only), W (write-only), or R/W (read-write)
- factor: scaling factor (e.g., 10, 100, 1000)
- units: engineering units (kW, V, °C, %, etc.)
- description: human-readable description

[Paste your device register map here]

Output only the CSV with the exact column names above, no explanations.`,
  },
  {
    id: 'knx__bacnet-client',
    label: 'KNX → BACnet Client',
    href: '/templates/knx-to-bacnet-client.xlsx',
    baseXlsxHref: undefined,
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
    id: 'modbus-slave__knx',
    label: 'Modbus Slave → KNX',
    href: '/templates/modbus-slave-to-knx.xlsx',
    baseXlsxHref: undefined,
    expectedSheets: ['Signals', 'Conversions'],
    promptText: `This template generates Modbus Slave signals from a KNX project exported from ETS software.

IMPORTANT: Instead of providing device signals, paste the raw CSV export from ETS (Project → Export → Group Addresses).

The CSV should have this format:
"Function, Subfunction, Signal Name, Group Address, ..., DPT, ..."

Example:
"Clima, , ,""5/-/-"",..."
" ,""Sala - Menjador"", ,""5/1/-"",..."
" , ,""AC On/Off"",""5/1/0"","""","""","""",""DPST-1-1"",..."
" , ,""AC Temperatura Consigna"",""5/1/5"","""","""","""",""DPST-9-1"",..."

The system will:
- Parse KNX signals (Description, Group Address, DPT)
- Generate corresponding Modbus Slave registers automatically
- Assign sequential Modbus addresses starting from 0

[Paste your ETS CSV export here]`,
  },
  {
    id: 'bacnet-server__knx',
    label: 'BACnet Server → KNX',
    href: '/templates/bacnet-server-to-knx.xlsx',
    baseXlsxHref: undefined,
    expectedSheets: ['Signals', 'BACnet Server', 'KNX', 'Conversions'],
    promptText: `This template generates BACnet Server signals from a KNX project exported from ETS software.

IMPORTANT: Instead of providing device signals, paste the raw CSV export from ETS (Project → Export → Group Addresses).

The CSV should have this format:
"Function, Subfunction, Signal Name, Group Address, ..., DPT, ..."

Example:
"Clima, , ,""5/-/-"",..."
" ,""Sala - Menjador"", ,""5/1/-"",..."
" , ,""AC On/Off"",""5/1/0"","""","""","""",""DPST-1-1"",..."
" , ,""AC Temperatura Consigna"",""5/1/5"","""","""","""",""DPST-9-1"",..."

The system will:
- Parse KNX signals (Description, Group Address, DPT)
- Generate corresponding BACnet Server objects automatically
- Assign sequential BACnet instances starting from 0

[Paste your ETS CSV export here]`,
  },
] as const satisfies readonly Template[];
