import type { RawWorkbook } from '@/lib/excel/raw';

export type ProtocolsMetadata = {
  internalProtocol: string | null;
  externalProtocol: string | null;
};

export type ImportResponse = {
  raw: RawWorkbook;
  protocols: ProtocolsMetadata;
};

export type TemplateId =
  | 'bacnet-server__modbus-master'
  | 'modbus-slave__bacnet-client'
  | 'knx__modbus-master'
  | 'knx__bacnet-client'
  | 'modbus-slave__knx';

export type Template = {
  id: TemplateId;
  label: string;
  href: string;
  expectedSheets: readonly string[];
  promptText: string;
};
