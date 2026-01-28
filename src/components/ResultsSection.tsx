import type { RawWorkbook } from '@/lib/excel/raw';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { IbmapsState } from '@/hooks/useFileImport';
import { addModbusSignals_BAC_MBM } from '@/lib/ibmaps/generator';
import type { RawSignal } from '@/lib/ibmaps/types';

type ResultsSectionProps = {
  raw: RawWorkbook;
  sheetNames: string[];
  onExport: () => void;
  busy: boolean;
  pendingExport: { signalsCount: number; targetSheet: string } | null;
  originalIbmaps?: IbmapsState | null;
};

export function ResultsSection({
  raw,
  sheetNames,
  onExport,
  busy,
  pendingExport,
  originalIbmaps,
}: ResultsSectionProps) {

  const handleExportIbmaps = () => {
    if (!originalIbmaps || !pendingExport) return;

    try {
      // 1. Extract new signals from RAW
      const signalsSheet = raw.sheets.find((s) => s.name === 'Signals');
      if (!signalsSheet) throw new Error('Signals sheet not found');
      
      const totalRows = signalsSheet.rows.length;
      const count = pendingExport.signalsCount;
      const startIdx = totalRows - count;
      
      // Safety check
      if (startIdx < 0) throw new Error('Invalid row count calculation');

      const newRows = signalsSheet.rows.slice(startIdx);
      const headers = signalsSheet.headers;
      
      const findCol = (name: string) => headers.indexOf(name);
      
      const safeNumber = (val: any, fallback: number = -1) => {
        const n = Number(val);
        return isNaN(n) ? fallback : n;
      };
      
      // 2. Map rows to RawSignal (Simplified mapping inverse of adapter)
      const newSignals: RawSignal[] = newRows.map(row => {
          // Internal (BACnet)
          // #, Description, Name, Type, Instance, ...
          const bacName = String(row[findCol('Name')] ?? '');
          const type = safeNumber(row[findCol('Type')]);
          const instance = safeNumber(row[findCol('Instance')]);
          
          // External (Modbus) - Need to find offset if headers are repeated (#)
          // Adapter uses predictable indices: 
          // Internal cols ends at 11, External starts at 12
          
          const deviceIndexRaw = safeNumber(row[13]?.toString().replace('Device ', ''), 0); 
          const deviceIndex = isNaN(deviceIndexRaw) ? 0 : deviceIndexRaw; // Fallback
          
          const modSlave = safeNumber(row[14], 0);
          const modRead = safeNumber(row[16]);
          const modWrite = safeNumber(row[17]);
          const modFormat = safeNumber(row[19], 99);
          const modAddr = safeNumber(row[21]);
          
          const idxExternal = safeNumber(row[0], 0);

          return {
            idxExternal,
            name: bacName,
            direction: 'BACnet->Modbus',
            bacnet: {
              bacName: bacName,
              type,
              instance,
              units: -1, 
              extraAttrs: {},
              map: {
                address: modAddr,
                regType: -1, // Not specifically in Excel usually? Adapter sets it? 
                dataType: -1,
                readFunc: modRead,
                writeFunc: modWrite,
                extraAttrs: {}
              }
            },
            modbus: {
              deviceIndex,
              slaveNum: modSlave,
              address: modAddr,
              readFunc: modRead,
              writeFunc: modWrite,
              regType: modFormat,
              virtual: false, // Created signals are real usually
              extraAttrs: {}
            }
          } as RawSignal;
      });

      // 3. Generate XML
      const newXml = addModbusSignals_BAC_MBM(originalIbmaps.content, newSignals);

      // 4. Download
      const blob = new Blob([newXml], { type: 'text/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'IN-BAC-MBM-UPDATED.ibmaps';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

    } catch (e) {
      console.error('Export error:', e);
      alert('Error exporting IBMAPS');
    }
  };

  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Sheets detected:</span>
          {sheetNames.map((name) => (
            <Badge key={name} variant="outline">
              {name}
            </Badge>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {pendingExport && (
            <div className="flex items-center gap-2 text-sm text-foreground">
              <span className="text-secondary text-lg font-bold">✓</span>
              <span className="text-sm font-medium text-foreground">
                {pendingExport.signalsCount} signals ready to export
              </span>
            </div>
          )}
          
          <Button
            type="button"
            onClick={onExport}
            disabled={busy}
            variant="outline"
            size="lg"
            className="border-primary bg-primary/5 text-primary hover:border-primary/60 hover:bg-primary/10 hover:text-primary dark:bg-primary/10 dark:hover:bg-primary/15"
          >
            Export Signals Template
          </Button>

          {originalIbmaps && (
             <Button
             type="button"
             onClick={handleExportIbmaps}
             disabled={busy || !pendingExport}
             variant="default"
             size="lg"
           >
             Export IBMAPS
           </Button>
          )}
        </div>
      </div>

      <details className="mt-4 rounded-lg border border-border bg-muted/50 p-3">
        <summary className="cursor-pointer text-sm font-medium text-foreground">
          View RAW JSON
        </summary>
        <pre className="mt-3 max-h-120 overflow-auto text-xs leading-5 text-muted-foreground">
          {JSON.stringify(raw, null, 2)}
        </pre>
      </details>
    </section>
  );
}

