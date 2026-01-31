import { useState, useCallback } from 'react';
import type { DeviceSignal } from '@/lib/deviceSignals';
import type { TemplateId } from '@/types/page.types';
import type { AIModel } from '@/lib/ai/config';

export type AIParseStatus =
  | { status: 'idle' }
  | { status: 'uploading'; file: File; progress: number }
  | { status: 'parsing'; file: File }
  | {
      status: 'review';
      signals: (DeviceSignal & { confidence: number })[];
      warnings: string[];
      fileName: string;
    }
  | { status: 'error'; error: string; code?: string };

interface AIParseResult {
  signals: DeviceSignal[];
  warnings: string[];
  metadata: {
    fileName: string;
    signalsFound: number;
    confidenceStats: {
      high: number;
      medium: number;
      low: number;
    };
  };
}

interface UseAIParserReturn {
  state: AIParseStatus;
  parseFile: (
    file: File,
    templateId: TemplateId,
    model?: AIModel,
  ) => Promise<void>;
  reset: () => void;
  acceptSignals: () => (DeviceSignal & { confidence: number })[] | null;
  retry: (file: File, templateId: TemplateId, model?: AIModel) => Promise<void>;
}

export function useAIParser(): UseAIParserReturn {
  const [state, setState] = useState<AIParseStatus>({ status: 'idle' });

  const parseFile = useCallback(
    async (file: File, templateId: TemplateId, model?: AIModel) => {
      setState({ status: 'uploading', file, progress: 0 });

      try {
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setState((prev) => {
            if (prev.status === 'uploading' && prev.progress < 90) {
              return { ...prev, progress: prev.progress + 10 };
            }
            return prev;
          });
        }, 500);

        // Create form data
        const formData = new FormData();
        formData.append('file', file);
        formData.append('templateId', templateId);
        if (model) {
          formData.append('model', model);
        }

        setState({ status: 'parsing', file });

        // Call API
        const response = await fetch('/api/parse-file', {
          method: 'POST',
          body: formData,
        });

        clearInterval(progressInterval);

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to parse file');
        }

        const result: AIParseResult = await response.json();

        // Store signals with confidence in review state
        setState({
          status: 'review',
          signals: result.signals as (DeviceSignal & { confidence: number })[],
          warnings: result.warnings,
          fileName: result.metadata.fileName,
        });
      } catch (error) {
        setState({
          status: 'error',
          error:
            error instanceof Error ? error.message : 'Unknown error occurred',
        });
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setState({ status: 'idle' });
  }, []);

  const acceptSignals = useCallback(():
    | (DeviceSignal & { confidence: number })[]
    | null => {
    if (state.status === 'review') {
      return state.signals;
    }
    return null;
  }, [state]);

  const retry = useCallback(
    async (file: File, templateId: TemplateId, model?: AIModel) => {
      setState({ status: 'idle' });
      await parseFile(file, templateId, model);
    },
    [parseFile],
  );

  return {
    state,
    parseFile,
    reset,
    acceptSignals,
    retry,
  };
}
