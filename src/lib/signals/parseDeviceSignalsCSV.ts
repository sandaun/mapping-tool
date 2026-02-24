import { ParseResult } from '../../types/signals';
import { parseModbusCSV } from './parsers/parseModbusCSV';
import { parseBacnetCSV } from './parsers/parseBacnetCSV';
import { parseKnxEtsCSV } from './parsers/parseKnxEtsCSV';

// Valid gateway types based on UI/logic
export type GatewayType =
  | 'bacnet-server__modbus-master'
  | 'modbus-slave__bacnet-client'
  | 'knx__modbus-master'
  | 'knx__bacnet-client'
  | 'modbus-slave__knx'
  | 'bacnet-server__knx';

type Protocol = 'modbus' | 'bacnet' | 'knx';
type ParserFn = (csvText: string) => ParseResult;

const PARSERS: Record<Protocol, ParserFn> = {
  modbus: parseModbusCSV,
  bacnet: parseBacnetCSV,
  knx: parseKnxEtsCSV,
};

function getExpectedProtocol(gatewayType: GatewayType): Protocol | null {
  if (
    gatewayType === 'modbus-slave__knx' ||
    gatewayType === 'bacnet-server__knx'
  ) {
    return 'knx';
  }

  if (
    gatewayType === 'bacnet-server__modbus-master' ||
    gatewayType === 'knx__modbus-master'
  ) {
    return 'modbus';
  }

  if (
    gatewayType === 'modbus-slave__bacnet-client' ||
    gatewayType === 'knx__bacnet-client'
  ) {
    return 'bacnet';
  }

  return null;
}

export function parseDeviceSignalsCSV(
  csvText: string,
  gatewayType: GatewayType,
): ParseResult {
  const protocol = getExpectedProtocol(gatewayType);

  if (!protocol) {
    return {
      signals: [],
      warnings: [`Unsupported gateway type for CSV parsing: ${gatewayType}`],
    };
  }

  const parserFn = PARSERS[protocol];
  return parserFn(csvText);
}
