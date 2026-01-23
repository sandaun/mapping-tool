/**
 * Script per extreure fixtures del workbook KNX per testing
 * Usage: tsx scripts/extract-fixtures-knx.ts
 */

import { readFileSync, writeFileSync } from 'fs';
import { workbookArrayBufferToRaw } from '../src/lib/excel/raw';
import type { ModbusSignal } from '../src/lib/deviceSignals';

const FIXTURES_DIR = './src/lib/actions/__tests__/fixtures/knx-from-modbus';
const SIGNALS_CSV_PATH = `${FIXTURES_DIR}/source/signals.csv`;
const WORKBOOK_PATH = `${FIXTURES_DIR}/source/generated-workbook.xlsx`;

/**
 * Parsejar el CSV de signals Modbus
 * Usa una estratègia que respecta el format fix de columnes
 */
function parseModbusSignalsCSV(csvContent: string): ModbusSignal[] {
  const lines = csvContent.trim().split('\n');
  
  // Skip header line
  const dataLines = lines.slice(1);
  
  const signals: ModbusSignal[] = [];
  
  for (const line of dataLines) {
    if (!line.trim()) continue;
    
    // Format: deviceId,signalName,registerType,address,dataType,units,description,mode,factor
    // Com que description pot tenir comes, processem de forma més intel·ligent
    // Columnes 0-5 són segures (no tenen comes internes)
    // Columna 6 (description) pot tenir comes
    // Columna 7 (mode) i 8 (factor) són al final
    
    const parts = line.split(',');
    
    if (parts.length < 5) continue; // Need at least deviceId, signalName, registerType, address, dataType
    
    const deviceId = parts[0].trim();
    const signalName = parts[1].trim();
    const registerType = parts[2].trim();
    const address = parseInt(parts[3].trim(), 10);
    const dataType = parts[4].trim();
    const units = parts[5]?.trim() || undefined;
    
    // Les últimes 2 columnes són mode i factor
    const mode = parts[parts.length - 2]?.trim() || undefined;
    const factorStr = parts[parts.length - 1]?.trim();
    const factor = factorStr && factorStr !== '' ? parseFloat(factorStr) : undefined;
    
    // La descripció és tot el que queda entre units i mode (poden ser múltiples parts per comes internes)
    let description: string | undefined;
    if (parts.length > 7) {
      // Agafar des de index 6 fins l'últim-2 (abans de mode)
      const descParts = parts.slice(6, parts.length - 2);
      const descText = descParts.join(',').trim();
      description = descText || undefined;
    } else {
      description = parts[6]?.trim() || undefined;
    }
    
    if (isNaN(address) || !deviceId || !signalName || !registerType || !dataType) {
      console.warn(`⚠️  Skipping invalid line: ${line}`);
      continue;
    }
    
    const signal: ModbusSignal = {
      deviceId,
      signalName,
      registerType,
      address,
      dataType,
    };
    
    // Add optional fields only if they exist
    if (units) signal.units = units;
    if (description) signal.description = description;
    if (mode) signal.mode = mode;
    if (factor !== undefined && !isNaN(factor)) signal.factor = factor;
    
    signals.push(signal);
  }
  
  return signals;
}

async function extractFixtures() {
  console.log('📖 Llegint CSV de signals Modbus (per KNX)...');
  
  // Llegir CSV amb signals
  const csvContent = readFileSync(SIGNALS_CSV_PATH, 'utf-8');
  const modbusSignals = parseModbusSignalsCSV(csvContent);
  console.log(`✅ Parseades ${modbusSignals.length} signals Modbus del CSV`);
  
  // Guardar signals
  const signalsPath = `${FIXTURES_DIR}/input-signals.json`;
  writeFileSync(signalsPath, JSON.stringify(modbusSignals, null, 2));
  console.log(`✅ Guardat input-signals.json`);
  
  console.log('\n📖 Llegint workbook KNX real...');
  
  // Llegir workbook
  const buffer = readFileSync(WORKBOOK_PATH);
  const rawWorkbook = workbookArrayBufferToRaw(buffer.buffer);
  
  console.log(`✅ Workbook llegit: ${rawWorkbook.sheets.length} sheets`);
  
  // Guardar workbook complet com a expected output
  const expectedOutputPath = `${FIXTURES_DIR}/expected-output.json`;
  writeFileSync(expectedOutputPath, JSON.stringify(rawWorkbook, null, 2));
  console.log(`✅ Guardat expected-output.json`);
  
  // Trobar el sheet Signals
  const signalsSheet = rawWorkbook.sheets.find(s => s.name === 'Signals');
  if (!signalsSheet) {
    throw new Error('No s\'ha trobat el sheet Signals');
  }
  
  // Trobar headerRowIdx (row amb "Active", "Description", etc.)
  const headerRowIdx = signalsSheet.rows.findIndex(row => 
    row.some(cell => cell === 'Active')
  );
  
  if (headerRowIdx < 0) {
    throw new Error('No s\'ha trobat la row de headers');
  }
  
  console.log(`✅ Headers trobats a row ${headerRowIdx}`);
  
  // Crear template buit (només headers, sense data rows)
  const emptyWorkbook = {
    sheets: rawWorkbook.sheets.map(sheet => ({
      ...sheet,
      rows: sheet.name === 'Signals' 
        ? sheet.rows.slice(0, headerRowIdx + 1) // Només fins headers
        : sheet.rows
    }))
  };
  
  const templatePath = `${FIXTURES_DIR}/input-workbook.json`;
  writeFileSync(templatePath, JSON.stringify(emptyWorkbook, null, 2));
  console.log(`✅ Guardat input-workbook.json (template buit)`);
  
  console.log('\n✨ Fixtures KNX creats correctament!');
  console.log(`   - ${modbusSignals.length} signals Modbus`);
  console.log(`   - Template workbook amb ${emptyWorkbook.sheets.length} sheets`);
  console.log(`   - Expected output amb ${rawWorkbook.sheets[0].rows.length} rows`);
}

extractFixtures().catch(console.error);
