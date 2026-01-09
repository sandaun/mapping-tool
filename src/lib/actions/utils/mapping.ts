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
