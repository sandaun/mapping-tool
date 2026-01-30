/**
 * Map Modbus register type to read/write function codes
 */
export function getModbusFunctions(
  registerType: string,
  isReadable: boolean,
  isWritable: boolean,
): { read: string; write: string } {
  if (registerType === 'Coil') {
    return {
      read: isReadable ? '1: Read Coils' : '-',
      write: isWritable ? '5: Write Single Coil' : '-',
    };
  }

  if (registerType === 'DiscreteInput') {
    return {
      read: isReadable ? '2: Read Discrete Inputs' : '-',
      write: '-',
    };
  }

  if (registerType === 'InputRegister') {
    return {
      read: isReadable ? '4: Read Input Registers' : '-',
      write: '-',
    };
  }

  // HoldingRegister
  return {
    read: isReadable ? '3: Read Holding Registers' : '-',
    write: isWritable ? '6: Write Single Register' : '-',
  };
}

/**
 * Map BACnet object type to Modbus Read/Write code
 * 0: Read (INPUT types), 1: Trigger (OUTPUT types), 2: Read / Write (VALUE types)
 */
export function getModbusReadWrite(objectType: string): string {
  const isInput = objectType.endsWith('I');
  const isOutput = objectType.endsWith('O');
  const isValue = objectType.endsWith('V');

  if (isInput) return '0: Read';
  if (isOutput) return '1: Trigger';
  if (isValue) return '2: Read / Write';
  return '0: Read'; // fallback
}

/**
 * Map Modbus data type to Format code
 * 0: Unsigned, 1: Signed(C2), 2: Signed(C1), 3: Float, 4: BitFields
 */
export function getModbusFormat(
  dataType: string,
  registerType?: string,
  objectType?: string,
): string {
  // Coil/DiscreteInput have no format (use empty string)
  if (registerType === 'Coil' || registerType === 'DiscreteInput') {
    return '';
  }

  if (dataType.includes('Float') || /^f\d+$/i.test(dataType)) {
    return '3: Float';
  }
  if (/^int\d+$/i.test(dataType) || /^s\d+$/i.test(dataType)) {
    return '1: Signed(C2)';
  }
  // BV (Binary Value) → BitFields
  if (objectType === 'BV') return '4: BitFields';
  // BI, BO, altres Uint16 → Unsigned
  return '0: Unsigned';
}

/**
 * Calculate Modbus data length based on register type and data type
 * Returns '1', '16', or '32' as string
 */
export function calculateModbusDataLength(
  registerType: string,
  dataType: string,
): string {
  if (registerType === 'Coil' || registerType === 'DiscreteInput') {
    return '1';
  }
  if (/32/.test(dataType)) {
    return '32';
  }
  return '16';
}

/**
 * Get byte order for Modbus register
 * Coil/DiscreteInput have no byte order, registers use Big Endian
 */
export function getModbusByteOrder(registerType: string): string {
  if (registerType === 'Coil' || registerType === 'DiscreteInput') {
    return '';
  }
  return '0: Big Endian';
}
