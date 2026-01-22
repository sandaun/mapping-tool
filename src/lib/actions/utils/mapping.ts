/**
 * Map Modbus dataType + registerType → BACnet objectType
 */
export function mapModbusToBACnetObjectType(
  dataType: string,
  registerType: string
): string {
  // Coils i DiscreteInput → Binary
  if (registerType === 'Coil' || registerType === 'DiscreteInput') {
    return 'BI';
  }

  // HoldingRegister / InputRegister segons dataType
  if (dataType.includes('Float') || dataType.includes('Int')) {
    return 'AI'; // Analog Input
  }

  // Fallback
  return 'AV'; // Analog Value
}

/**
 * Map BACnet objectType → Modbus registerType
 * Per Modbus Slave template: tots són HoldingRegister (16 o 32 bits)
 */
export function mapBACnetToModbusRegisterType(): string {
  // Tots els objectes BACnet → HoldingRegister
  // Binary es representa com Uint16 (16 bits), no com Coil
  return 'HoldingRegister';
}

/**
 * Map BACnet objectType → Modbus dataType
 * Binary → Uint16 (16-bit register, Format 0: Unsigned or 4: BitFields)
 * Analog → Float32 (32-bit floating point)
 * Multistate → Uint16 (16-bit unsigned integer)
 */
export function mapBACnetToModbusDataType(objectType: string): string {
  // Binary → Uint16 (HoldingRegister de 16 bits)
  if (objectType === 'BI' || objectType === 'BO' || objectType === 'BV') {
    return 'Uint16';
  }

  // Analog → Float32 (assumim floating point per defecte)
  if (objectType === 'AI' || objectType === 'AO' || objectType === 'AV') {
    return 'Float32';
  }

  // Multistate → Uint16
  if (objectType === 'MSI' || objectType === 'MSO' || objectType === 'MSV') {
    return 'Uint16';
  }

  return 'Float32';
}

/**
 * Map Modbus signal properties → KNX DPT (Data Point Type)
 * Strategy: Units-first (specific DPT), then fallback to generic type-based DPT
 *
 * @param signalType - Signal type: 'AI', 'AO', 'DI', 'DO', 'Multistate'
 * @param dataLength - Data length in bits (1, 16 or 32)
 * @param modbusDataType - Modbus data type (e.g., 'Float32', 'Int16', 'Uint16', 'Uint32')
 * @param units - Optional engineering units (e.g., '°C', 'kW', '%', 'lux')
 * @returns KNX DPT string with name (e.g., '1.001: switch', '9.001: temperature (°C)')
 */
export function modbusTypeToKNXDPT(
  signalType: 'AI' | 'AO' | 'DI' | 'DO' | 'Multistate',
  dataLength: number,
  modbusDataType: string,
  units?: string
): string {
  // Digital Input/Output → DPT 1.001 (Switch)
  if (signalType === 'DI' || signalType === 'DO') {
    return '1.001: switch';
  }

  // PRIORITY 1: Units-based mapping (most specific)
  if (units) {
    const unitsLower = units.toLowerCase().trim();

    // Temperature
    if (unitsLower === '°c' || unitsLower === 'c' || unitsLower === 'degc') {
      return '9.001: temperature (°C)';
    }
    if (unitsLower === '°f' || unitsLower === 'f' || unitsLower === 'degf') {
      return '9.027: temperature (°F)';
    }
    if (unitsLower === '°k' || unitsLower === 'k' || unitsLower === 'kelvin') {
      return '9.002: temperature difference (°K)';
    }

    // Power & Energy
    if (unitsLower === 'kw') {
      return '9.024: power (kW)';
    }
    if (unitsLower === 'w') {
      return '9.024: power (kW)'; // Use kW DPT, value will be scaled
    }
    if (unitsLower === 'kwh') {
      return '13.013: active energy (kWh)';
    }
    if (unitsLower === 'wh') {
      return '13.010: active energy (Wh)';
    }
    if (unitsLower === 'kvah') {
      return '13.014: apparent energy (kVAh)';
    }
    if (unitsLower === 'vah') {
      return '13.011: apparent energy (VAh)';
    }

    // Percentage
    if (unitsLower === '%' || unitsLower === 'percent') {
      if (modbusDataType.includes('Uint')) {
        return '5.001: percentage (0..100%)';
      }
      if (modbusDataType.includes('Int')) {
        return '6.001: percentage (-128..127%)';
      }
      return '9.007: percentage (%)'; // Float percentage
    }

    // Illuminance
    if (unitsLower === 'lux') {
      return '9.004: lux (Lux)';
    }

    // Pressure
    if (unitsLower === 'pa' || unitsLower === 'pascal') {
      return '9.006: pressure (Pa)';
    }

    // Speed
    if (unitsLower === 'm/s') {
      return '9.005: speed (m/s)';
    }
    if (unitsLower === 'km/h') {
      return '9.028: wind speed (km/h)';
    }

    // Flow
    if (unitsLower === 'l/h') {
      return '9.025: volume flow (l/h)';
    }
    if (unitsLower === 'm3/h') {
      return '13.002: flow rate (m3/h)';
    }
    if (unitsLower === 'l/s') {
      return '9.025: volume flow (l/h)'; // Convert to l/h
    }

    // Voltage & Current
    if (unitsLower === 'v') {
      return '14.027: electric potential (V)';
    }
    if (unitsLower === 'mv') {
      return '9.020: voltage (mV)';
    }
    if (unitsLower === 'a') {
      return '14.019: electric current (A)';
    }
    if (unitsLower === 'ma') {
      return '9.021: current (mA)';
    }

    // Time
    if (unitsLower === 'sec' || unitsLower === 's') {
      return '7.005: time (s)';
    }

    // PPM
    if (unitsLower === 'ppm') {
      return '9.008: parts/million (ppm)';
    }
  }

  // PRIORITY 2: Type-based fallback (generic)
  if (signalType === 'AI' || signalType === 'AO') {
    // Uint32 (4-byte unsigned integer) → DPT 12.001
    if (modbusDataType.includes('Uint32') || modbusDataType.includes('UInt32')) {
      return '12.001: counter pulses (unsigned)';
    }

    // Int32 (4-byte signed integer) → DPT 13.001
    if (modbusDataType.includes('Int32')) {
      return '13.001: counter pulses (signed)';
    }

    // Float32 (4-byte floating point)
    if (modbusDataType.includes('Float32') || dataLength === 32) {
      return '9.001: temperature (°C)'; // Generic 2-byte float (most common)
    }

    // Int16 (2-byte signed integer)
    if (modbusDataType.includes('Int16') || modbusDataType.includes('Int')) {
      return '8.001: pulses difference';
    }

    // Uint16 (2-byte unsigned integer)
    if (modbusDataType.includes('Uint16') || modbusDataType.includes('UInt16')) {
      return '7.001: pulses';
    }

    // Default for analog: 2-byte float
    return '9.001: temperature (°C)';
  }

  // Multistate → DPT 5.010 (unsigned 8-bit, 0-255)
  if (signalType === 'Multistate') {
    return '5.010: counter pulses (0..255)';
  }

  // Fallback
  return '9.001: temperature (°C)';
}

/**
 * Map BACnet objectType + units → KNX DPT (Data Point Type)
 * Strategy: Units-first (specific DPT), then fallback to objectType-based DPT
 *
 * @param objectType - BACnet object type: 'AI', 'AO', 'AV', 'BI', 'BO', 'BV', 'MSI', 'MSO', 'MSV'
 * @param units - Optional engineering units (e.g., '°C', 'kW', '%', 'lux')
 * @returns KNX DPT string with name (e.g., '1.001: switch', '9.001: temperature (°C)')
 */
export function bacnetTypeToKNXDPT(objectType: string, units?: string): string {
  // Binary Input/Output/Value → DPT 1.001 (Switch)
  if (objectType === 'BI' || objectType === 'BO' || objectType === 'BV') {
    return '1.001: switch';
  }

  // PRIORITY 1: Units-based mapping (most specific)
  if (units) {
    const unitsLower = units.toLowerCase().trim();

    // Temperature
    if (unitsLower === '°c' || unitsLower === 'c' || unitsLower === 'degc') {
      return '9.001: temperature (°C)';
    }
    if (unitsLower === '°f' || unitsLower === 'f' || unitsLower === 'degf') {
      return '9.027: temperature (°F)';
    }
    if (unitsLower === '°k' || unitsLower === 'k' || unitsLower === 'kelvin') {
      return '9.002: temperature difference (°K)';
    }

    // Power & Energy
    if (unitsLower === 'kw') {
      return '9.024: power (kW)';
    }
    if (unitsLower === 'w') {
      return '9.024: power (kW)';
    }
    if (unitsLower === 'kwh') {
      return '13.013: active energy (kWh)';
    }
    if (unitsLower === 'wh') {
      return '13.010: active energy (Wh)';
    }
    if (unitsLower === 'kvah') {
      return '13.014: apparent energy (kVAh)';
    }
    if (unitsLower === 'vah') {
      return '13.011: apparent energy (VAh)';
    }

    // Percentage
    if (unitsLower === '%' || unitsLower === 'percent') {
      return '5.001: percentage (0..100%)'; // Analog value percentage
    }

    // Illuminance
    if (unitsLower === 'lux') {
      return '9.004: lux (Lux)';
    }

    // Pressure
    if (unitsLower === 'pa' || unitsLower === 'pascal') {
      return '9.006: pressure (Pa)';
    }

    // Speed
    if (unitsLower === 'm/s') {
      return '9.005: speed (m/s)';
    }
    if (unitsLower === 'km/h') {
      return '9.028: wind speed (km/h)';
    }

    // Flow
    if (unitsLower === 'l/h') {
      return '9.025: volume flow (l/h)';
    }
    if (unitsLower === 'm3/h') {
      return '13.002: flow rate (m3/h)';
    }
    if (unitsLower === 'l/s') {
      return '9.025: volume flow (l/h)';
    }

    // Voltage & Current
    if (unitsLower === 'v') {
      return '14.027: electric potential (V)';
    }
    if (unitsLower === 'mv') {
      return '9.020: voltage (mV)';
    }
    if (unitsLower === 'a') {
      return '14.019: electric current (A)';
    }
    if (unitsLower === 'ma') {
      return '9.021: current (mA)';
    }

    // Time
    if (unitsLower === 'sec' || unitsLower === 's') {
      return '7.005: time (s)';
    }

    // PPM
    if (unitsLower === 'ppm') {
      return '9.008: parts/million (ppm)';
    }
  }

  // PRIORITY 2: ObjectType-based fallback (generic)
  if (objectType === 'AI' || objectType === 'AO' || objectType === 'AV') {
    // Analog → Default 2-byte float (temperature-like)
    return '9.001: temperature (°C)';
  }

  // Multistate → DPT 5.010 (unsigned 8-bit, 0-255)
  if (objectType === 'MSI' || objectType === 'MSO' || objectType === 'MSV') {
    return '5.010: counter pulses (0..255)';
  }

  // Fallback
  return '9.001: temperature (°C)';
}

/**
 * Map KNX DPT → Modbus Data Type
 * Used for generating Modbus columns from KNX signals (ETS import)
 *
 * @param dpt - KNX DPT code (e.g., "1.001", "9.001")
 * @returns Modbus data type (Uint16, Int16, Float32)
 */
export function knxDPTToModbusDataType(dpt: string): string {
  const main = dpt.split('.')[0];

  // DPT 1.x (1-bit boolean) → Uint16 (stored in 16-bit register)
  if (main === '1') return 'Uint16';

  // DPT 5.x, 6.x, 7.x, 8.x (8-bit unsigned/signed) → Uint16 or Int16
  if (main === '5' || main === '7') return 'Uint16';
  if (main === '6' || main === '8') return 'Int16';

  // DPT 9.x (16-bit float), 12.x, 13.x → Float32
  if (main === '9' || main === '12' || main === '13') return 'Float32';

  // DPT 20.x (HVAC mode, enum) → Uint16
  if (main === '20') return 'Uint16';

  // Fallback: Float32 for analog values
  return 'Float32';
}

/**
 * Map KNX DPT → Modbus Data Length (bits)
 *
 * @param dpt - KNX DPT code
 * @returns Data length: "16" or "32"
 */
export function knxDPTToModbusDataLength(dpt: string): string {
  const dataType = knxDPTToModbusDataType(dpt);
  return dataType === 'Float32' ? '32' : '16';
}

/**
 * Map KNX DPT → Modbus Format
 *
 * @param dpt - KNX DPT code
 * @returns Modbus format code (e.g., "0: Unsigned", "3: Float")
 */
export function knxDPTToModbusFormat(dpt: string): string {
  const dataType = knxDPTToModbusDataType(dpt);

  if (dataType === 'Uint16') return '0: Unsigned';
  if (dataType === 'Int16') return '1: Signed (C2)';
  if (dataType === 'Float32') return '3: Float';

  return '0: Unsigned';
}

/**
 * Map KNX DPT → BACnet Object Type
 * Used for generating BACnet Server columns from KNX signals (ETS import)
 *
 * @param dpt - KNX DPT code (e.g., "1.001", "9.001")
 * @returns BACnet object type (AI, AO, AV, BI, BO, BV)
 */
export function knxDPTToBACnetType(dpt: string): string {
  const main = dpt.split('.')[0];

  // DPT 1.x (1-bit boolean) → Binary Value (read/write by default)
  if (main === '1') return 'BV';

  // DPT 2.x, 3.x (control) → Binary Value
  if (main === '2' || main === '3') return 'BV';

  // DPT 5.x, 6.x, 7.x, 8.x (8-bit) → Analog Value
  if (main === '5' || main === '6' || main === '7' || main === '8') return 'AV';

  // DPT 9.x (16-bit float - temperature, etc.) → Analog Value
  if (main === '9') return 'AV';

  // DPT 12.x, 13.x (32-bit) → Analog Value
  if (main === '12' || main === '13') return 'AV';

  // DPT 14.x (32-bit float) → Analog Value
  if (main === '14') return 'AV';

  // DPT 16.x (string) → Multistate Value
  if (main === '16') return 'MSV';

  // DPT 20.x (HVAC mode, enum) → Multistate Value
  if (main === '20') return 'MSV';

  // Fallback: Analog Value for unknown types
  return 'AV';
}

/**
 * Map KNX DPT to BACnet Units code
 * @param dpt - KNX DPT code (e.g., "1.001", "9.001")
 * @returns BACnet unit code (numeric string) or "-1" for not applicable
 */
export function knxDPTToBACnetUnits(dpt: string): string {
  // Binary types have no units
  if (dpt.startsWith('1.')) return '-1';
  if (dpt.startsWith('2.')) return '-1';
  if (dpt.startsWith('3.')) return '-1';
  if (dpt.startsWith('20.')) return '-1';

  // Map specific DPTs to BACnet unit codes
  // Temperature
  if (dpt === '9.001' || dpt === '14.068') return '62'; // degrees_Celsius
  if (dpt === '9.002' || dpt === '14.070') return '63'; // degrees_Kelvin
  if (dpt === '9.027') return '64'; // degrees_Fahrenheit

  // Percentage
  if (
    dpt === '5.001' ||
    dpt === '9.007' ||
    dpt === '5.004' ||
    dpt === '6.001' ||
    dpt === '8.010'
  )
    return '98'; // percent

  // Angle
  if (dpt === '5.003' || dpt === '14.007') return '2'; // degrees_angular
  if (dpt === '14.006') return '6'; // radians

  // Time
  if (dpt === '9.010' || dpt === '14.074') return '71'; // seconds
  if (dpt === '7.005' || dpt === '8.005' || dpt === '13.100') return '71'; // seconds
  if (dpt === '7.006' || dpt === '8.006') return '72'; // minutes
  if (dpt === '7.007' || dpt === '8.007') return '73'; // hours
  if (dpt === '9.011') return '159'; // milliseconds
  if (dpt === '7.002' || dpt === '8.002') return '159'; // milliseconds

  // Pressure
  if (dpt === '9.006' || dpt === '14.058') return '53'; // pascals

  // Illumination
  if (dpt === '9.004') return '36'; // lux

  // Speed
  if (dpt === '9.005' || dpt === '14.065') return '74'; // meters_per_second
  if (dpt === '9.028') return '76'; // kilometers_per_hour

  // Power
  if (dpt === '9.024') return '48'; // kilowatts
  if (dpt === '14.056') return '47'; // watts

  // Voltage
  if (dpt === '9.020' || dpt === '14.027' || dpt === '14.028') return '72'; // volts
  if (dpt === '14.027') return '74'; // millivolts

  // Current
  if (dpt === '7.012' || dpt === '9.021') return '5'; // milliamperes
  if (dpt === '14.019') return '1'; // amperes

  // Energy
  if (dpt === '13.010') return '18'; // watt_hours
  if (dpt === '13.013') return '19'; // kilowatt_hours
  if (dpt === '13.011') return '20'; // volt_ampere_hours
  if (dpt === '13.014') return '132'; // kilovolt_ampere_hours
  if (dpt === '13.012') return '21'; // volt_ampere_reactive_hours
  if (dpt === '13.015') return '133'; // kilovolt_ampere_reactive_hours

  // Volume flow
  if (dpt === '9.025') return '90'; // liters_per_hour
  if (dpt === '13.002') return '142'; // cubic_meters_per_hour
  if (dpt === '14.077') return '88'; // cubic_meters_per_second

  // Luminous
  if (dpt === '14.042') return '38'; // lumens
  if (dpt === '14.043') return '35'; // candelas

  // Frequency
  if (dpt === '14.033') return '27'; // hertz

  // Force
  if (dpt === '14.032') return '158'; // newtons

  // Area
  if (dpt === '14.010') return '0'; // square_meters

  // Volume
  if (dpt === '14.076') return '87'; // cubic_meters

  // Mass
  if (dpt === '14.051') return '39'; // kilograms

  // Density
  if (dpt === '14.017') return '122'; // kilograms_per_cubic_meter

  // Default: no_units
  return '95';
}

/**
 * Get BACnet field values based on object type
 * @param type - BACnet object type (AI, AO, AV, BI, BO, BV, MSI, MSO, MSV)
 * @param dpt - KNX DPT code for units mapping
 * @returns Object with units, states, relDef, cov field values
 */
export function getBACnetFieldsByType(
  type: string,
  dpt: string
): {
  units: string;
  states: string;
  relDef: string;
  cov: string;
} {
  const baseType = type.substring(0, type.length - 1); // Remove I/O/V suffix

  switch (baseType) {
    case 'A': // Analog (AI, AO, AV)
      return {
        units: knxDPTToBACnetUnits(dpt),
        states: '-',
        relDef: type === 'AO' ? '0' : '-',
        cov: '0',
      };

    case 'B': // Binary (BI, BO, BV)
      return {
        units: '-1',
        states: '2',
        relDef: type === 'BO' ? '0' : '-',
        cov: '-',
      };

    case 'MS': // Multistate (MSI, MSO, MSV)
      return {
        units: '-1',
        states: '65535',
        relDef: type === 'MSO' ? '1' : '-',
        cov: '-',
      };

    default:
      return {
        units: '-',
        states: '-',
        relDef: '-',
        cov: '-',
      };
  }
}
