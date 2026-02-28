import { useState, useMemo, useCallback } from 'react';
import type { DeviceSignal } from '@/lib/deviceSignals';
import type { Template, TemplateId } from '@/types/page.types';
import type { EditableRow } from '@/types/overrides';
import type {
  SignalInputType,
  SignalLibraryRecord,
} from '@/types/signal-library';
import { useAIParser } from '@/hooks/useAIParser';
import {
  TEMPLATE_INPUT_TYPE,
  PROVIDER_LABEL,
  isAIProvider,
} from '@/lib/ai-providers';
import { convertSignalsToCSV } from '@/lib/signals-csv';

// ---------------------------------------------------------------------------
// Props the hook receives (same shape the component used to receive)
// ---------------------------------------------------------------------------

export interface UseSignalsInputParams {
  template: Template;
  csvInput: string;
  onCsvInputChange: (value: string) => void;
  onParseCSV: () => void;
  parseAndAddSignals: (csv: string) => void;
  onCopyPrompt: () => void;
  onGenerateSignals: (deviceCount?: number) => void;
  generateWithSignals: (signals: DeviceSignal[], deviceCount?: number) => void;
  onClearSignals: () => void;
  deviceSignals: DeviceSignal[];
  inputWarnings: string[];
  busy?: boolean;
}

// ---------------------------------------------------------------------------
// Metadata kept for the save-to-library dialog
// ---------------------------------------------------------------------------

export interface SaveDialogMeta {
  signals: DeviceSignal[];
  manufacturer: string | null;
  model: string | null;
  inputType: SignalInputType;
  provider?: string;
  warnings?: string[];
  confidenceStats?: { high: number; medium: number; low: number };
  fileName?: string;
  fileType?: string;
  fileSize?: number;
}

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

const LOCAL_STORAGE_KEY = 'ai-parsed-signals';
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 h

function loadSavedFlag(): boolean {
  if (typeof window === 'undefined') return false;

  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!saved) return false;

  try {
    const parsed = JSON.parse(saved);
    if (Date.now() - parsed.timestamp < MAX_AGE_MS) return true;
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }
  return false;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSignalsInput(params: UseSignalsInputParams) {
  const {
    template,
    csvInput,
    onParseCSV,
    parseAndAddSignals,
    onCopyPrompt,
    onGenerateSignals,
    generateWithSignals,
    onClearSignals,
    deviceSignals,
    inputWarnings,
    busy = false,
  } = params;

  // UI toggles
  const [showManualInput, setShowManualInput] = useState(false);
  const [deviceCount, setDeviceCount] = useState(1);
  const [analyzingProvider, setAnalyzingProvider] = useState('AI');
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveDialogMeta, setSaveDialogMeta] = useState<SaveDialogMeta | null>(
    null,
  );
  const [hasSavedData, setHasSavedData] = useState(loadSavedFlag);

  // Derived values
  const inputType = TEMPLATE_INPUT_TYPE[template.id as TemplateId] ?? 'modbus';
  const isParsed = deviceSignals.length > 0;
  const canClear =
    isParsed || csvInput.trim().length > 0 || inputWarnings.length > 0;
  const isKNXFlow = template.id.includes('knx');

  // AI parser integration
  const {
    state: aiState,
    parseFile,
    reset: resetAI,
    acceptSignals,
  } = useAIParser();

  // Signal table data (read-only view)
  const signalsTableData: EditableRow[] = useMemo(() => {
    return deviceSignals.map((sig, index) => {
      let type = '—';
      let address: string | number = '—';

      if ('objectType' in sig) {
        type = sig.objectType;
        address = sig.instance;
      } else if ('registerType' in sig) {
        type = sig.registerType;
        address = sig.address;
      } else if ('dpt' in sig) {
        type = sig.dpt;
        address = 'groupAddress' in sig ? sig.groupAddress : '—';
      }

      return {
        id: `signal-${index}`,
        Device: 'deviceId' in sig ? sig.deviceId : '—',
        Name: sig.signalName,
        Type: type,
        Address: String(address),
        Units: 'units' in sig ? (sig.units ?? '—') : '—',
      };
    });
  }, [deviceSignals]);

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------

  const resolveProviderLabel = useCallback(async (): Promise<string> => {
    try {
      const response = await fetch('/api/parse-file', { method: 'GET' });
      if (!response.ok) return 'AI';

      const data: unknown = await response.json();
      const provider =
        typeof data === 'object' && data !== null
          ? (data as { currentProvider?: unknown }).currentProvider
          : undefined;

      if (!isAIProvider(provider)) return 'AI';
      return PROVIDER_LABEL[provider];
    } catch {
      return 'AI';
    }
  }, []);

  const handleFileSelect = useCallback(
    async (file: File) => {
      setAnalyzingProvider(await resolveProviderLabel());
      await parseFile(file, template.id);
    },
    [resolveProviderLabel, parseFile, template.id],
  );

  const handleAcceptSignals = useCallback(() => {
    const signals = acceptSignals();
    if (!signals) return;

    generateWithSignals(signals, deviceCount);

    // Trigger save-to-library dialog with AI metadata
    if (aiState.status === 'review' && inputType !== 'knx') {
      setSaveDialogMeta({
        signals,
        manufacturer: aiState.manufacturer,
        model: aiState.model,
        inputType,
        provider: aiState.metadata?.provider,
        warnings: aiState.warnings,
        confidenceStats: aiState.metadata?.confidenceStats,
        fileName: aiState.metadata?.fileName,
        fileType: aiState.metadata?.fileType,
        fileSize: aiState.metadata?.fileSize,
      });
      setShowSaveDialog(true);
    }

    resetAI();

    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({
        signals,
        fileName: aiState.status === 'review' ? aiState.fileName : 'unknown',
        timestamp: Date.now(),
      }),
    );
  }, [
    acceptSignals,
    generateWithSignals,
    deviceCount,
    aiState,
    inputType,
    resetAI,
  ]);

  const handleManualGenerate = useCallback(() => {
    if (deviceSignals.length > 0 && inputType !== 'knx') {
      setSaveDialogMeta({
        signals: [...deviceSignals],
        manufacturer: null,
        model: null,
        inputType,
      });
      setShowSaveDialog(true);
    }
    onGenerateSignals(deviceCount);
  }, [deviceSignals, inputType, onGenerateSignals, deviceCount]);

  const handleLoadFromLibrary = useCallback(
    (record: SignalLibraryRecord, libraryDeviceCount: number) => {
      generateWithSignals(record.signals, libraryDeviceCount);
    },
    [generateWithSignals],
  );

  const handleLoadSaved = useCallback(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      const csv = convertSignalsToCSV(parsed.signals);
      parseAndAddSignals(csv);
      setHasSavedData(false);
    } catch {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, [parseAndAddSignals]);

  const handleSaveDialogOpenChange = useCallback((isOpen: boolean) => {
    setShowSaveDialog(isOpen);
    if (!isOpen) setSaveDialogMeta(null);
  }, []);

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  return {
    // AI parser state
    aiState,
    resetAI,

    // UI state
    showManualInput,
    setShowManualInput,
    deviceCount,
    setDeviceCount,
    analyzingProvider,
    showLibraryModal,
    setShowLibraryModal,
    showSaveDialog,
    handleSaveDialogOpenChange,
    saveDialogMeta,
    hasSavedData,

    // Derived values
    inputType,
    isParsed,
    canClear,
    isKNXFlow,
    signalsTableData,

    // Handlers
    handleFileSelect,
    handleAcceptSignals,
    handleManualGenerate,
    handleLoadFromLibrary,
    handleLoadSaved,

    // Pass-through (kept so UI sub-components don't need raw params)
    template,
    csvInput,
    onCsvInputChange: params.onCsvInputChange,
    onParseCSV,
    onCopyPrompt,
    onClearSignals,
    deviceSignals,
    inputWarnings,
    busy,
  } as const;
}

/** Convenience type for consumers that destructure the hook return. */
export type SignalsInputState = ReturnType<typeof useSignalsInput>;
