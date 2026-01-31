'use client';

import { useMemo, useState } from 'react';
import { parseDeviceSignalsCSV, type DeviceSignal } from '@/lib/deviceSignals';
import { generateBACnetFromModbus } from '@/lib/actions/generateBACnetFromModbus';
import { generateModbusFromBACnet } from '@/lib/actions/generateModbusFromBACnet';
import { generateKNXFromModbus } from '@/lib/actions/generateKNXFromModbus';
import { generateKNXFromBACnet } from '@/lib/actions/generateKNXFromBACnet';
import { generateBACnetServerFromKNX } from '@/lib/actions/generateBACnetServerFromKNX';
import { generateModbusFromKNX } from '@/lib/actions/generateModbusFromKNX';
import { applyOverridesToWorkbook } from '@/lib/overrides';
import { useFileImport } from '@/hooks/useFileImport';
import { TEMPLATES } from '@/constants/templates';
import { TemplateSelector } from '@/components/TemplateSelector';
import { ProtocolsInfo } from '@/components/ProtocolsInfo';
import { DeviceSignalsSection } from '@/components/DeviceSignalsSection';
import { ResultsSection } from '@/components/ResultsSection';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { Header } from '@/components/Header';
import type { Override } from '@/types/overrides';

export default function Home() {
  const { raw, setRaw, protocols, error, busy, importArrayBufferAsFile } =
    useFileImport();

  const [selectedTemplateId, setSelectedTemplateId] = useState<
    (typeof TEMPLATES)[number]['id']
  >(TEMPLATES[0].id);
  const [csvInput, setCsvInput] = useState('');
  const [deviceSignals, setDeviceSignals] = useState<DeviceSignal[]>([]);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [pendingExport, setPendingExport] = useState<{
    signalsCount: number;
    targetSheet: string;
  } | null>(null);

  const selectedTemplate = useMemo(
    () => TEMPLATES.find((t) => t.id === selectedTemplateId)!,
    [selectedTemplateId],
  );

  const sheetNames = useMemo(
    () => (raw ? raw.sheets.map((s) => s.name) : []),
    [raw],
  );

  async function onLoadTemplate(templateId: (typeof TEMPLATES)[number]['id']) {
    try {
      const template = TEMPLATES.find((t) => t.id === templateId);
      if (!template) return;

      const res = await fetch(template.href);
      if (!res.ok) throw new Error('Could not load template.');

      const arrayBuffer = await res.arrayBuffer();
      await importArrayBufferAsFile(
        arrayBuffer,
        template.href.split('/').pop()!,
        template.expectedSheets,
      );

      // Reset pending export quan carrega nova plantilla
      setPendingExport(null);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleCustomFileSelect(file: File) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      await importArrayBufferAsFile(arrayBuffer, file.name);
      setPendingExport(null);
    } catch (e) {
      console.error(e);
    }
  }

  function onCopyPrompt() {
    navigator.clipboard.writeText(selectedTemplate.promptText);
  }

  /**
   * Parse CSV and add signals to current list
   * Pure function that doesn't depend on state
   */
  function parseAndAddSignals(csv: string) {
    setParseWarnings([]);

    if (!csv.trim()) {
      setParseWarnings(['El CSV està buit.']);
      return;
    }

    const result = parseDeviceSignalsCSV(csv, selectedTemplateId);
    setDeviceSignals((prev) => [...prev, ...result.signals]);
    setParseWarnings(result.warnings);
  }

  /**
   * Parse CSV from textarea input
   */
  function onParseCsv() {
    parseAndAddSignals(csvInput);
  }

  function onClearSignals() {
    setDeviceSignals([]);
    setParseWarnings([]);
    setCsvInput('');
  }

  function onGenerateSignals() {
    if (!raw || deviceSignals.length === 0) return;

    try {
      let result;

      // Dispatch to correct action based on gateway type
      if (selectedTemplateId === 'bacnet-server__modbus-master') {
        result = generateBACnetFromModbus(deviceSignals, raw, 'simple');
      } else if (selectedTemplateId === 'modbus-slave__bacnet-client') {
        result = generateModbusFromBACnet(deviceSignals, raw, 'simple');
      } else if (selectedTemplateId === 'knx__modbus-master') {
        result = generateKNXFromModbus(deviceSignals, raw);
      } else if (selectedTemplateId === 'knx__bacnet-client') {
        result = generateKNXFromBACnet(deviceSignals, raw);
      } else if (selectedTemplateId === 'modbus-slave__knx') {
        result = generateModbusFromKNX(deviceSignals, raw);
      } else if (selectedTemplateId === 'bacnet-server__knx') {
        result = generateBACnetServerFromKNX(deviceSignals, raw);
      } else {
        throw new Error(
          `Gateway type not implemented yet: ${selectedTemplateId}`,
        );
      }

      setRaw(result.updatedWorkbook);

      if (result.warnings.length > 0) {
        setParseWarnings((prev) => [...prev, ...result.warnings]);
      }

      // Determinar target sheet segons template
      const targetSheet = selectedTemplateId.includes('bacnet-server')
        ? 'BACnet Server'
        : selectedTemplateId.includes('modbus')
          ? 'Modbus Master'
          : 'KNX';

      // Mostrar badge persistent
      setPendingExport((prev) => ({
        signalsCount: (prev?.signalsCount ?? 0) + result.rowsAdded,
        targetSheet,
      }));

      // Clear CSV input i signals després de generar
      setCsvInput('');
      setDeviceSignals([]);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error desconegut';
      setParseWarnings((prev) => [...prev, message]);
    }
  }

  async function handleExport(overrides: Override[]) {
    if (!raw) return;

    try {
      // Apply overrides to workbook before exporting
      const workbookToExport = applyOverridesToWorkbook(
        raw,
        overrides,
        selectedTemplateId,
      );

      // Export the modified workbook
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workbookToExport),
      });

      if (!res.ok) {
        throw new Error('Error exportant.');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'export.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setPendingExport(null);
    } catch (e) {
      console.error('Export error:', e);
      // Error will be shown via the error state if needed
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
        {/* Gateway Templates */}
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Gateway Templates</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Select a gateway type to automatically load the template.
          </p>

          <TemplateSelector
            selectedTemplateId={selectedTemplateId}
            onTemplateChange={setSelectedTemplateId}
            onLoadTemplate={onLoadTemplate}
            onCustomFileSelect={handleCustomFileSelect}
            busy={busy}
          />

          <ProtocolsInfo protocols={protocols} />
        </section>

        {/* Import device signals (només visible si hi ha plantilla carregada) */}
        {raw && (
          <DeviceSignalsSection
            template={selectedTemplate}
            csvInput={csvInput}
            onCsvInputChange={setCsvInput}
            onParseCSV={onParseCsv}
            parseAndAddSignals={parseAndAddSignals}
            onCopyPrompt={onCopyPrompt}
            onGenerateSignals={onGenerateSignals}
            onClearSignals={onClearSignals}
            deviceSignals={deviceSignals}
            parseWarnings={parseWarnings}
            busy={busy}
          />
        )}

        {/* Errors */}
        <ErrorDisplay error={error} />

        {/* Resultats (RAW + Export) */}
        {raw && (
          <ResultsSection
            raw={raw}
            sheetNames={sheetNames}
            onExport={handleExport}
            busy={busy}
            pendingExport={pendingExport}
            templateId={selectedTemplateId}
          />
        )}
      </main>
    </div>
  );
}
