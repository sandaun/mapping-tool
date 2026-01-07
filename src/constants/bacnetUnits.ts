/**
 * BACnet Engineering Units (excerpt from BACnet standard)
 * Full list available in BACnet Server sheet of the Excel template
 */

export type BACnetUnitCode = number;

export interface BACnetUnit {
  code: BACnetUnitCode;
  name: string;
  description?: string;
}

// Common BACnet units
export const BACNET_UNITS: Record<string, BACnetUnit> = {
  NO_UNITS: { code: 95, name: 'no_units' },
  DEGREES_CELSIUS: {
    code: 62,
    name: 'degrees_Celsius',
    description: 'Temperature in Celsius',
  },
  DEGREES_FAHRENHEIT: {
    code: 64,
    name: 'degrees_Fahrenheit',
    description: 'Temperature in Fahrenheit',
  },
  PERCENT: {
    code: 98,
    name: 'percent_relative_humidity',
    description: 'Relative humidity %',
  },
  PARTS_PER_MILLION: {
    code: 96,
    name: 'parts_per_million',
    description: 'CO2, gas concentration',
  },
  PASCALS: { code: 53, name: 'pascals', description: 'Pressure' },
  BARS: { code: 55, name: 'bars', description: 'Pressure' },
  LITERS_PER_MINUTE: {
    code: 119,
    name: 'liters_per_minute',
    description: 'Flow rate',
  },
  CUBIC_METERS_PER_HOUR: {
    code: 135,
    name: 'cubic_meters_per_hour',
    description: 'Flow rate',
  },
  WATTS: { code: 132, name: 'watts', description: 'Power' },
  KILOWATTS: { code: 48, name: 'kilowatts', description: 'Power' },
  AMPERES: { code: 3, name: 'amperes', description: 'Electric current' },
  VOLTS: { code: 5, name: 'volts', description: 'Electric potential' },
  KILOVOLTS: { code: 6, name: 'kilovolts', description: 'Electric potential' },
  HERTZ: { code: 27, name: 'hertz', description: 'Frequency' },
  METERS: { code: 31, name: 'meters', description: 'Distance' },
  SQUARE_METERS: { code: 0, name: 'square_meters', description: 'Area' },
};

/**
 * Keywords for automatic unit detection based on signal names
 * Multi-language support: English, Spanish, Catalan
 */
export const UNIT_KEYWORDS: Record<string, BACnetUnitCode> = {
  // Temperature
  temperature: 62,
  temp: 62,
  temperatura: 62,
  celsius: 62,
  fahrenheit: 64,

  // Humidity
  humidity: 98,
  humid: 98,
  humedad: 98,
  humitat: 98,
  rh: 98,

  // CO2 / Air Quality
  co2: 96,
  ppm: 96,
  parts_per_million: 96,

  // Pressure
  pressure: 53,
  presion: 53,
  pressio: 53,
  pascal: 53,
  bar: 55,

  // Flow
  flow: 119,
  caudal: 119,
  cabal: 119,
  liters: 119,
  litres: 119,
  m3: 135,
  cubic: 135,

  // Power
  power: 132,
  potencia: 132,
  watt: 132,
  kw: 48,
  kilowatt: 48,

  // Electric Current
  current: 3,
  corriente: 3,
  corrent: 3,
  amp: 3,
  ampere: 3,

  // Voltage
  voltage: 5,
  volt: 5,
  tension: 5,
  tensio: 5,

  // Frequency
  frequency: 27,
  frecuencia: 27,
  freq: 27,
  hertz: 27,
  hz: 27,

  // Distance
  distance: 31,
  distancia: 31,
  meter: 31,
  metre: 31,
  metro: 31,
};

/**
 * Detect BACnet unit code from signal name using keyword matching
 * Returns 95 (no_units) if no match found
 */
export function detectUnitFromSignalName(signalName: string): BACnetUnitCode {
  const normalizedName = signalName.toLowerCase();

  // Check each keyword
  for (const [keyword, unitCode] of Object.entries(UNIT_KEYWORDS)) {
    if (normalizedName.includes(keyword)) {
      return unitCode;
    }
  }

  // Default: no units
  return BACNET_UNITS.NO_UNITS.code;
}
