'use client';

import { useMemo, useState } from 'react';
import { parseDeviceSignalsCSV, type DeviceSignal } from '@/lib/deviceSignals';
import { generateBACnetFromModbus } from '@/lib/actions/generateBACnetFromModbus';
import { generateModbusFromBACnet } from '@/lib/actions/generateModbusFromBACnet';
import { generateKNXFromModbus } from '@/lib/actions/generateKNXFromModbus';
import { generateKNXFromBACnet } from '@/lib/actions/generateKNXFromBACnet';
import { generateBACnetServerFromKNX } from '@/lib/actions/generateBACnetServerFromKNX';
import { generateModbusFromKNX } from '@/lib/actions/generateModbusFromKNX';
import { useFileImport } from '@/hooks/useFileImport';
import { TEMPLATES } from '@/constants/templates';
import { TemplateSelector } from '@/components/TemplateSelector';
import { ProtocolsInfo } from '@/components/ProtocolsInfo';
import { DeviceSignalsSection } from '@/components/DeviceSignalsSection';
import { ResultsSection } from '@/components/ResultsSection';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { Header } from '@/components/Header';

export default function Home() {
  const {
    raw,
    setRaw,
    protocols,
    error,
    busy,
    importArrayBufferAsFile,
    exportWorkbook,
  } = useFileImport();

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
    [selectedTemplateId]
  );

  const sheetNames = useMemo(
    () => (raw ? raw.sheets.map((s) => s.name) : []),
    [raw]
  );

  async function onLoadTemplate(templateId: (typeof TEMPLATES)[number]['id']) {
    try {
      const template = TEMPLATES.find((t) => t.id === templateId);
      if (!template) return;

      const res = await fetch(template.href);
      if (!res.ok) throw new Error("No s'ha pogut carregar la plantilla.");

      const arrayBuffer = await res.arrayBuffer();
      await importArrayBufferAsFile(
        arrayBuffer,
        template.href.split('/').pop()!,
        template.expectedSheets
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

  function onParseCsv() {
    setParseWarnings([]);
    setDeviceSignals([]);

    if (!csvInput.trim()) {
      setParseWarnings(['El CSV està buit.']);
      return;
    }

    const result = parseDeviceSignalsCSV(csvInput, selectedTemplateId);
    setDeviceSignals(result.signals);
    setParseWarnings(result.warnings);
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
        result = generateKNXFromModbus(deviceSignals, raw, {
          startGroupAddress: '0/0/1',
        });
      } else if (selectedTemplateId === 'knx__bacnet-client') {
        result = generateKNXFromBACnet(deviceSignals, raw, {
          startGroupAddress: '0/0/1',
        });
      } else if (selectedTemplateId === 'modbus-slave__knx') {
        result = generateModbusFromKNX(deviceSignals, raw, {
          startAddress: 0,
        });
      } else if (selectedTemplateId === 'bacnet-server__knx') {
        result = generateBACnetServerFromKNX(deviceSignals, raw, {
          startInstance: 0,
        });
      } else {
        throw new Error(
          `Gateway type not implemented yet: ${selectedTemplateId}`
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
      setPendingExport({
        signalsCount: deviceSignals.length,
        targetSheet,
      });

      // Clear CSV input i signals després de generar
      setCsvInput('');
      setDeviceSignals([]);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error desconegut';
      setParseWarnings((prev) => [...prev, message]);
    }
  }

  function handleExport() {
    exportWorkbook();
    setPendingExport(null);
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
        {/* Gateway Templates */}
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Gateway Templates</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Selecciona un gateway type per carregar la plantilla automàticament.
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
            onCopyPrompt={onCopyPrompt}
            onGenerateSignals={onGenerateSignals}
            deviceSignals={deviceSignals}
            parseWarnings={parseWarnings}
            pendingExport={pendingExport}
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
          />
        )}
      </main>
    </div>
  );
}
