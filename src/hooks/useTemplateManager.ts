import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { TEMPLATES } from '@/constants/templates';

/**
 * Hook to manage template selection and loading
 * Encapsulates template-related state and operations
 *
 * Note: Confirmation flow for pending changes is handled by the parent component,
 * not by this hook. This keeps the hook simple and reusable.
 */
export const useTemplateManager = (
  importArrayBufferAsFile: (
    arrayBuffer: ArrayBuffer,
    fileName: string,
    expectedSheets?: string[],
    baseXlsxHref?: string,
  ) => Promise<void>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _hasPendingChanges: boolean = false, // Kept for API compatibility, unused
) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<
    (typeof TEMPLATES)[number]['id']
  >(TEMPLATES[0].id);

  // Track if initial load has happened
  const hasInitialLoadRef = useRef(false);

  const selectedTemplate = useMemo(
    () => TEMPLATES.find((t) => t.id === selectedTemplateId)!,
    [selectedTemplateId],
  );

  /**
   * Change the selected template ID (does not load it)
   */
  const handleTemplateChange = useCallback(
    (templateId: (typeof TEMPLATES)[number]['id']) => {
      setSelectedTemplateId(templateId);
    },
    [],
  );

  const loadTemplate = useCallback(
    async (templateId: (typeof TEMPLATES)[number]['id']) => {
      try {
        const template = TEMPLATES.find((t) => t.id === templateId);
        if (!template) return;

        const res = await fetch(template.href);
        if (!res.ok) throw new Error('Could not load template.');

        const arrayBuffer = await res.arrayBuffer();
        await importArrayBufferAsFile(
          arrayBuffer,
          template.href.split('/').pop()!,
          template.expectedSheets ? [...template.expectedSheets] : undefined,
          template.baseXlsxHref,
        );
      } catch (e) {
        console.error(e);
      }
    },
    [importArrayBufferAsFile],
  );

  const loadCustomFile = useCallback(
    async (file: File) => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        await importArrayBufferAsFile(arrayBuffer, file.name);
      } catch (e) {
        console.error(e);
      }
    },
    [importArrayBufferAsFile],
  );

  // Auto-load the default template on mount
  useEffect(() => {
    if (!hasInitialLoadRef.current) {
      hasInitialLoadRef.current = true;
      loadTemplate(TEMPLATES[0].id);
    }
  }, [loadTemplate]);

  return {
    selectedTemplateId,
    selectedTemplate,
    handleTemplateChange,
    loadTemplate,
    loadCustomFile,
  };
};
