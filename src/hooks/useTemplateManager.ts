import { useState, useMemo } from 'react';
import { TEMPLATES } from '@/constants/templates';

/**
 * Hook to manage template selection and loading
 * Encapsulates template-related state and operations
 */
export const useTemplateManager = (
  importArrayBufferAsFile: (
    arrayBuffer: ArrayBuffer,
    fileName: string,
    expectedSheets?: string[],
    baseXlsxHref?: string,
  ) => Promise<void>,
  onPendingExportReset: () => void,
) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<
    (typeof TEMPLATES)[number]['id']
  >(TEMPLATES[0].id);

  const selectedTemplate = useMemo(
    () => TEMPLATES.find((t) => t.id === selectedTemplateId)!,
    [selectedTemplateId],
  );

  const handleTemplateChange = (
    templateId: (typeof TEMPLATES)[number]['id'],
  ) => {
    setSelectedTemplateId(templateId);
  };

  const loadTemplate = async (templateId: (typeof TEMPLATES)[number]['id']) => {
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

      onPendingExportReset();
    } catch (e) {
      console.error(e);
    }
  };

  const loadCustomFile = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      await importArrayBufferAsFile(arrayBuffer, file.name);
      onPendingExportReset();
    } catch (e) {
      console.error(e);
    }
  };

  return {
    selectedTemplateId,
    selectedTemplate,
    handleTemplateChange,
    loadTemplate,
    loadCustomFile,
  };
};
