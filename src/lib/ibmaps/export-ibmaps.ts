import { extractSignalsFromWorkbook } from "@/lib/overrides";
import type { RawWorkbook } from "@/lib/excel/raw";
import type { RawSheet } from "@/lib/excel/raw";
import type { Override } from "@/types/overrides";
import type { IbmapsState } from "@/hooks/useFileImport";
import { workbookRowsToRawSignals } from "@/lib/ibmaps/reverseAdapters/bac-mbm";
import { workbookRowsToKnxRawSignals } from "@/lib/ibmaps/reverseAdapters/knx-mbm";
import { workbookRowsToBACKNXSignals } from "@/lib/ibmaps/reverseAdapters/bac-knx";
import { workbookRowsToMBSKNXSignals } from "@/lib/ibmaps/reverseAdapters/mbs-knx";
import { workbookRowsToKNXBACSignals } from "@/lib/ibmaps/reverseAdapters/knx-bac";
import { workbookRowsToMBSBACSignals } from "@/lib/ibmaps/reverseAdapters/mbs-bac";
import { addModbusSignals_BAC_MBM } from "@/lib/ibmaps/generators/bac-mbm";
import { addModbusSignals_KNX_MBM } from "@/lib/ibmaps/generators/knx-mbm";
import { addKNXSignals_BAC_KNX } from "@/lib/ibmaps/generators/bac-knx";
import { addSignals_MBS_KNX } from "@/lib/ibmaps/generators/mbs-knx";
import { addSignals_KNX_BAC } from "@/lib/ibmaps/generators/knx-bac";
import { addSignals_MBS_BAC } from "@/lib/ibmaps/generators/mbs-bac";
import { parseIbmapsSignals_BAC_MBM } from "@/lib/ibmaps/parsers/bac-mbm";
import { parseIbmapsSignals_KNX_MBM } from "@/lib/ibmaps/parsers/knx-mbm";
import { parseIbmapsSignals_BAC_KNX } from "@/lib/ibmaps/parsers/bac-knx";
import { parseIbmapsSignals_MBS_KNX } from "@/lib/ibmaps/parsers/mbs-knx";
import { parseIbmapsSignals_KNX_BAC } from "@/lib/ibmaps/parsers/knx-bac";
import { parseIbmapsSignals_MBS_BAC } from "@/lib/ibmaps/parsers/mbs-bac";
import type {
  IbmapsDevice,
  RawSignal,
  KNXRawSignal,
  BACKNXRawSignal,
  MBSKNXRawSignal,
  KNXBACRawSignal,
  MBSBACRawSignal,
  BACnetClientDevice,
} from "@/lib/ibmaps/types";

// ---------------------------------------------------------------------------
// Filename mapping (shared between download-original and export-updated)
// ---------------------------------------------------------------------------

const IBMAPS_FILENAME: Record<string, string> = {
  "bacnet-server__modbus-master": "IN-BAC-MBM",
  "knx__modbus-master": "IN-KNX-MBM",
  "bacnet-server__knx": "IN-BAC-KNX",
  "modbus-slave__knx": "IN-MBS-KNX",
  "knx__bacnet-client": "IN-KNX-BAC",
  "modbus-slave__bacnet-client": "IN-MBS-BAC",
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ExportIbmapsParams {
  templateId: string;
  raw: RawWorkbook;
  originalIbmaps: IbmapsState;
  overrides: Override[];
  pendingExport: { signalsCount: number; targetSheet: string } | null;
}

/**
 * Generate the IBMAPS XML and trigger a browser download.
 *
 * If there is no pending export (no new signals) the original ibmaps
 * content is downloaded unchanged.
 */
export function exportIbmapsFile({
  templateId,
  raw,
  originalIbmaps,
  overrides,
  pendingExport,
}: ExportIbmapsParams): void {
  // No pending export → download current ibmaps as-is
  if (!pendingExport) {
    downloadXml(
      originalIbmaps.content,
      `${IBMAPS_FILENAME[templateId] ?? "export"}.ibmaps`,
    );
    return;
  }

  const newXml = generateUpdatedXml(
    templateId,
    raw,
    originalIbmaps,
    overrides,
    pendingExport.signalsCount,
  );

  downloadXml(
    newXml,
    `${IBMAPS_FILENAME[templateId] ?? "UPDATED"}-UPDATED.ibmaps`,
  );
}

// ---------------------------------------------------------------------------
// Core generation logic — selects the right pipeline per template
// ---------------------------------------------------------------------------

function generateUpdatedXml(
  templateId: string,
  raw: RawWorkbook,
  originalIbmaps: IbmapsState,
  overrides: Override[],
  signalsCount: number,
): string {
  const signalsSheet = raw.sheets.find((s) => s.name === "Signals");
  if (!signalsSheet) throw new Error("Signals sheet not found");

  const totalRows = signalsSheet.rows.length;
  const startIdx = totalRows - signalsCount;
  if (startIdx < 0) throw new Error("Invalid row count calculation");

  // Build a keep/delete mask for the new signals
  const allExtracted = extractSignalsFromWorkbook(raw, templateId);
  const newExtracted = allExtracted.slice(-signalsCount);
  const deletedIds = new Set(
    overrides.filter((o) => o.type === "delete").map((o) => o.signalId),
  );
  const keepMask = newExtracted.map((s) => !deletedIds.has(s.id));

  const filterSurviving = <T>(signals: T[]): T[] =>
    signals.filter((_, i) => keepMask[i]);

  // Find max device index for new device creation
  const maxDeviceIndex = originalIbmaps.devices.reduce(
    (max, d) => Math.max(max, d.index),
    -1,
  );

  switch (templateId) {
    case "knx__modbus-master":
      return generateKnxMbm(
        signalsSheet,
        startIdx,
        signalsCount,
        originalIbmaps,
        filterSurviving,
        maxDeviceIndex,
      );

    case "bacnet-server__knx":
      return generateBacKnx(
        signalsSheet,
        startIdx,
        signalsCount,
        originalIbmaps,
        filterSurviving,
      );

    case "modbus-slave__knx":
      return generateMbsKnx(
        signalsSheet,
        startIdx,
        signalsCount,
        originalIbmaps,
        filterSurviving,
      );

    case "knx__bacnet-client":
      return generateKnxBac(
        signalsSheet,
        startIdx,
        signalsCount,
        originalIbmaps,
        filterSurviving,
      );

    case "modbus-slave__bacnet-client":
      return generateMbsBac(
        signalsSheet,
        startIdx,
        signalsCount,
        originalIbmaps,
        filterSurviving,
      );

    default:
      // BACnet → Modbus Master (default)
      return generateBacMbm(
        signalsSheet,
        startIdx,
        signalsCount,
        originalIbmaps,
        filterSurviving,
        maxDeviceIndex,
      );
  }
}

// ---------------------------------------------------------------------------
// Per-template generators (thin wrappers that adapt raw rows → ibmaps XML)
// ---------------------------------------------------------------------------

type FilterFn = <T>(signals: T[]) => T[];

function generateKnxMbm(
  sheet: RawSheet,
  startIdx: number,
  count: number,
  ibmaps: IbmapsState,
  filterSurviving: FilterFn,
  maxDeviceIndex: number,
): string {
  const allNew = workbookRowsToKnxRawSignals(sheet, startIdx, count);
  const newSignals = filterSurviving(allNew);

  const baseSignals = parseIbmapsSignals_KNX_MBM(ibmaps.content).signals;
  const baseMaxId = maxIdxExternal(baseSignals);

  const normalized: KNXRawSignal[] = newSignals.map((s, i) => ({
    ...s,
    idxExternal: baseMaxId + 1 + i,
  }));

  const newDevices: IbmapsDevice[] = collectNewModbusDevices(
    normalized.map((s) => s.modbus.deviceIndex),
    maxDeviceIndex,
  );

  return addModbusSignals_KNX_MBM(ibmaps.content, normalized, newDevices);
}

function generateBacKnx(
  sheet: RawSheet,
  startIdx: number,
  count: number,
  ibmaps: IbmapsState,
  filterSurviving: FilterFn,
): string {
  const allNew = workbookRowsToBACKNXSignals(sheet, startIdx, count);
  const newSignals = filterSurviving(allNew);

  const baseSignals = parseIbmapsSignals_BAC_KNX(ibmaps.content).signals;
  const baseMaxId = maxIdxExternal(baseSignals);

  const nextInstByType = buildNextInstanceMap(baseSignals);

  const normalized: BACKNXRawSignal[] = newSignals.map((s, i) => {
    const type = s.bacnet.type;
    const instance = nextInstByType.get(type) ?? 0;
    nextInstByType.set(type, instance + 1);
    return {
      ...s,
      idxExternal: baseMaxId + 1 + i,
      bacnet: { ...s.bacnet, instance },
    };
  });

  return addKNXSignals_BAC_KNX(ibmaps.content, normalized);
}

function generateMbsKnx(
  sheet: RawSheet,
  startIdx: number,
  count: number,
  ibmaps: IbmapsState,
  filterSurviving: FilterFn,
): string {
  const allNew = workbookRowsToMBSKNXSignals(sheet, startIdx, count);
  const newSignals = filterSurviving(allNew);

  const baseSignals = parseIbmapsSignals_MBS_KNX(ibmaps.content).signals;
  const baseMaxId = maxIdxExternal(baseSignals);

  const normalized: MBSKNXRawSignal[] = newSignals.map((s, i) => ({
    ...s,
    idxExternal: baseMaxId + 1 + i,
  }));

  return addSignals_MBS_KNX(ibmaps.content, normalized);
}

function generateKnxBac(
  sheet: RawSheet,
  startIdx: number,
  count: number,
  ibmaps: IbmapsState,
  filterSurviving: FilterFn,
): string {
  const allNew = workbookRowsToKNXBACSignals(sheet, startIdx, count);
  const newSignals = filterSurviving(allNew);

  const parseResult = parseIbmapsSignals_KNX_BAC(ibmaps.content);
  const baseMaxId = maxIdxExternal(parseResult.signals);
  const existingMaxDevIdx = maxDeviceIdx(parseResult.devices);

  const normalized: KNXBACRawSignal[] = newSignals.map((s, i) => ({
    ...s,
    idxExternal: baseMaxId + 1 + i,
  }));

  const newBacnetDevices: BACnetClientDevice[] = collectNewBacnetDevices(
    normalized.map((s) => s.bacnetClient.deviceIndex),
    existingMaxDevIdx,
  );

  return addSignals_KNX_BAC(ibmaps.content, normalized, newBacnetDevices);
}

function generateMbsBac(
  sheet: RawSheet,
  startIdx: number,
  count: number,
  ibmaps: IbmapsState,
  filterSurviving: FilterFn,
): string {
  const allNew = workbookRowsToMBSBACSignals(sheet, startIdx, count);
  const newSignals = filterSurviving(allNew);

  const parseResult = parseIbmapsSignals_MBS_BAC(ibmaps.content);
  const baseMaxId = maxIdxExternal(parseResult.signals);
  const existingMaxDevIdx = maxDeviceIdx(parseResult.devices);

  const normalized: MBSBACRawSignal[] = newSignals.map((s, i) => ({
    ...s,
    idxExternal: baseMaxId + 1 + i,
  }));

  const newBacnetDevices: BACnetClientDevice[] = collectNewBacnetDevices(
    normalized.map((s) => s.bacnetClient.deviceIndex),
    existingMaxDevIdx,
  );

  return addSignals_MBS_BAC(ibmaps.content, normalized, newBacnetDevices);
}

function generateBacMbm(
  sheet: RawSheet,
  startIdx: number,
  count: number,
  ibmaps: IbmapsState,
  filterSurviving: FilterFn,
  maxDeviceIndex: number,
): string {
  const allNew = workbookRowsToRawSignals(sheet, startIdx, count);
  const newSignals = filterSurviving(allNew);

  const baseSignals = parseIbmapsSignals_BAC_MBM(ibmaps.content).signals;
  const baseMaxId = baseSignals.reduce(
    (max: number, s: RawSignal) => Math.max(max, s.idxExternal),
    -1,
  );

  const nextInstByType = buildNextInstanceMap(baseSignals);

  const normalized: RawSignal[] = newSignals.map((s, i) => {
    const type = s.bacnet.type;
    const instance = nextInstByType.get(type) ?? 0;
    nextInstByType.set(type, instance + 1);
    return {
      ...s,
      idxExternal: baseMaxId + 1 + i,
      bacnet: { ...s.bacnet, instance },
    };
  });

  const newDevices: IbmapsDevice[] = collectNewModbusDevices(
    normalized.map((s) => s.modbus.deviceIndex),
    maxDeviceIndex,
  );

  return addModbusSignals_BAC_MBM(ibmaps.content, normalized, newDevices);
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function maxIdxExternal(signals: { idxExternal: number }[]): number {
  return signals.reduce((max, s) => Math.max(max, s.idxExternal), -1);
}

function maxDeviceIdx(devices: { index: number }[]): number {
  return devices.reduce((max, d) => Math.max(max, d.index), -1);
}

/** Build a map of BACnet type → next available instance number. */
function buildNextInstanceMap(
  signals: { bacnet: { type: number; instance: number } }[],
): Map<number, number> {
  const map = new Map<number, number>();
  for (const s of signals) {
    const cur = map.get(s.bacnet.type) ?? -1;
    map.set(s.bacnet.type, Math.max(cur, s.bacnet.instance));
  }
  for (const [t, m] of map) map.set(t, m + 1);
  return map;
}

function makeModbusDevice(index: number, slaveNum: number): IbmapsDevice {
  return {
    index,
    name: `Device ${index}`,
    slaveNum,
    baseRegister: 0,
    timeout: 1000,
    enabled: true,
  };
}

function makeBacnetDevice(index: number): BACnetClientDevice {
  return {
    index,
    name: `Device ${index}`,
    enabled: true,
    ip: "192.168.100.10",
    port: 47808,
    objInstance: index,
  };
}

/** Collect unique device indices that exceed the existing max and create Modbus Devices for each. */
function collectNewModbusDevices(
  deviceIndices: number[],
  existingMaxIndex: number,
): IbmapsDevice[] {
  const uniqueNew = [
    ...new Set(deviceIndices.filter((idx) => idx > existingMaxIndex)),
  ].sort((a, b) => a - b);
  return uniqueNew.map((idx) => makeModbusDevice(idx, 10 + idx));
}

/** Collect unique device indices that exceed the existing max and create BACnet Devices for each. */
function collectNewBacnetDevices(
  deviceIndices: number[],
  existingMaxIndex: number,
): BACnetClientDevice[] {
  const uniqueNew = [
    ...new Set(deviceIndices.filter((idx) => idx > existingMaxIndex)),
  ].sort((a, b) => a - b);
  return uniqueNew.map((idx) => makeBacnetDevice(idx));
}

/** Trigger a browser download for the given XML content. */
function downloadXml(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
