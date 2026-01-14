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
import { ManualImport } from '@/components/ManualImport';
import { DeviceSignalsSection } from '@/components/DeviceSignalsSection';
import { ResultsSection } from '@/components/ResultsSection';
import { ErrorDisplay } from '@/components/ErrorDisplay';

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

  const [file, setFile] = useState<File | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<
    (typeof TEMPLATES)[number]['id']
  >(TEMPLATES[0].id);
  const [csvInput, setCsvInput] = useState('');
  const [deviceSignals, setDeviceSignals] = useState<DeviceSignal[]>([]);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);

  const selectedTemplate = useMemo(
    () => TEMPLATES.find((t) => t.id === selectedTemplateId)!,
    [selectedTemplateId]
  );

  const sheetNames = useMemo(
    () => (raw ? raw.sheets.map((s) => s.name) : []),
    [raw]
  );

  async function onLoadTemplate() {
    try {
      const res = await fetch(selectedTemplate.href);
      if (!res.ok) throw new Error("No s'ha pogut carregar la plantilla.");

      const arrayBuffer = await res.arrayBuffer();
      await importArrayBufferAsFile(
        arrayBuffer,
        selectedTemplate.href.split('/').pop()!,
        selectedTemplate.expectedSheets
      );
    } catch (e) {
      console.error(e);
    }
  }

  async function onImport() {
    if (!file) return;
    const arrayBuffer = await file.arrayBuffer();
    await importArrayBufferAsFile(arrayBuffer, file.name);
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

      // Clear CSV input i signals després de generar
      setCsvInput('');
      setDeviceSignals([]);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error desconegut';
      setParseWarnings((prev) => [...prev, message]);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-10 text-zinc-900">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Excel Mapping Tool (MVP)
          </h1>
          <p className="text-sm text-zinc-600">
            Importa un <span className="font-medium">.xlsx</span>, obtén RAW
            JSON (lossless per estructura tabular) i exporta un Excel nou.
          </p>
        </header>

        {/* Plantilles de repositori */}
        <section className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-base font-semibold">Plantilles (repositori)</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Selecciona un gateway type i carrega la plantilla.
          </p>

          <TemplateSelector
            selectedTemplateId={selectedTemplateId}
            onTemplateChange={setSelectedTemplateId}
            onLoadTemplate={onLoadTemplate}
            busy={busy}
          />

          <ProtocolsInfo protocols={protocols} />
        </section>

        {/* Import manual */}
        <ManualImport
          file={file}
          onFileChange={setFile}
          onImport={onImport}
          busy={busy}
        />

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
            onExport={exportWorkbook}
            busy={busy}
          />
        )}
      </main>
    </div>
  );
}
