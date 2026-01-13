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
 * @param dataType - Signal type: 'AI', 'AO', 'DI', 'DO', 'Multistate'
 * @param dataLength - Data length in bits (16 or 32)
 * @param format - Modbus format (e.g., 'Float32', 'Int16', 'Uint16', 'Uint8')
 * @param units - Optional engineering units (e.g., '°C', 'kW', '%', 'lux')
 * @returns KNX DPT string with name (e.g., '1.001: switch', '9.001: temperature (°C)')
 */
export function modbusTypeToKNXDPT(
  dataType: 'AI' | 'AO' | 'DI' | 'DO' | 'Multistate',
  dataLength: number,
  format: string,
  units?: string
): string {
  // Import formatDPT from constants (will be used at the end)
  // For now, we'll import it in the function scope

  // Digital Input/Output → DPT 1.001 (Switch)
  if (dataType === 'DI' || dataType === 'DO') {
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
      if (format === 'Uint16' || format === 'Uint8') {
        return '5.001: percentage (0..100%)';
      }
      if (format === 'Int16' || format === 'Int8') {
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
    if (unitsLower === 'mv') {
      return '9.020: voltage (mV)';
    }
    if (unitsLower === 'ma') {
      return '9.021: current (mA)';
    }

    // PPM
    if (unitsLower === 'ppm') {
      return '9.008: parts/million (ppm)';
    }
  }

  // PRIORITY 2: Type-based fallback (generic)
  if (dataType === 'AI' || dataType === 'AO') {
    // Float32 (4-byte floating point)
    if (format === 'Float32' || dataLength === 32) {
      return '9.001: temperature (°C)'; // Generic 2-byte float (most common)
    }

    // Int16 (2-byte signed integer)
    if (format === 'Int16' || format === 'Int') {
      return '8.001: pulses difference';
    }

    // Uint16 (2-byte unsigned integer)
    if (format === 'Uint16' || format === 'UInt16') {
      return '7.001: pulses';
    }

    // Default for analog: 2-byte float
    return '9.001: temperature (°C)';
  }

  // Multistate → DPT 5.010 (unsigned 8-bit, 0-255)
  if (dataType === 'Multistate') {
    return '5.010: counter pulses (0..255)';
  }

  // Fallback
  return '9.001: temperature (°C)';
}
