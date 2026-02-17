"use client";

import { useState, useMemo } from "react";
import type { DeviceSignal } from "@/lib/deviceSignals";
import type { Template } from "@/types/page.types";
import type { EditableRow } from "@/types/overrides";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EditableTable } from "./EditableTable";
import { FileUploader } from "./FileUploader";
import { AISignalReviewPanel } from "./AISignalReviewPanel";
import { useAIParser } from "@/hooks/useAIParser";
import {
  Loader2,
  ChevronDown,
  ChevronUp,
  Save,
  Sparkles,
  FileText,
  Wand2,
  Check,
  Zap,
} from "lucide-react";
import { NumberStepper } from "@/components/ui/NumberStepper";

type SignalsInputSectionProps = {
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
  busy: boolean;
};

type AIProvider = "openai" | "groq" | "cerebras";

const PROVIDER_LABEL: Record<AIProvider, string> = {
  openai: "OpenAI",
  groq: "Groq",
  cerebras: "Cerebras",
};

function isAIProvider(value: unknown): value is AIProvider {
  return value === "openai" || value === "groq" || value === "cerebras";
}

function shouldUseOpenAIForFile(file: File): boolean {
  return (
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
}

export function SignalsInputSection({
  template,
  csvInput,
  onCsvInputChange,
  onParseCSV,
  parseAndAddSignals,
  onCopyPrompt,
  onGenerateSignals,
  generateWithSignals,
  onClearSignals,
  deviceSignals,
  inputWarnings,
  busy,
}: SignalsInputSectionProps) {
  const [showManualInput, setShowManualInput] = useState(false);
  const [deviceCount, setDeviceCount] = useState(1);
  const [analyzingProvider, setAnalyzingProvider] = useState("AI");

  const [hasSavedData, setHasSavedData] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem("ai-parsed-signals");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const age = Date.now() - parsed.timestamp;
        const MAX_AGE = 24 * 60 * 60 * 1000;
        if (age < MAX_AGE) {
          return true;
        } else {
          localStorage.removeItem("ai-parsed-signals");
        }
      } catch {
        localStorage.removeItem("ai-parsed-signals");
      }
    }
    return false;
  });

  const { state, parseFile, reset, acceptSignals } = useAIParser();

  const isParsed = deviceSignals.length > 0;
  const canClear =
    isParsed || csvInput.trim().length > 0 || inputWarnings.length > 0;

  const isKNXFlow = template.id.includes("knx");

  const signalsTableData: EditableRow[] = useMemo(() => {
    return deviceSignals.map((sig, index) => {
      let type = "—";
      let address: string | number = "—";

      if ("objectType" in sig) {
        type = sig.objectType;
        address = sig.instance;
      } else if ("registerType" in sig) {
        type = sig.registerType;
        address = sig.address;
      } else if ("dpt" in sig) {
        type = sig.dpt;
        address = "groupAddress" in sig ? sig.groupAddress : "—";
      }

      return {
        id: `signal-${index}`,
        Device: "deviceId" in sig ? sig.deviceId : "—",
        Name: sig.signalName,
        Type: type,
        Address: String(address),
        Units: "units" in sig ? (sig.units ?? "—") : "—",
      };
    });
  }, [deviceSignals]);

  const resolveProviderLabel = async (file: File): Promise<string> => {
    if (shouldUseOpenAIForFile(file)) return PROVIDER_LABEL.openai;

    try {
      const response = await fetch("/api/parse-file", { method: "GET" });
      if (!response.ok) return "AI";

      const data: unknown = await response.json();
      const provider =
        typeof data === "object" && data !== null
          ? (data as { currentProvider?: unknown }).currentProvider
          : undefined;

      if (!isAIProvider(provider)) return "AI";
      return PROVIDER_LABEL[provider];
    } catch {
      return "AI";
    }
  };

  const handleFileSelect = async (file: File) => {
    setAnalyzingProvider(await resolveProviderLabel(file));
    await parseFile(file, template.id);
  };

  const handleAcceptSignals = () => {
    const signals = acceptSignals();
    if (signals) {
      generateWithSignals(signals, deviceCount);

      reset();

      const timestamp = Date.now();
      localStorage.setItem(
        "ai-parsed-signals",
        JSON.stringify({
          signals,
          fileName: state.status === "review" ? state.fileName : "unknown",
          timestamp,
        }),
      );
    }
  };

  const handleLoadSaved = () => {
    const saved = localStorage.getItem("ai-parsed-signals");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const csv = convertSignalsToCSV(parsed.signals);
        parseAndAddSignals(csv);
        setHasSavedData(false);
      } catch {
        localStorage.removeItem("ai-parsed-signals");
      }
    }
  };

  const convertSignalsToCSV = (signals: DeviceSignal[]): string => {
    if (signals.length === 0) return "";

    const firstSignal = signals[0];

    if ("registerType" in firstSignal) {
      const headers =
        "deviceId,signalName,registerType,address,dataType,units,description,mode,factor";
      const rows = signals.map((s) => {
        const sig = s as typeof firstSignal;
        return `${sig.deviceId},${sig.signalName},${sig.registerType},${sig.address},${sig.dataType},${sig.units || ""},${sig.description || ""},${sig.mode || ""},${sig.factor || ""}`;
      });
      return [headers, ...rows].join("\n");
    } else if ("objectType" in firstSignal) {
      const headers =
        "deviceId,signalName,objectType,instance,units,description";
      const rows = signals.map((s) => {
        const sig = s as typeof firstSignal;
        return `${sig.deviceId},${sig.signalName},${sig.objectType},${sig.instance},${sig.units || ""},${sig.description || ""}`;
      });
      return [headers, ...rows].join("\n");
    } else if ("groupAddress" in firstSignal) {
      const headers = "signalName,groupAddress,dpt,description";
      const rows = signals.map((s) => {
        const sig = s as typeof firstSignal;
        return `${sig.signalName},${sig.groupAddress},${sig.dpt},${sig.description || ""}`;
      });
      return [headers, ...rows].join("\n");
    }

    return "";
  };

  return (
    <div className="space-y-6">
      {hasSavedData && (
        <div className="rounded-lg border border-blue-200 dark:border-blue-400/30 bg-blue-50 dark:bg-blue-950/20 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Save className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-blue-800 dark:text-blue-300">
              You have previously parsed signals saved
            </span>
          </div>
          <Button
            onClick={handleLoadSaved}
            variant="neutral"
            size="sm"
            className="text-xs"
          >
            Load saved
          </Button>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-primary" />
          AI-Powered File Upload
        </h3>

        {state.status === "idle" && (
          <FileUploader onFileSelect={handleFileSelect} disabled={busy} />
        )}

        {state.status === "uploading" && (
          <div className="rounded-lg border border-blue-200 dark:border-blue-400/30 bg-blue-50 dark:bg-blue-950/20 p-6 text-center">
            <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-2" />
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Uploading {state.file.name}...
            </p>
            <div className="mt-3 w-full bg-blue-200 dark:bg-blue-900/40 rounded-full h-2">
              <div
                className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all"
                style={{ width: `${state.progress}%` }}
              />
            </div>
          </div>
        )}

        {state.status === "parsing" && (
          <div className="rounded-lg border border-blue-200 dark:border-blue-400/30 bg-blue-50 dark:bg-blue-950/20 p-6 text-center">
            <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-2" />
            <p className="text-sm text-blue-800 dark:text-blue-300 flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              {analyzingProvider} is analyzing {state.file.name}...
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400/70 mt-1">
              This may take 10-30 seconds depending on file size
            </p>
          </div>
        )}

        {state.status === "review" && (
          <AISignalReviewPanel
            signals={state.signals}
            aiWarnings={state.warnings}
            fileName={state.fileName}
            onAccept={handleAcceptSignals}
            onRetry={() => {
              if (state.status === "review") {
                reset();
              }
            }}
            deviceCount={deviceCount}
            onDeviceCountChange={setDeviceCount}
            templateId={template.id}
          />
        )}

        {state.status === "error" && (
          <div className="rounded-lg border border-red-200 dark:border-red-400/30 bg-red-50 dark:bg-red-950/20 p-4">
            <p className="text-sm text-red-800 dark:text-red-300 font-medium">
              Error parsing file
            </p>
            <p className="text-xs text-red-600 dark:text-red-400/70 mt-1">
              {state.error}
            </p>
            <Button
              onClick={reset}
              variant="neutral"
              size="sm"
              className="mt-3 text-xs"
            >
              Try Again
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <button
          onClick={() => setShowManualInput(!showManualInput)}
          className="w-full px-4 py-3 bg-muted/50 hover:bg-muted flex items-center justify-between text-sm font-medium transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            Or paste CSV manually
          </span>
          {showManualInput ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {showManualInput && (
          <div className="p-4 space-y-4">
            <details className="rounded-lg border border-border bg-muted/30 p-3">
              <summary className="cursor-pointer text-sm font-medium flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-primary" />
                AI Prompt Helper
              </summary>
              <pre className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                {template.promptText}
              </pre>
              <Button
                type="button"
                onClick={onCopyPrompt}
                variant="neutral"
                size="sm"
                className="mt-3 text-xs"
              >
                Copy Prompt
              </Button>
            </details>

            <textarea
              value={csvInput}
              onChange={(e) => onCsvInputChange(e.target.value)}
              placeholder="deviceId,signalName,registerType,address,dataType..."
              rows={8}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />

            <div className="flex items-center justify-end gap-3">
              <Button
                onClick={onParseCSV}
                disabled={!csvInput.trim() || busy}
                variant="primary-action"
                size="sm"
              >
                Parse Signals
              </Button>
            </div>
          </div>
        )}
      </div>

      {inputWarnings.length > 0 && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-400/30 bg-amber-50 dark:bg-amber-950/20 p-4">
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="bg-amber-600">
              {inputWarnings.length}
            </Badge>
            <span className="text-sm font-semibold text-amber-900 dark:text-amber-300">
              Warnings
            </span>
          </div>
          <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-amber-800 dark:text-amber-300/80">
            {inputWarnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {deviceSignals.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-secondary bg-transparent text-secondary"
              >
                <Check className="w-3 h-3 mr-1" />
                PARSED
              </Badge>
              <span className="text-sm font-medium text-foreground">
                {deviceSignals.length} signals ready
              </span>
            </div>
            <div className="flex items-center gap-2">
              {!isKNXFlow && (
                <NumberStepper
                  value={deviceCount}
                  onChange={setDeviceCount}
                  label="Devices"
                  min={1}
                  max={99}
                />
              )}
              <Button
                onClick={() => onGenerateSignals(deviceCount)}
                disabled={busy}
                variant="primary-action"
                size="sm"
              >
                <Zap className="w-3.5 h-3.5" />
                Accept & Generate
              </Button>
              <Button
                onClick={onClearSignals}
                disabled={!canClear || busy}
                variant="neutral"
                size="sm"
              >
                Clear
              </Button>
            </div>
          </div>

          <div className="max-h-64 overflow-auto">
            <EditableTable data={signalsTableData} />
          </div>
        </div>
      )}
    </div>
  );
}
