/**
 * Script per extreure fixtures del workbook Modbus per testing
 * Usage: tsx scripts/extract-fixtures-modbus-knx.ts
 */

import { readFileSync, writeFileSync } from 'fs';
import { workbookArrayBufferToRaw } from '../src/lib/excel/raw';
import type { KNXSignal } from '../src/lib/deviceSignals';

const FIXTURES_DIR = './src/lib/actions/__tests__/fixtures/modbus-from-knx';
const SIGNALS_CSV_PATH = `${FIXTURES_DIR}/source/signals.csv`;
const WORKBOOK_PATH = `${FIXTURES_DIR}/source/generated-workbook.xlsx`;

/**
 * Parsejar el CSV ETS Export
 * Format: Category, Subcategory, Name, "GroupAddress", ..., "DPST-X-Y", ...
 */
function parseKNXSignalsFromETS(csvContent: string): KNXSignal[] {
  const lines = csvContent.trim().split('\n');
  
  const signals: KNXSignal[] = [];
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    // Parse CSV amb quotes i comes
    // Format típic: " , ,""Signal Name"",""2/1/0"","""","""","""",""DPST-1-1"",""Auto"""
    const match = line.match(/,\s*""([^"]+)""\s*,\s*""([^"]+)""\s*,.*""(DPST-\d+-\d+)""/);
    
    if (!match) continue; // Skip lines sense format vàlid
    
    const signalName = match[1].trim();
    const groupAddress = match[2].trim();
    const dpstRaw = match[3].trim();
    
    // Convert DPST-X-Y to DPT X.Y
    const dptMatch = dpstRaw.match(/DPST-(\d+)-(\d+)/);
    if (!dptMatch) continue;
    
    const dpt = `${dptMatch[1]}.${dptMatch[2].padStart(3, '0')}`;
    
    if (!signalName || !groupAddress || !dpt) continue;
    
    const signal: KNXSignal = {
      signalName,
      groupAddress,
      dpt,
    };
    
    signals.push(signal);
  }
  
  return signals;
}

async function extractFixtures() {
  console.log('📖 Llegint CSV ETS Export (per Modbus)...');
  
  // Llegir CSV amb signals
  const csvContent = readFileSync(SIGNALS_CSV_PATH, 'utf-8');
  const knxSignals = parseKNXSignalsFromETS(csvContent);
  console.log(`✅ Parseades ${knxSignals.length} signals KNX del CSV`);
  
  // Guardar signals
  const signalsPath = `${FIXTURES_DIR}/input-signals.json`;
  writeFileSync(signalsPath, JSON.stringify(knxSignals, null, 2));
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
  console.log(`   - ${knxSignals.length} signals KNX`);
  console.log(`   - Template workbook amb ${emptyWorkbook.sheets.length} sheets`);
  console.log(`   - Expected output amb ${rawWorkbook.sheets[0].rows.length} rows`);
}

extractFixtures().catch(console.error);
