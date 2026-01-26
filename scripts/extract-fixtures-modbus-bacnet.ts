/**
 * Script per extreure fixtures del workbook Modbus per testing
 * Usage: tsx scripts/extract-fixtures-modbus-bacnet.ts
 */

import { readFileSync, writeFileSync } from 'fs';
import { workbookArrayBufferToRaw } from '../src/lib/excel/raw';
import type { BACnetSignal } from '../src/lib/deviceSignals';

const FIXTURES_DIR = './src/lib/actions/__tests__/fixtures/modbus-from-bacnet';
const SIGNALS_CSV_PATH = `${FIXTURES_DIR}/source/signals.csv`;
const WORKBOOK_PATH = `${FIXTURES_DIR}/source/generated-workbook.xlsx`;

/**
 * Parsejar el CSV de signals BACnet
 * Format: deviceId,signalName,objectType,instance,units,description
 */
function parseBACnetSignalsCSV(csvContent: string): BACnetSignal[] {
  const lines = csvContent.trim().split('\n');
  
  // Skip header line
  const dataLines = lines.slice(1);
  
  const signals: BACnetSignal[] = [];
  
  for (const line of dataLines) {
    if (!line.trim()) continue;
    
    // Format: deviceId,signalName,objectType,instance,units,description
    const parts = line.split(',');
    
    if (parts.length < 4) continue; // Need at least deviceId, signalName, objectType, instance
    
    const deviceId = parts[0].trim();
    const signalName = parts[1].trim();
    const objectType = parts[2].trim();
    const instance = parseInt(parts[3].trim(), 10);
    const units = parts[4]?.trim() || undefined;
    
    // Description pot tenir comes internes, així que agafem tot el que queda
    let description: string | undefined;
    if (parts.length > 5) {
      const descParts = parts.slice(5);
      const descText = descParts.join(',').trim();
      description = descText || undefined;
    }
    
    if (isNaN(instance) || !deviceId || !signalName || !objectType) {
      console.warn(`⚠️  Skipping invalid line: ${line}`);
      continue;
    }
    
    const signal: BACnetSignal = {
      deviceId,
      signalName,
      objectType,
      instance,
    };
    
    // Add optional fields only if they exist
    if (units) signal.units = units;
    if (description) signal.description = description;
    
    signals.push(signal);
  }
  
  return signals;
}

async function extractFixtures() {
  console.log('📖 Llegint CSV de signals BACnet...');
  
  // Llegir CSV amb signals
  const csvContent = readFileSync(SIGNALS_CSV_PATH, 'utf-8');
  const bacnetSignals = parseBACnetSignalsCSV(csvContent);
  console.log(`✅ Parseades ${bacnetSignals.length} signals BACnet del CSV`);
  
  // Guardar signals
  const signalsPath = `${FIXTURES_DIR}/input-signals.json`;
  writeFileSync(signalsPath, JSON.stringify(bacnetSignals, null, 2));
  console.log(`✅ Guardat input-signals.json`);
  
  console.log('\n📖 Llegint workbook Modbus real...');
  
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
  
  console.log('\n✨ Fixtures Modbus creats correctament!');
  console.log(`   - ${bacnetSignals.length} signals BACnet`);
  console.log(`   - Template workbook amb ${emptyWorkbook.sheets.length} sheets`);
  console.log(`   - Expected output amb ${rawWorkbook.sheets[0].rows.length} rows`);
}

extractFixtures().catch(console.error);
